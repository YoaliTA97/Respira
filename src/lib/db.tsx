"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SIDECU, UMBRALES_BASE, nombreEquipo } from "./catalogos";
import { familiasDe, integrantes as integrantesDe, planInicialRelevos, relevoActual, type Integrante } from "./calculos";
import { evaluar, extraerMedicion, respuestaPorReglas, type Evaluacion, type Medicion, type Senal } from "./reglas";
import { CODIGO_DEMO, DB_VERSION, DEMO_ANTERIOR, FAMILIA_DEMO, crearSeed, fechaISO } from "./seed";
import { crearHash, verificarClave } from "./clave";
import type {
  Alerta, DB, Equipo, Evidencia, Familia, Gasto, HistoriaClinica, Id, Intercambio, ServiciosSalud, Sentir, VozPersona, LecturaSignos, Medicamento, Membresia, Mensaje, Paciente, RolFamilia, SignoId, SolicitudRed, Tono, Usuario,
} from "./types";

// Capa de datos. Cada acción corresponde a una operación del backend del MVP (Supabase con
// políticas por membresía). En esta versión los datos viven en localStorage y se sincronizan
// entre pestañas; la sesión (usuario y espacio activo) vive en sessionStorage, por pestaña.

// Simulación: las invitaciones se aceptan solas para no depender de WhatsApp ni de los tiempos de
// cada persona durante la demo. Con backend vuelve a false: la persona acepta desde su cuenta.
const ACEPTAR_INVITACIONES = true;
const ESTADO_INVITACION: Membresia["estado"] = ACEPTAR_INVITACIONES ? "activa" : "invitada";
const LS_DB = "respira-db";
const LS_ULTIMA = "respira-ultima-sesion"; // "recordarme": volver a entrar sin contraseña al reabrir (vence)
const LS_INTENTOS = "respira-intentos"; // intentos fallidos por teléfono (bloqueo temporal)
const RECORDAR_HORAS = 12;
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 5;

export type ResultadoAcceso = "ok" | "no-existe" | "sin-clave" | "error" | "bloqueada" | "codigo";
const SS_SESION = "respira-sesion";
const LS_TECH = "respira-capa-tecnica";
const TONOS: Tono[] = ["t1", "t2", "t3", "t4", "t5"];
const CENTRO_CDMX = { lat: 19.3567, lng: -99.0599 }; // Iztapalapa (punto de ejemplo)

const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;
// Código de unión para el QR: 3 letras del nombre + 3 dígitos (p. ej. RAM315).
const nuevoCodigo = (nombre: string) => {
  const letras = nombre.replace(/^familia\s+/i, "").normalize("NFD").replace(/[^a-zA-Z]/g, "").toUpperCase().padEnd(3, "X").slice(0, 3);
  return `${letras}${String(100 + Math.floor(Math.random() * 900))}`;
};
const ahoraISO = () => {
  const d = new Date();
  return `${fechaISO(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};
const soloDigitos = (t: string) => t.replace(/\D/g, "");

export type PerfilNuevo = Pick<Usuario, "nombre" | "telefono" | "genero" | "alcaldia" | "roles" | "experiencia" | "disponibilidad" | "ofreceAyuda" | "bio" | "aceptoTerminos" | "clave">;

export type InvitacionNueva = { nombre: string; telefono: string; parentesco: string; rol: RolFamilia; principal: boolean; genero: Usuario["genero"] };

export type ValoracionNueva = {
  medicion: Medicion;
  senales: Senal[];
  sintomas: string[];
  historia?: Omit<HistoriaClinica, "actualizada" | "porUsuarioId">;
  servicios?: Omit<ServiciosSalud, "actualizada" | "porUsuarioId">;
  nota: string;
  evidencias: { descripcion: string; foto: string }[];
};

export type UnionNueva = { nombre: string; telefono: string; genero: Usuario["genero"]; parentesco: string; clave?: Usuario["clave"] };

export type FamiliaNueva = {
  nombre: string;
  alcaldia: string;
  parentesco: string;
  paciente: {
    nombre: string; edad: number; sexo: "mujer" | "hombre"; condiciones: string[]; signos: SignoId[]; alergias: string[];
    evento: string; lesion: string; movilidad: Paciente["movilidad"];
  };
  medicamentos: { nombre: string; dosis: string; horarios: string[] }[];
  invitaciones: InvitacionNueva[];
  consentimiento: { registro: boolean; alertasWhatsApp: boolean; indicadores: boolean };
};

type Ctx = {
  db: DB;
  ahora: Date;
  usuario: Usuario | null;
  familia: Familia | null;
  membresia: Membresia | null;
  paciente: Paciente | null;
  integrantes: Integrante[];
  misFamilias: { membresia: Membresia; familia: Familia }[];
  invitaciones: { membresia: Membresia; familia: Familia }[];
  puede: (accion: "registrar" | "administrar" | "relevos") => boolean;
  capaTecnica: boolean;
  aviso: string | null;
  procesando: boolean;
  avisar: (t: string) => void;
  setCapaTecnica: (on: boolean) => void;
  // sesión y perfil
  iniciarSesion: (telefono: string, clave: string, recordar?: boolean) => Promise<ResultadoAcceso>;
  crearClave: (telefono: string, codigo: string, clave: string, recordar?: boolean) => Promise<ResultadoAcceso>;
  cambiarClave: (actual: string, nueva: string) => Promise<boolean>;
  minutosBloqueo: (telefono: string) => number;
  cerrarSesion: () => void;
  cambiarFamilia: (familiaId: Id | null) => void;
  crearCuenta: (p: PerfilNuevo) => void;
  actualizarPerfil: (p: Partial<Usuario>) => void;
  reiniciarDemo: () => void;
  borrarTodo: () => void;
  simularSeisMeses: () => void;
  borrarMiHistorial: () => void;
  // espacio familiar
  crearFamilia: (f: FamiliaNueva) => void;
  responderInvitacion: (membresiaId: Id, aceptar: boolean) => void;
  invitar: (i: InvitacionNueva) => void;
  cambiarRol: (membresiaId: Id, rol: RolFamilia) => void;
  setPrincipal: (membresiaId: Id, principal: boolean) => void;
  // relevos y red
  crearRelevo: (r: { fecha: string; inicio: number; horas: number; asignadoA: Id | null }) => void;
  asignarRelevo: (relevoId: Id, usuarioId: Id | null) => void;
  proponerIntercambio: (i: { relevoId: Id; aUsuarioId: Id; tipo: Intercambio["tipo"]; monto: number }) => void;
  responderIntercambio: (id: Id, aceptar: boolean) => void;
  solicitarRed: (s: { relevoId: Id; usuarioId: Id; pago: SolicitudRed["pago"]; monto: number }) => void;
  responderSolicitud: (id: Id, aceptar: boolean) => void;
  // chat, asistente y alertas
  enviarMensaje: (texto: string) => void;
  reportar: (texto: string, opciones?: { notaVoz?: boolean; audioUrl?: string }) => Promise<void>;
  registrarSignos: (m: Medicion, nota?: string) => Promise<void>;
  atenderAlerta: (id: Id, centro?: string) => void;
  panico: (motivo: string, detalle: string) => Promise<void>;
  responderZarit: (respuestas: number[]) => void;
  responderAlerta: (alertaId: Id, texto: string) => void;
  agregarGasto: (g: Omit<Gasto, "id" | "familiaId" | "registradoPor">) => void;
  quitarGasto: (id: Id) => void;
  calificar: (aUsuarioId: Id, estrellas: number, comentario: string) => void;
  guardarReparto: (reparto: Record<Id, number>) => void;
  configurarGastos: (c: { topeGastoMes?: number; aportaDeMas?: Record<Id, boolean> }) => void;
  pedirCuidado: (pedido: string, detalle: string) => Promise<void>;
  marcarNotificaciones: (ids: string[]) => void;
  // Mi voz: la persona mayor como agente activo
  guardarVoz: (v: Partial<VozPersona>) => void;
  darAccesoPersona: (telefono: string) => Id | null;
  registrarSentir: (s: Pick<Sentir, "dolor" | "animo" | "sueno" | "nota">) => void;
  marcarMeta: (metaId: Id) => void;
  registrarAporte: (actividad: string, horas: number) => void;
  guardarValoracion: (v: ValoracionNueva) => Promise<void>;
  // evidencia de seguimiento
  agregarEvidencia: (e: Pick<Evidencia, "tipo" | "descripcion" | "foto" | "lecturaId">) => void;
  confirmarEvidencia: (id: Id) => void;
  // equipo médico
  actualizarEquipo: (tipo: string, estado: Equipo["estado"] | null, de?: string) => void;
  pedirPrestamo: (tipo: string, aUsuarioId: Id) => void;
  responderPrestamo: (id: Id, aceptar: boolean) => void;
  guardarVideoGuia: (id: string, url: string) => void;
  // unión al espacio con código o QR
  unirseConCodigo: (codigo: string, como: { usuarioId: Id } | { nuevo: UnionNueva }) => Id | null;
  // persona mayor y medicación
  actualizarPaciente: (p: Partial<Paciente>) => void;
  agregarMedicamento: (m: Omit<Medicamento, "id" | "familiaId">) => void;
  quitarMedicamento: (id: Id) => void;
  marcarToma: (medicamentoId: Id, horario: string, estado: "dada" | "omitida") => void;
  // capacitación
  completarTutorial: (tutorialId: string) => void;
  agendarCertificacion: (certId: string, cita: string) => void;
  aprobarCertificacion: (certId: string) => void;
};

const DataContext = createContext<Ctx | null>(null);

// Renueva la familia de ejemplo y conserva todo lo que se creó en este navegador
// (familias, cuentas, registros). Se usa al cambiar de versión y al reiniciar la demo.
function conservar(d: Partial<DB>, semilla: DB): DB {
  // Fuera: la familia de ejemplo actual y las de versiones anteriores. Las cuentas de ejemplo anteriores
  // solo se quedan si alguien las usó en un espacio que creó (para no dejarlo sin integrantes).
  const familiasDemo = new Set([FAMILIA_DEMO, ...DEMO_ANTERIOR.familias, ...(d.familias ?? []).filter((f) => f.id.startsWith("fam-demo-")).map((f) => f.id)]);
  const ajena = (x: { familiaId: Id }) => !familiasDemo.has(x.familiaId);
  const usadas = new Set((d.membresias ?? []).filter(ajena).map((m) => m.usuarioId));
  const demoIds = new Set([...semilla.usuarios.map((u) => u.id), ...DEMO_ANTERIOR.usuarios.filter((id) => !usadas.has(id)), ...(d.usuarios ?? []).filter((u) => u.id.startsWith("u-demo-")).map((u) => u.id)]);
  const de = <T,>(x: T[] | undefined) => x ?? [];
  const medsAjenos = new Set(de(d.medicamentos).filter(ajena).map((m) => m.id));
  return {
    ...semilla,
    usuarios: [...semilla.usuarios, ...de(d.usuarios).filter((u) => !demoIds.has(u.id))],
    familias: [...semilla.familias, ...de(d.familias).filter((f) => !familiasDemo.has(f.id)).map((f) => ({ ...f, codigo: f.codigo ?? nuevoCodigo(f.nombre) }))],
    membresias: [...semilla.membresias, ...de(d.membresias).filter(ajena)],
    pacientes: [...semilla.pacientes, ...de(d.pacientes).filter(ajena)],
    medicamentos: [...semilla.medicamentos, ...de(d.medicamentos).filter(ajena)],
    tomas: [...semilla.tomas, ...de(d.tomas).filter((t) => medsAjenos.has(t.medicamentoId))],
    lecturas: [...semilla.lecturas, ...de(d.lecturas).filter(ajena)],
    relevos: [...semilla.relevos, ...de(d.relevos).filter(ajena)],
    intercambios: [...semilla.intercambios, ...de(d.intercambios).filter(ajena)],
    solicitudes: [...semilla.solicitudes, ...de(d.solicitudes).filter(ajena)],
    mensajes: [...semilla.mensajes, ...de(d.mensajes).filter(ajena)],
    alertas: [...semilla.alertas, ...de(d.alertas).filter(ajena)],
    progreso: [...semilla.progreso, ...de(d.progreso).filter((x) => !demoIds.has(x.usuarioId))],
    certificaciones: [...semilla.certificaciones, ...de(d.certificaciones).filter((x) => !demoIds.has(x.usuarioId))],
    equipos: [...semilla.equipos, ...de(d.equipos).filter(ajena)],
    prestamos: [...semilla.prestamos, ...de(d.prestamos).filter(ajena)],
    evidencias: [...semilla.evidencias, ...de(d.evidencias).filter(ajena)],
    zarit: [...semilla.zarit, ...de(d.zarit).filter((x) => !demoIds.has(x.usuarioId))],
    sentires: [...semilla.sentires, ...de(d.sentires).filter(ajena)],
    aportes: [...semilla.aportes, ...de(d.aportes).filter(ajena)],
    gastos: [...semilla.gastos, ...de(d.gastos).filter(ajena)],
    resenas: [...semilla.resenas, ...de(d.resenas).filter(ajena)],
    banco: [...semilla.banco, ...de(d.banco).filter((x) => !demoIds.has(x.deUsuarioId))],
    videosGuia: { ...(d.videosGuia ?? {}) },
    notifVistas: { ...(d.notifVistas ?? {}) },
  };
}

function leerDB(ahora: Date): DB {
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === DB_VERSION) return db;
      return conservar(db, crearSeed(ahora));
    }
  } catch {
    /* sin almacenamiento */
  }
  return crearSeed(ahora);
}

type Sesion = { usuarioId: Id | null; familiaId: Id | null };

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB | null>(null);
  const [ahora, setAhora] = useState<Date | null>(null);
  const [sesion, setSesionState] = useState<Sesion>({ usuarioId: null, familiaId: null });
  const [capaTecnica, setCapa] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbRef = useRef<DB | null>(null);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Carga después del montaje: el HTML prerenderizado no depende de datos del navegador.
  useEffect(() => {
    const now = new Date();
    let s: Sesion = { usuarioId: null, familiaId: null };
    let tech = false;
    try {
      const recordada = JSON.parse(localStorage.getItem(LS_ULTIMA) ?? "null") as (Sesion & { expira?: number }) | null;
      const vigente = recordada && (recordada.expira ?? 0) > Date.now() ? { usuarioId: recordada.usuarioId, familiaId: recordada.familiaId } : null;
      if (recordada && !vigente) localStorage.removeItem(LS_ULTIMA);
      s = JSON.parse(sessionStorage.getItem(SS_SESION) ?? "null") ?? vigente ?? s;
      if (s.usuarioId) sessionStorage.setItem(SS_SESION, JSON.stringify(s));
      tech = localStorage.getItem(LS_TECH) === "1";
    } catch {
      /* ignorar */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDb(leerDB(now));
    setAhora(now);
    setSesionState(s);
    setCapa(tech);
    const reloj = setInterval(() => setAhora(new Date()), 30_000);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_DB || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as DB;
        if (next.version === DB_VERSION) setDb(next);
      } catch {
        /* ignorar */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(reloj);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    try {
      localStorage.setItem(LS_DB, JSON.stringify(db));
    } catch {
      /* ignorar */
    }
  }, [db]);

  const setSesion = useCallback((s: Sesion, recordar?: boolean) => {
    setSesionState(s);
    try {
      sessionStorage.setItem(SS_SESION, JSON.stringify(s));
      if (!s.usuarioId) localStorage.removeItem(LS_ULTIMA);
      else if (recordar === true) localStorage.setItem(LS_ULTIMA, JSON.stringify({ ...s, expira: Date.now() + RECORDAR_HORAS * 3600_000 }));
      else if (recordar === false) localStorage.removeItem(LS_ULTIMA);
      else {
        // cambio de espacio: conserva el vencimiento si ya estaba recordada
        const r = JSON.parse(localStorage.getItem(LS_ULTIMA) ?? "null") as { usuarioId: string; expira: number } | null;
        if (r && r.usuarioId === s.usuarioId) localStorage.setItem(LS_ULTIMA, JSON.stringify({ ...s, expira: r.expira }));
      }
    } catch {
      /* ignorar */
    }
  }, []);

  const avisar = useCallback((t: string) => {
    if (timer.current) clearTimeout(timer.current);
    setAviso(t);
    timer.current = setTimeout(() => setAviso(null), 3800);
  }, []);

  const mutar = useCallback((f: (d: DB) => DB) => setDb((d) => (d ? f(d) : d)), []);

  const usuario = db?.usuarios.find((u) => u.id === sesion.usuarioId) ?? null;
  const misFamilias = useMemo(() => (db && usuario ? familiasDe(db, usuario.id) : []), [db, usuario]);
  // Solo se entra a un espacio familiar con membresía activa
  const familiaId = misFamilias.some((f) => f.familia.id === sesion.familiaId) ? sesion.familiaId : misFamilias[0]?.familia.id ?? null;
  const familia = db?.familias.find((f) => f.id === familiaId) ?? null;
  const membresia = misFamilias.find((f) => f.familia.id === familiaId)?.membresia ?? null;
  const paciente = db?.pacientes.find((p) => p.familiaId === familiaId) ?? null;
  const integrantes = useMemo(() => (db && familiaId ? integrantesDe(db, familiaId) : []), [db, familiaId]);
  const invitaciones = useMemo(
    () =>
      db && usuario
        ? db.membresias
            .filter((m) => m.usuarioId === usuario.id && m.estado === "invitada")
            .map((m) => ({ membresia: m, familia: db.familias.find((f) => f.id === m.familiaId)! }))
            .filter((x) => !!x.familia)
        : [],
    [db, usuario],
  );

  if (!db || !ahora) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted" role="status">
        Cargando Respira…
      </div>
    );
  }

  const puede: Ctx["puede"] = (accion) => {
    if (!membresia || membresia.rol === "persona") return false;
    if (accion === "administrar") return membresia.rol === "coordinacion";
    if (accion === "registrar") return membresia.rol !== "avisos";
    return membresia.rol !== "avisos";
  };

  const notificarWhatsApp = async (alerta: Alerta, fam: Familia, pac: Paciente, opciones?: { todos?: boolean; encabezado?: string }) => {
    const d = dbRef.current!;
    const principales = integrantesDe(d, fam.id).filter((i) => (opciones?.todos ? i.usuario.id !== usuario?.id : i.membresia.principal));
    const link = `${window.location.origin}/centros?lat=${fam.hogar.lat}&lng=${fam.hogar.lng}&p=${encodeURIComponent(pac.nombre)}`;
    const texto = `${opciones?.encabezado ?? `ALERTA MÉDICA de ${pac.nombre}.`} ${alerta.motivo} Lo que necesita excede lo que se puede atender en casa. Ubiquen el centro de cuidados más cercano en ${SIDECU.nombre}: ${SIDECU.url} · Cercanos al hogar: ${link}`;
    let modo: "real" | "simulado" = "simulado";
    try {
      const r = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefonos: principales.map((i) => i.usuario.telefono), texto }),
      });
      modo = ((await r.json()) as { modo: "real" | "simulado" }).modo;
    } catch {
      /* sin servidor: simulado */
    }
    mutar((x) => ({
      ...x,
      alertas: x.alertas.map((a) => (a.id === alerta.id ? { ...a, whatsapp: { enviadoA: principales.map((i) => i.usuario.nombre.split(" ")[0]), modo, texto } } : a)),
    }));
    avisar(`Alerta enviada por WhatsApp a ${principales.map((i) => i.usuario.nombre.split(" ")[0]).join(", ")}${modo === "simulado" ? " (simulado)" : ""}`);
  };

  // Reporte: reglas → asistente (IA opcional en el servidor) → lectura, alerta, aviso a la familia
  const procesarReporte = async (texto: string, medicionManual?: Medicion, extra?: { senales?: Senal[]; sintomas?: string[]; origen?: LecturaSignos["origen"] }): Promise<Id | null> => {
    const d = dbRef.current;
    if (!d || !paciente || !familia || !usuario) return null;
    setProcesando(true);
    const ext = extraerMedicion(texto);
    const senales0 = Array.from(new Set([...ext.senales, ...(extra?.senales ?? [])]));
    let medicion: Medicion = { ...ext.medicion, ...(medicionManual ?? {}) };
    let ev: Evaluacion = evaluar(medicion, senales0, paciente.umbrales, paciente.condiciones, paciente.signos);
    let respuesta = respuestaPorReglas(ev, paciente.nombre, paciente.condiciones, paciente.revisarEnMin ?? 15);
    let fuente: Mensaje["fuente"] = "reglas";
    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          medicionManual,
          senalesManual: extra?.senales ?? [],
          paciente: { nombre: paciente.nombre, edad: paciente.edad, condiciones: paciente.condiciones, alergias: paciente.alergias ?? [], evento: paciente.evento, signos: paciente.signos, umbrales: paciente.umbrales },
          historial: d.mensajes.filter((m) => m.familiaId === familia.id).slice(-6).map((m) => ({ de: m.de === "asistente" ? "asistente" : "familia", texto: m.texto })),
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { evaluacion: Evaluacion; respuesta: string; fuente: Mensaje["fuente"]; medicion: Medicion };
        ev = j.evaluacion;
        respuesta = j.respuesta;
        fuente = j.fuente;
        medicion = j.medicion;
      }
    } catch {
      /* sin servidor: reglas locales */
    }
    const ts = ahoraISO();
    // "Vuelve a revisar" que se repite o empeora en la siguiente medición (90 min) sube a alerta grave.
    const revisarEn = paciente.revisarEnMin ?? 15;
    const previa = d.lecturas
      .filter((l) => l.familiaId === familia.id)
      .sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))[0];
    const minDesde = previa ? (Date.now() - new Date(previa.fechaHora).getTime()) / 60000 : Infinity;
    if (ev.nivel === "amarillo" && previa && previa.nivel !== "verde" && minDesde <= 90) {
      ev = {
        ...ev, nivel: "rojo", titulo: "Alerta grave: se repite o empeora al volver a medir",
        motivo: `${ev.motivo} En la medición anterior ya había que volver a revisar. Lo que necesita excede lo que se puede atender en casa.`,
        acciones: Array.from(new Set([...ev.acciones, "911" as const, "centros" as const])), notificarFamilia: true,
      };
      respuesta = respuestaPorReglas(ev, paciente.nombre, paciente.condiciones, revisarEn);
    } else if (ev.nivel === "amarillo" && !respuesta.includes("Vuelve a medir")) {
      respuesta = `${respuesta} Vuelve a medir en ${revisarEn} minutos; si se repite o empeora, Respira lanza la alerta grave.`;
    }
    const hayDatos = Object.values(medicion).some((v) => v !== undefined) || ev.senales.length > 0 || !!extra?.sintomas?.length;
    const lectura: LecturaSignos | null = hayDatos
      ? {
          id: uid("l"), familiaId: familia.id, fechaHora: ts, porUsuarioId: usuario.id, ...medicion, senales: ev.senales, sintomas: extra?.sintomas,
          origen: extra?.origen ?? (medicionManual ? "formulario" : "nota de voz"), nivel: ev.nivel,
        }
      : null;
    const alerta: Alerta | null =
      ev.nivel !== "verde"
        ? { id: uid("a"), familiaId: familia.id, fechaHora: ts, nivel: ev.nivel, titulo: ev.titulo, motivo: ev.motivo, trifecta: ev.trifecta, estado: "activa", origen: "reporte", porUsuarioId: usuario.id }
        : null;
    const actual = relevoActual(d, familia.id, new Date());
    const practicas = new Set<string>();
    if (medicion.fc !== undefined || medicion.paSist !== undefined) practicas.add("signos-vitales");
    if (medicion.glucosa !== undefined) practicas.add("glucosa");
    mutar((x) => ({
      ...x,
      lecturas: lectura ? [...x.lecturas, lectura] : x.lecturas,
      alertas: alerta ? [...x.alertas, alerta] : x.alertas,
      mensajes: [
        ...x.mensajes,
        {
          id: uid("msg"), familiaId: familia.id, de: "asistente", texto: respuesta, fechaHora: ts, tipo: "respuesta", nivel: ev.nivel, hallazgos: ev.hallazgos,
          acciones: ev.acciones, tutorialId: ev.acciones.includes("tutorial") ? "movilizacion" : undefined, fuente,
        },
      ],
      relevos: actual ? x.relevos.map((r) => (r.id === actual.id && !r.recibidoEn ? { ...r, recibidoEn: ts } : r)) : x.relevos,
      progreso: x.progreso.map((p) => (p.usuarioId === usuario.id && practicas.has(p.tutorialId) ? { ...p, practicas: p.practicas + 1 } : p)),
    }));
    // Alerta grave: WhatsApp a toda la red familiar; las demás alertas, a los principales
    if (alerta && ev.notificarFamilia && familia.consentimiento.alertasWhatsApp) await notificarWhatsApp(alerta, familia, paciente, { todos: alerta.nivel === "rojo" });
    setProcesando(false);
    return lectura?.id ?? null;
  };

  // Crea un perfil mínimo para una persona invitada que aún no tiene cuenta
  const asegurarPerfil = (d: DB, i: { nombre: string; telefono: string; genero: Usuario["genero"] }): { d: DB; id: Id } => {
    const tel = soloDigitos(i.telefono);
    const existente = d.usuarios.find((u) => u.telefono === tel);
    if (existente) return { d, id: existente.id };
    const id = uid("u");
    const nuevo: Usuario = {
      id, nombre: i.nombre, telefono: tel, genero: i.genero, alcaldia: "", ubicacion: CENTRO_CDMX, bio: "", tono: TONOS[d.usuarios.length % TONOS.length],
      roles: [], experiencia: [], disponibilidad: {}, ofreceAyuda: { activo: false, radioKm: 3, modalidades: ["intercambio de horas"], tarifaHora: 0 }, saldoHoras: 0, creadoEn: ahoraISO(),
    };
    return { d: { ...d, usuarios: [...d.usuarios, nuevo] }, id };
  };

  // Bloqueo temporal tras varios intentos fallidos (por teléfono, en este dispositivo)
  const leerIntentos = (): Record<string, { n: number; hasta: number }> => {
    try {
      return JSON.parse(localStorage.getItem(LS_INTENTOS) ?? "{}");
    } catch {
      return {};
    }
  };
  function minutosBloqueo(tel: string) {
    const r = leerIntentos()[tel];
    return r && r.hasta > Date.now() ? Math.ceil((r.hasta - Date.now()) / 60000) : 0;
  }
  function registrarIntento(tel: string, ok: boolean) {
    const t = leerIntentos();
    if (ok) delete t[tel];
    else {
      const n = (t[tel]?.n ?? 0) + 1;
      t[tel] = n >= MAX_INTENTOS ? { n: 0, hasta: Date.now() + BLOQUEO_MIN * 60000 } : { n, hasta: 0 };
    }
    try {
      localStorage.setItem(LS_INTENTOS, JSON.stringify(t));
    } catch {
      /* ignorar */
    }
  }

  const ctx: Ctx = {
    db,
    ahora,
    usuario,
    familia,
    membresia,
    paciente,
    integrantes,
    misFamilias,
    invitaciones,
    puede,
    capaTecnica,
    aviso,
    procesando,
    avisar,
    setCapaTecnica: (on) => {
      setCapa(on);
      try {
        localStorage.setItem(LS_TECH, on ? "1" : "0");
      } catch {
        /* ignorar */
      }
    },
    iniciarSesion: async (telefono, clave, recordar = true) => {
      const tel = soloDigitos(telefono);
      const u = db.usuarios.find((x) => x.telefono === tel);
      if (!u) return "no-existe";
      if (!u.clave) return "sin-clave";
      if (minutosBloqueo(tel) > 0) return "bloqueada";
      if (!(await verificarClave(clave, u.clave))) {
        registrarIntento(tel, false);
        return minutosBloqueo(tel) > 0 ? "bloqueada" : "error";
      }
      registrarIntento(tel, true);
      setSesion({ usuarioId: u.id, familiaId: familiasDe(db, u.id)[0]?.familia.id ?? null }, recordar);
      return "ok";
    },
    // Crear o recuperar contraseña: se verifica con un código que en el MVP llega por WhatsApp o SMS.
    crearClave: async (telefono, codigo, clave, recordar = true) => {
      const tel = soloDigitos(telefono);
      const u = db.usuarios.find((x) => x.telefono === tel);
      if (!u) return "no-existe";
      if (minutosBloqueo(tel) > 0) return "bloqueada";
      if (codigo.trim() !== CODIGO_DEMO) {
        registrarIntento(tel, false);
        return "codigo";
      }
      registrarIntento(tel, true);
      const h = await crearHash(clave);
      mutar((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id === u.id ? { ...x, clave: h } : x)) }));
      setSesion({ usuarioId: u.id, familiaId: familiasDe(db, u.id)[0]?.familia.id ?? null }, recordar);
      return "ok";
    },
    cambiarClave: async (actual, nueva) => {
      if (!usuario) return false;
      if (usuario.clave && !(await verificarClave(actual, usuario.clave))) return false;
      const h = await crearHash(nueva);
      mutar((d) => ({ ...d, usuarios: d.usuarios.map((x) => (x.id === usuario.id ? { ...x, clave: h } : x)) }));
      avisar("Contraseña actualizada");
      return true;
    },
    minutosBloqueo: (telefono) => minutosBloqueo(soloDigitos(telefono)),
    cerrarSesion: () => setSesion({ usuarioId: null, familiaId: null }),
    cambiarFamilia: (familiaId) => setSesion({ usuarioId: sesion.usuarioId, familiaId }),
    crearCuenta: (p) => {
      const tel = soloDigitos(p.telefono);
      const existente = db.usuarios.find((u) => u.telefono === tel);
      const id = existente?.id ?? uid("u");
      const perfil: Usuario = {
        id, ...p, telefono: tel, ubicacion: existente?.ubicacion ?? CENTRO_CDMX, tono: existente?.tono ?? TONOS[db.usuarios.length % TONOS.length], saldoHoras: existente?.saldoHoras ?? 0, creadoEn: existente?.creadoEn ?? ahoraISO(),
      };
      mutar((d) => ({ ...d, usuarios: existente ? d.usuarios.map((u) => (u.id === id ? perfil : u)) : [...d.usuarios, perfil] }));
      setSesion({ usuarioId: id, familiaId: null }, true);
    },
    actualizarPerfil: (p) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.id === usuario.id ? { ...u, ...p } : u)) }));
      avisar("Perfil actualizado");
    },
    // Deja solo el caso de ejemplo: borra lo creado en este navegador y cierra la sesión.
    borrarTodo: () => {
      setDb(crearSeed(new Date()));
      setSesion({ usuarioId: null, familiaId: null });
      avisar("Listo: solo queda el caso de ejemplo");
    },
    // "Seis meses después" (cierre del pitch): Sara certificada y con IMSS, cuida a dos vecinas;
    // Doreen cumple su meta de caminar; la red de Doreen pasa de 3 a 14 personas. Solo datos de ejemplo.
    simularSeisMeses: () => {
      const hoyD = new Date();
      const f = (n: number) => fechaISO(new Date(hoyD.getTime() + n * 86400000));
      mutar((d) => {
        if (d.familias.some((x) => x.id === "fam-demo-mago")) return d;
        const fam = d.familias.find((x) => x.id === FAMILIA_DEMO);
        if (!fam) return d;
        const H = fam.hogar;
        const base = (id: string, nombre: string, tel: string, genero: Usuario["genero"], bio: string, dLat: number, dLng: number, extra: Partial<Usuario> = {}): Usuario => ({
          id, nombre, telefono: tel, genero, alcaldia: "Iztapalapa", ubicacion: { lat: H.lat + dLat, lng: H.lng + dLng }, bio, tono: "t4", roles: [], experiencia: [], disponibilidad: {},
          ofreceAyuda: { activo: false, radioKm: 2, modalidades: ["intercambio de horas"], tarifaHora: 0 }, saldoHoras: 0, creadoEn: `${f(-150)}T10:00:00`, aceptoTerminos: `${f(-150)}T10:00:00`, ...extra,
        });
        const ayuda = (radioKm: number, modalidades: Usuario["ofreceAyuda"]["modalidades"]) => ({ activo: true, radioKm, modalidades, tarifaHora: 90 });
        const nuevos: Usuario[] = [
          base("u-demo-chayo", "Chayo Medina", "5510000101", "mujer", "Vecina de la cuadra. Cuido mañanas con horas del banco de tiempo.", 0.002, -0.001, { ofreceAyuda: ayuda(1, ["intercambio de horas"]), verificado: { identidad: true, referencias: 1 } }),
          base("u-demo-tonita", "Toñita Ruiz", "5510000102", "mujer", "Vecina de don Luis. Acompaño a consultas.", -0.0015, 0.002, { ofreceAyuda: ayuda(1, ["intercambio de horas"]), verificado: { identidad: true, referencias: 1 } }),
          base("u-demo-brenda", "Brenda Salas", "5510000103", "mujer", "Cuidadora certificada (EC0669).", 0.009, -0.008, { ofreceAyuda: ayuda(4, ["pago"]), verificado: { identidad: true, referencias: 3 }, seguridadSocial: { ruta: "independiente", desde: f(-120), apartadoPct: 10 } }),
          base("u-demo-rafa", "Rafa Ortega", "5510000104", "hombre", "Vecino. Llevo a consultas en mi auto.", 0.004, 0.003, { ofreceAyuda: ayuda(2, ["intercambio de horas"]), verificado: { identidad: true, referencias: 1 } }),
          base("u-demo-ximena", "Ximena Flores", "5510000105", "mujer", "Nieta de la red: aprende a tejer con doña Doreen.", 0.003, 0.001),
          base("u-demo-sofia", "Sofía Flores", "5510000106", "mujer", "Nieta de la red: aprende a tejer con doña Doreen.", 0.003, 0.0012),
          base("u-demo-mago", "Margarita López", "5510000107", "mujer", "Doña Mago, vecina de la colonia. La cuida Sara.", 0.005, -0.004),
          base("u-demo-tere", "Teresa Vega", "5510000108", "mujer", "Doña Tere, vecina de la colonia. La cuida Sara.", -0.004, -0.003),
        ];
        const familias = [
          { ...fam, id: "fam-demo-mago", nombre: "Familia de doña Mago", creadaPor: "u-demo-mago", codigo: "MAG101", lineaBase: undefined, reparto: undefined },
          { ...fam, id: "fam-demo-tere", nombre: "Familia de doña Tere", creadaPor: "u-demo-tere", codigo: "TER102", lineaBase: undefined, reparto: undefined },
        ];
        // Relevos pagados de Sara con las dos vecinas en las últimas 4 semanas
        const relevos = Array.from({ length: 8 }, (_, k) => ({
          id: `r-demo-${k}`, familiaId: k % 2 ? "fam-demo-tere" : "fam-demo-mago", fecha: f(-2 - k * 3), inicio: 9, horas: 4, asignadoA: "u-sara", origen: "red" as const,
        }));
        const solicitudes = relevos.map((r, k) => ({ id: `s-demo-${k}`, familiaId: r.familiaId, relevoId: r.id, usuarioId: "u-sara", pago: "pago" as const, monto: 400, estado: "aceptada" as const, creadaEn: `${r.fecha}T08:00:00`, respondidaEn: `${r.fecha}T08:10:00` }));
        const banco = [
          { id: "bt-demo-1", deUsuarioId: "u-doreen", paraUsuarioId: "u-demo-ximena", horas: 2, concepto: "Clase de tejido", fecha: f(-10) },
          { id: "bt-demo-2", deUsuarioId: "u-doreen", paraUsuarioId: "u-demo-sofia", horas: 2, concepto: "Clase de tejido", fecha: f(-10) },
          { id: "bt-demo-3", deUsuarioId: "u-sara", paraUsuarioId: "u-demo-mago", horas: 4, concepto: "Acompañó a doña Mago", fecha: f(-20) },
          { id: "bt-demo-4", deUsuarioId: "u-sara", paraUsuarioId: "u-demo-tere", horas: 4, concepto: "Acompañó a doña Tere", fecha: f(-18) },
        ];
        return {
          ...d,
          usuarios: [...d.usuarios.map((u) => (u.id === "u-sara" ? { ...u, seguridadSocial: { ruta: "independiente" as const, desde: f(-60), apartadoPct: 10 }, ofreceAyuda: { activo: true, radioKm: 2, modalidades: ["pago" as const, "intercambio de horas" as const], tarifaHora: 100 } } : u)), ...nuevos],
          familias: [...d.familias, ...familias],
          relevos: [...d.relevos, ...relevos],
          solicitudes: [...d.solicitudes, ...solicitudes],
          banco: [...d.banco, ...banco],
          certificaciones: [...d.certificaciones.filter((c) => !(c.usuarioId === "u-sara" && c.id === "ec0669")), { id: "ec0669", usuarioId: "u-sara", estado: "certificada", fecha: f(-30) }],
          resenas: [...d.resenas, { id: "rs-demo-1", aUsuarioId: "u-sara", deUsuarioId: "u-demo-mago", familiaId: "fam-demo-mago", estrellas: 5, comentario: "Sara sabe lo que hace y me trata con cariño.", fecha: f(-5) }],
          pacientes: d.pacientes.map((p) =>
            p.familiaId !== FAMILIA_DEMO || !p.voz ? p : { ...p, voz: { ...p.voz, metas: p.voz.metas.map((m, i) => (i === 0 ? { ...m, hechas: Array.from({ length: 30 }, (_, k) => f(-k)) } : m)) } },
          ),
        };
      });
      avisar("Seis meses después: Sara certificada, la red de Doreen creció");
    },
    // "Yo decido sobre mis datos": la persona mayor puede borrar su historial de salud.
    borrarMiHistorial: () => {
      if (!familia || !paciente) return;
      mutar((d) => ({
        ...d,
        lecturas: d.lecturas.filter((l) => l.familiaId !== familia.id),
        sentires: d.sentires.filter((s) => s.familiaId !== familia.id),
        evidencias: d.evidencias.filter((e) => e.familiaId !== familia.id),
        pacientes: d.pacientes.map((p) => (p.id === paciente.id ? { ...p, historia: undefined, servicios: undefined } : p)),
      }));
      avisar("Tu historial de salud se borró");
    },
    reiniciarDemo: () => {
      const semilla = crearSeed(new Date());
      setDb((d) => (d ? conservar(d, semilla) : semilla));
      avisar("Datos de la familia de ejemplo reiniciados");
    },
    crearFamilia: (f) => {
      if (!usuario) return;
      const ts = ahoraISO();
      const famId = uid("fam");
      let d = db;
      const nuevasMembresias: Membresia[] = [
        { id: uid("mb"), familiaId: famId, usuarioId: usuario.id, rol: "coordinacion", parentesco: f.parentesco, principal: true, estado: "activa", desde: fechaISO(new Date()) },
      ];
      f.invitaciones.forEach((i) => {
        const r = asegurarPerfil(d, i);
        d = r.d;
        nuevasMembresias.push({ id: uid("mb"), familiaId: famId, usuarioId: r.id, rol: i.rol, parentesco: i.parentesco, principal: i.principal, estado: ESTADO_INVITACION, desde: fechaISO(new Date()) });
      });
      const pac: Paciente = {
        id: uid("p"), familiaId: famId, nombre: f.paciente.nombre, edad: f.paciente.edad, sexo: f.paciente.sexo, condiciones: f.paciente.condiciones, alergias: f.paciente.alergias,
        evento: f.paciente.condiciones.includes("caida") ? { tipo: "caida", fecha: fechaISO(new Date()), descripcion: f.paciente.evento, lesion: f.paciente.lesion } : null,
        movilidad: f.paciente.movilidad, signos: f.paciente.signos.length ? f.paciente.signos : ["fc", "fr", "pa"], umbrales: UMBRALES_BASE, notas: "",
      };
      const familiaNueva: Familia = {
        id: famId, nombre: f.nombre, alcaldia: f.alcaldia, hogar: { ...CENTRO_CDMX, referencia: `${f.alcaldia} (ubicación aproximada)` }, creadaPor: usuario.id, creadaEn: ts,
        consentimiento: { ...f.consentimiento, fecha: ts }, codigo: nuevoCodigo(f.nombre),
      };
      const final: DB = {
        ...d,
        familias: [...d.familias, familiaNueva],
        membresias: [...d.membresias, ...nuevasMembresias],
        pacientes: [...d.pacientes, pac],
        medicamentos: [...d.medicamentos, ...f.medicamentos.map((m) => ({ id: uid("med"), familiaId: famId, nombre: m.nombre, dosis: m.dosis || "Según receta", horarios: m.horarios, indicaciones: "" }))],
        relevos: [...d.relevos, ...planInicialRelevos(famId, [usuario], new Date())],
        mensajes: [
          ...d.mensajes,
          {
            id: uid("msg"), familiaId: famId, de: "asistente", tipo: "sistema", fechaHora: ts,
            texto: `Se creó el espacio de cuidado de ${pac.nombre}. Al recibirla en cada relevo, graben una nota de voz con sus signos. Las alertas se avisan por WhatsApp a los integrantes principales.`,
          },
        ],
      };
      setDb(final);
      setSesion({ usuarioId: usuario.id, familiaId: famId });
      avisar(`Espacio creado. ${f.invitaciones.length ? "Las invitaciones quedaron pendientes de aceptar." : ""}`);
    },
    responderInvitacion: (membresiaId, aceptar) => {
      const m = db.membresias.find((x) => x.id === membresiaId);
      mutar((d) => ({ ...d, membresias: aceptar ? d.membresias.map((x) => (x.id === membresiaId ? { ...x, estado: "activa" } : x)) : d.membresias.filter((x) => x.id !== membresiaId) }));
      if (aceptar && m) setSesion({ usuarioId: sesion.usuarioId, familiaId: m.familiaId });
      avisar(aceptar ? "Te uniste al espacio familiar" : "Invitación rechazada");
    },
    invitar: (i) => {
      if (!familia) return;
      let d = db;
      const r = asegurarPerfil(d, i);
      d = r.d;
      if (d.membresias.some((m) => m.familiaId === familia.id && m.usuarioId === r.id)) {
        avisar("Esa persona ya está en el espacio");
        return;
      }
      setDb({
        ...d,
        membresias: [...d.membresias, { id: uid("mb"), familiaId: familia.id, usuarioId: r.id, rol: i.rol, parentesco: i.parentesco, principal: i.principal, estado: ESTADO_INVITACION, desde: fechaISO(new Date()) }],
      });
      avisar(ACEPTAR_INVITACIONES ? `${i.nombre} ya está en el espacio (aceptada automáticamente en la simulación)` : `Invitación enviada a ${i.nombre}. Entra con su teléfono para aceptarla.`);
    },
    cambiarRol: (membresiaId, rol) => mutar((d) => ({ ...d, membresias: d.membresias.map((m) => (m.id === membresiaId ? { ...m, rol } : m)) })),
    setPrincipal: (membresiaId, principal) => mutar((d) => ({ ...d, membresias: d.membresias.map((m) => (m.id === membresiaId ? { ...m, principal } : m)) })),
    crearRelevo: (r) => {
      if (!familia) return;
      mutar((d) => ({ ...d, relevos: [...d.relevos, { id: uid("r"), familiaId: familia.id, ...r, origen: "familia" }] }));
      avisar("Relevo agregado");
    },
    asignarRelevo: (relevoId, usuarioId) => mutar((d) => ({ ...d, relevos: d.relevos.map((r) => (r.id === relevoId ? { ...r, asignadoA: usuarioId, origen: "familia" } : r)) })),
    proponerIntercambio: (i) => {
      if (!familia || !usuario) return;
      mutar((d) => ({
        ...d,
        intercambios: [...d.intercambios, { id: uid("i"), familiaId: familia.id, relevoId: i.relevoId, deUsuarioId: usuario.id, aUsuarioId: i.aUsuarioId, tipo: i.tipo, monto: i.monto, estado: "pendiente", creadoEn: ahoraISO() }],
      }));
      avisar("Propuesta enviada; la otra persona la ve en su inicio");
    },
    responderIntercambio: (id, aceptar) => {
      mutar((d) => {
        const i = d.intercambios.find((x) => x.id === id);
        if (!i) return d;
        const horas = d.relevos.find((r) => r.id === i.relevoId)?.horas ?? 0;
        return {
          ...d,
          intercambios: d.intercambios.map((x) => (x.id === id ? { ...x, estado: aceptar ? "aceptado" : "rechazado", respondidoEn: ahoraISO() } : x)),
          relevos: aceptar ? d.relevos.map((r) => (r.id === i.relevoId ? { ...r, asignadoA: i.aUsuarioId, origen: "familia" } : r)) : d.relevos,
          usuarios:
            aceptar && i.tipo === "horas"
              ? d.usuarios.map((u) => (u.id === i.deUsuarioId ? { ...u, saldoHoras: u.saldoHoras - horas } : u.id === i.aUsuarioId ? { ...u, saldoHoras: u.saldoHoras + horas } : u))
              : d.usuarios,
        };
      });
      avisar(aceptar ? "Aceptaste el intercambio; el relevo es tuyo" : "Intercambio rechazado");
    },
    solicitarRed: (s) => {
      if (!familia) return;
      mutar((d) => ({ ...d, solicitudes: [...d.solicitudes, { id: uid("s"), familiaId: familia.id, ...s, estado: "enviada", creadaEn: ahoraISO() }] }));
      const u = db.usuarios.find((x) => x.id === s.usuarioId);
      avisar(`Solicitud enviada a ${u?.nombre.split(" ")[0] ?? "la persona"}; la ve en su perfil de la red`);
    },
    responderSolicitud: (id, aceptar) => {
      mutar((d) => {
        const s = d.solicitudes.find((x) => x.id === id);
        if (!s) return d;
        return {
          ...d,
          solicitudes: d.solicitudes.map((x) => (x.id === id ? { ...x, estado: aceptar ? "aceptada" : "rechazada", respondidaEn: ahoraISO() } : x)),
          relevos: aceptar ? d.relevos.map((r) => (r.id === s.relevoId ? { ...r, asignadoA: s.usuarioId, origen: "red" } : r)) : d.relevos,
        };
      });
      avisar(aceptar ? "Aceptaste el relevo; la familia ya lo ve asignado" : "Solicitud rechazada");
    },
    enviarMensaje: (texto) => {
      if (!familia || !usuario || !texto.trim()) return;
      mutar((d) => ({ ...d, mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, texto: texto.trim(), fechaHora: ahoraISO(), tipo: "texto" }] }));
    },
    reportar: async (texto, opciones) => {
      if (!familia || !usuario || !texto.trim()) return;
      mutar((d) => ({
        ...d,
        mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, texto: texto.trim(), fechaHora: ahoraISO(), tipo: opciones?.notaVoz ? "nota de voz" : "texto", audioUrl: opciones?.audioUrl }],
      }));
      await procesarReporte(texto);
    },
    registrarSignos: async (m, nota) => {
      if (!familia || !usuario) return;
      const partes = [
        m.fc !== undefined ? `pulso ${m.fc}` : "",
        m.fr !== undefined ? `respiración ${m.fr}` : "",
        m.paSist !== undefined ? `presión ${m.paSist}/${m.paDiast ?? ""}` : "",
        m.glucosa !== undefined ? `glucosa ${m.glucosa}` : "",
        m.temperatura !== undefined ? `temperatura ${m.temperatura}` : "",
        m.dolor !== undefined ? `dolor ${m.dolor} de 10` : "",
        m.conciencia ? `está ${m.conciencia}` : "",
        nota ?? "",
      ].filter(Boolean);
      const texto = `Registro de signos: ${partes.join(", ")}`;
      mutar((d) => ({ ...d, mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, texto, fechaHora: ahoraISO(), tipo: "texto" }] }));
      await procesarReporte(texto, m);
    },
    atenderAlerta: (id, centro) => {
      const ts = ahoraISO();
      mutar((d) => ({ ...d, alertas: d.alertas.map((a) => (a.id === id ? { ...a, estado: "atendida", centroElegido: centro ?? a.centroElegido, atendidaEn: a.atendidaEn ?? ts } : a)) }));
      avisar(centro ? `Alerta atendida: van a ${centro}` : "Alerta marcada como atendida");
    },
    // Botón de pánico: lo activa quien está cuidando y avisa a toda la familia, en la app y por WhatsApp.
    panico: async (motivo, detalle) => {
      if (!familia || !usuario || !paciente) return;
      const ts = ahoraISO();
      const quien = usuario.nombre.split(" ")[0];
      const alerta: Alerta = {
        id: uid("a"), familiaId: familia.id, fechaHora: ts, nivel: "rojo", titulo: `Botón de pánico: ${motivo}`,
        motivo: `${paciente.usuarioId === usuario.id ? `${paciente.nombre} pidió ayuda de inmediato` : `${quien} pidió ayuda de inmediato con ${paciente.nombre}`}: ${motivo.toLowerCase()}.${detalle.trim() ? ` ${detalle.trim()}` : ""}`,
        trifecta: false, estado: "activa", origen: "panico", porUsuarioId: usuario.id,
      };
      mutar((d) => ({
        ...d,
        alertas: [...d.alertas, alerta],
        mensajes: [
          ...d.mensajes,
          {
            id: uid("msg"), familiaId: familia.id, de: "asistente", tipo: "respuesta", nivel: "rojo", fechaHora: ts, acciones: ["911", "centros"],
            texto: `ALERTA DE PÁNICO. ${alerta.motivo} Si no responde, le falta el aire o tiene dolor de pecho, llamen al 911. Para ubicar el centro de cuidados más cercano usen ${SIDECU.nombre}.`,
          },
        ],
      }));
      if (familia.consentimiento.alertasWhatsApp) await notificarWhatsApp(alerta, familia, paciente, { todos: true, encabezado: `ALERTA DE PÁNICO de ${quien} sobre ${paciente.nombre}.` });
      else avisar("Alerta enviada a la familia dentro de la app");
    },
    // Valoración en checklist: biométricos, síntomas y conciencia pasan por las mismas reglas que la nota de voz.
    guardarValoracion: async (v) => {
      if (!familia || !usuario || !paciente) return;
      const ts = ahoraISO();
      const m = v.medicion;
      const partes = [
        m.fc !== undefined ? `pulso ${m.fc}` : "",
        m.fr !== undefined ? `respiración ${m.fr}` : "",
        m.paSist !== undefined ? `presión ${m.paSist}/${m.paDiast ?? ""}` : "",
        m.glucosa !== undefined ? `glucosa ${m.glucosa}` : "",
        m.temperatura !== undefined ? `temperatura ${m.temperatura}` : "",
        m.spo2 !== undefined ? `oxigenación ${m.spo2}%` : "",
        m.dolor !== undefined ? `dolor ${m.dolor} de 10` : "",
        m.conciencia ? `está ${m.conciencia}` : "",
        v.sintomas.length ? `síntomas: ${v.sintomas.join(", ")}` : "",
        v.nota.trim(),
      ].filter(Boolean);
      const texto = `Valoración en checklist: ${partes.join(", ") || "sin datos"}${v.evidencias.length ? ` · ${v.evidencias.length} foto(s) de evidencia` : ""}`;
      mutar((d) => ({
        ...d,
        mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, texto, fechaHora: ts, tipo: "texto" }],
        pacientes: d.pacientes.map((p) =>
          p.id !== paciente.id
            ? p
            : {
                ...p,
                historia: v.historia ? { ...v.historia, actualizada: fechaISO(new Date()), porUsuarioId: usuario.id } : p.historia,
                servicios: v.servicios ? { ...v.servicios, actualizada: fechaISO(new Date()), porUsuarioId: usuario.id } : p.servicios,
              },
        ),
      }));
      const lecturaId = await procesarReporte(texto, m, { senales: v.senales, sintomas: v.sintomas, origen: "valoración" });
      if (v.evidencias.length) {
        mutar((d) => ({
          ...d,
          evidencias: [
            ...d.evidencias,
            ...v.evidencias.map((e) => ({ id: uid("ev"), familiaId: familia.id, tipo: "lectura" as const, descripcion: e.descripcion, foto: e.foto, lecturaId: lecturaId ?? undefined, porUsuarioId: usuario.id, fechaHora: ts })),
          ],
        }));
      }
    },
    guardarVoz: (v) => {
      if (!paciente) return;
      mutar((d) => ({
        ...d,
        pacientes: d.pacientes.map((p) =>
          p.id !== paciente.id ? p : { ...p, voz: { gustos: [], rutinas: [], noQuiero: [], permisos: {}, metas: [], ...p.voz, ...v } },
        ),
      }));
      avisar("Guardado en Mi voz");
    },
    darAccesoPersona: (telefono) => {
      if (!familia || !paciente) return null;
      const tel = soloDigitos(telefono);
      if (tel.length !== 10) return null;
      let d = db;
      const r = asegurarPerfil(d, { nombre: paciente.nombre, telefono: tel, genero: paciente.sexo });
      d = r.d;
      d = {
        ...d,
        usuarios: d.usuarios.map((u) => (u.id === r.id && !u.alcaldia ? { ...u, alcaldia: familia.alcaldia, ubicacion: { lat: familia.hogar.lat, lng: familia.hogar.lng }, roles: ["Acompañamiento"] } : u)),
        membresias: d.membresias.some((m) => m.familiaId === familia.id && m.usuarioId === r.id)
          ? d.membresias.map((m) => (m.familiaId === familia.id && m.usuarioId === r.id ? { ...m, rol: "persona" as const } : m))
          : [...d.membresias, { id: uid("mb"), familiaId: familia.id, usuarioId: r.id, rol: "persona" as const, parentesco: "Persona mayor", principal: false, estado: ESTADO_INVITACION, desde: fechaISO(new Date()) }],
        pacientes: d.pacientes.map((p) => (p.id === paciente.id ? { ...p, usuarioId: r.id } : p)),
      };
      setDb(d);
      avisar(`${paciente.nombre} ya tiene acceso: entra con su teléfono o con el QR de la familia`);
      return r.id;
    },
    registrarSentir: (x) => {
      if (!familia || !usuario) return;
      mutar((d) => ({ ...d, sentires: [...d.sentires, { ...x, id: uid("se"), familiaId: familia.id, fechaHora: ahoraISO(), porUsuarioId: usuario.id }] }));
      avisar("Gracias: tu familia ya ve cómo te sientes hoy");
    },
    marcarMeta: (metaId) => {
      if (!paciente) return;
      const hoy = fechaISO(new Date());
      mutar((d) => ({
        ...d,
        pacientes: d.pacientes.map((p) =>
          p.id !== paciente.id || !p.voz
            ? p
            : { ...p, voz: { ...p.voz, metas: p.voz.metas.map((m) => (m.id !== metaId ? m : { ...m, hechas: m.hechas.includes(hoy) ? m.hechas.filter((x) => x !== hoy) : [...m.hechas, hoy] })) } },
        ),
      }));
    },
    registrarAporte: (actividad, horas) => {
      if (!familia || !paciente?.usuarioId || horas <= 0) return;
      const quien = paciente.usuarioId;
      mutar((d) => ({
        ...d,
        aportes: [...d.aportes, { id: uid("ap"), familiaId: familia.id, usuarioId: quien, actividad, horas, fecha: fechaISO(new Date()) }],
        usuarios: d.usuarios.map((u) => (u.id === quien ? { ...u, saldoHoras: u.saldoHoras + horas } : u)),
      }));
      avisar(`${horas} h sumadas al banco de tiempo de ${paciente.nombre}`);
    },
    // Mensajes dentro de la alerta: la primera respuesta cuenta como atención para la métrica.
    responderAlerta: (alertaId, texto) => {
      if (!familia || !usuario || !texto.trim()) return;
      const ts = ahoraISO();
      const a = db.alertas.find((x) => x.id === alertaId);
      mutar((d) => ({
        ...d,
        alertas: d.alertas.map((x) => (x.id === alertaId ? { ...x, atendidaEn: x.atendidaEn ?? ts, respuestas: [...(x.respuestas ?? []), { porUsuarioId: usuario.id, texto: texto.trim(), fechaHora: ts }] } : x)),
        mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, tipo: "texto", fechaHora: ts, texto: `Sobre la alerta «${a?.titulo ?? ""}»: ${texto.trim()}` }],
      }));
      avisar("Mensaje enviado a la familia");
    },
    // La propia persona mayor pide cuidado o compañía: llega a la familia como alerta de vigilancia.
    pedirCuidado: async (pedido, detalle) => {
      if (!familia || !usuario || !paciente) return;
      const ts = ahoraISO();
      const alerta: Alerta = {
        id: uid("a"), familiaId: familia.id, fechaHora: ts, nivel: "amarillo", titulo: `${paciente.nombre} pide: ${pedido.toLowerCase()}`,
        motivo: `${paciente.nombre} pidió desde su cuenta: ${pedido.toLowerCase()}.${detalle.trim() ? ` ${detalle.trim()}` : ""}`, trifecta: false, estado: "activa", origen: "persona", porUsuarioId: usuario.id,
      };
      mutar((d) => ({
        ...d,
        alertas: [...d.alertas, alerta],
        mensajes: [...d.mensajes, { id: uid("msg"), familiaId: familia.id, de: usuario.id, tipo: "texto", fechaHora: ts, texto: `${pedido}.${detalle.trim() ? ` ${detalle.trim()}` : ""}` }],
      }));
      if (familia.consentimiento.alertasWhatsApp) await notificarWhatsApp(alerta, familia, paciente, { encabezado: `${paciente.nombre} pide ayuda a su familia.` });
      else avisar("Tu familia ya recibió tu pedido");
    },
    agregarGasto: (g) => {
      if (!familia || !usuario) return;
      mutar((d) => ({ ...d, gastos: [...d.gastos, { ...g, id: uid("g"), familiaId: familia.id, registradoPor: usuario.id }] }));
      avisar(`Gasto registrado: $${g.monto.toLocaleString("es-MX")}`);
    },
    calificar: (aUsuarioId, estrellas, comentario) => {
      if (!usuario || !familia) return;
      mutar((d) => ({
        ...d,
        resenas: [...d.resenas.filter((r) => !(r.aUsuarioId === aUsuarioId && r.deUsuarioId === usuario.id)), { id: uid("rs"), aUsuarioId, deUsuarioId: usuario.id, familiaId: familia.id, estrellas, comentario: comentario.trim(), fecha: fechaISO(new Date()) }],
      }));
      avisar("Gracias: tu calificación respalda a la red");
    },
    quitarGasto: (id) => {
      mutar((d) => ({ ...d, gastos: d.gastos.filter((g) => g.id !== id) }));
    },
    configurarGastos: (c) => {
      if (!familia) return;
      mutar((d) => ({ ...d, familias: d.familias.map((f) => (f.id === familia.id ? { ...f, ...c } : f)) }));
    },
    guardarReparto: (reparto) => {
      if (!familia) return;
      mutar((d) => ({ ...d, familias: d.familias.map((f) => (f.id === familia.id ? { ...f, reparto } : f)) }));
      avisar("Reparto de gastos actualizado");
    },
    marcarNotificaciones: (ids) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, notifVistas: { ...d.notifVistas, [usuario.id]: Array.from(new Set([...(d.notifVistas?.[usuario.id] ?? []), ...ids])).slice(-300) } }));
    },
    responderZarit: (respuestas) => {
      if (!usuario) return;
      const puntaje = respuestas.reduce((a, b) => a + b, 0);
      mutar((d) => ({ ...d, zarit: [...d.zarit, { id: uid("z"), usuarioId: usuario.id, fecha: fechaISO(new Date()), respuestas, puntaje }] }));
      avisar(`Escala registrada: ${puntaje} puntos`);
    },
    agregarEvidencia: (e) => {
      if (!familia || !usuario) return;
      mutar((d) => ({ ...d, evidencias: [...d.evidencias, { ...e, id: uid("ev"), familiaId: familia.id, porUsuarioId: usuario.id, fechaHora: ahoraISO() }] }));
      avisar("Evidencia guardada; otra persona de la familia puede confirmarla");
    },
    confirmarEvidencia: (id) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, evidencias: d.evidencias.map((e) => (e.id === id && e.porUsuarioId !== usuario.id ? { ...e, confirmadaPor: usuario.id, confirmadaEn: ahoraISO() } : e)) }));
      avisar("Confirmaste el registro");
    },
    actualizarEquipo: (tipo, estado, de) => {
      if (!familia) return;
      mutar((d) => {
        const resto = d.equipos.filter((e) => !(e.familiaId === familia.id && e.tipo === tipo));
        return { ...d, equipos: estado ? [...resto, { id: uid("eq"), familiaId: familia.id, tipo, estado, de, desde: fechaISO(new Date()) }] : resto };
      });
    },
    pedirPrestamo: (tipo, aUsuarioId) => {
      if (!familia || !usuario) return;
      const quien = db.usuarios.find((u) => u.id === aUsuarioId)?.nombre.split(" ")[0] ?? "la persona";
      mutar((d) => ({
        ...d,
        prestamos: [...d.prestamos, { id: uid("pr"), familiaId: familia.id, tipo, aUsuarioId, deUsuarioId: usuario.id, estado: "enviada", creadaEn: ahoraISO() }],
        mensajes: [
          ...d.mensajes,
          { id: uid("msg"), familiaId: familia.id, de: "asistente", tipo: "sistema", fechaHora: ahoraISO(), texto: `${usuario.nombre.split(" ")[0]} pidió prestado: ${nombreEquipo(tipo).toLowerCase()} a ${quien}. Lo acuerdan por este chat.` },
        ],
      }));
      avisar(`Solicitud de préstamo enviada a ${quien}`);
    },
    responderPrestamo: (id, aceptar) => {
      mutar((d) => {
        const pr = d.prestamos.find((x) => x.id === id);
        if (!pr) return d;
        const presta = d.usuarios.find((u) => u.id === pr.aUsuarioId)?.nombre ?? "";
        const eq = nombreEquipo(pr.tipo).toLowerCase();
        return {
          ...d,
          prestamos: d.prestamos.map((x) => (x.id === id ? { ...x, estado: aceptar ? "aceptada" : "rechazada" } : x)),
          equipos: aceptar
            ? [...d.equipos.filter((e) => !(e.familiaId === pr.familiaId && e.tipo === pr.tipo)), { id: uid("eq"), familiaId: pr.familiaId, tipo: pr.tipo, estado: "prestado", de: presta, desde: fechaISO(new Date()) }]
            : d.equipos,
          mensajes: [
            ...d.mensajes,
            { id: uid("msg"), familiaId: pr.familiaId, de: "asistente", tipo: "sistema", fechaHora: ahoraISO(), texto: aceptar ? `${presta.split(" ")[0]} aceptó prestar: ${eq}.` : `${presta.split(" ")[0]} no puede prestar por ahora: ${eq}.` },
          ],
        };
      });
      avisar(aceptar ? "Aceptaste el préstamo; la familia ya lo ve" : "Préstamo rechazado");
    },
    guardarVideoGuia: (id, url) => {
      mutar((d) => ({ ...d, videosGuia: { ...d.videosGuia, [id]: url.trim() } }));
      avisar(url.trim() ? "Video de la guía guardado" : "Video quitado");
    },
    unirseConCodigo: (codigo, como) => {
      const fam = db.familias.find((f) => f.codigo && f.codigo.toUpperCase() === codigo.trim().toUpperCase());
      if (!fam) return null;
      let d = db;
      let usuarioId: Id;
      if ("usuarioId" in como) {
        usuarioId = como.usuarioId;
      } else {
        const r = asegurarPerfil(d, { nombre: como.nuevo.nombre, telefono: como.nuevo.telefono, genero: como.nuevo.genero });
        d = r.d;
        usuarioId = r.id;
        const clave = como.nuevo.clave;
        d = {
          ...d,
          usuarios: d.usuarios.map((u) =>
            u.id !== usuarioId ? u : { ...u, ...(u.alcaldia ? {} : { alcaldia: fam.alcaldia, ubicacion: { lat: fam.hogar.lat, lng: fam.hogar.lng } }), ...(clave && !u.clave ? { clave } : {}) },
          ),
        };
      }
      const existente = d.membresias.find((m) => m.familiaId === fam.id && m.usuarioId === usuarioId);
      const parentesco = "nuevo" in como ? como.nuevo.parentesco || "Familiar" : "Familiar";
      d = {
        ...d,
        membresias: existente
          ? d.membresias.map((m) => (m.id === existente.id ? { ...m, estado: "activa" } : m))
          : [...d.membresias, { id: uid("mb"), familiaId: fam.id, usuarioId, rol: "cuidado", parentesco, principal: false, estado: "activa", desde: fechaISO(new Date()) }],
      };
      setDb(d);
      setSesion({ usuarioId, familiaId: fam.id }, true);
      avisar(`Entraste al espacio ${fam.nombre}`);
      return fam.id;
    },
    actualizarPaciente: (p) => {
      if (!paciente) return;
      mutar((d) => ({
        ...d,
        pacientes: d.pacientes.map((x) => (x.id === paciente.id ? { ...x, ...p } : x)),
      }));
      avisar("Perfil de la persona mayor actualizado");
    },
    agregarMedicamento: (m) => {
      if (!familia) return;
      mutar((d) => ({ ...d, medicamentos: [...d.medicamentos, { ...m, id: uid("med"), familiaId: familia.id }] }));
      avisar("Medicamento agregado");
    },
    quitarMedicamento: (id) => mutar((d) => ({ ...d, medicamentos: d.medicamentos.filter((m) => m.id !== id) })),
    marcarToma: (medicamentoId, horario, estado) => {
      if (!usuario) return;
      const f = fechaISO(new Date());
      mutar((d) => ({
        ...d,
        tomas: [...d.tomas.filter((t) => !(t.medicamentoId === medicamentoId && t.fecha === f && t.horario === horario)), { id: uid("t"), medicamentoId, fecha: f, horario, estado, porUsuarioId: usuario.id, registradaEn: ahoraISO() }],
      }));
    },
    completarTutorial: (tutorialId) => {
      if (!usuario) return;
      const f = fechaISO(new Date());
      mutar((d) => ({
        ...d,
        progreso: [
          ...d.progreso.filter((p) => !(p.tutorialId === tutorialId && p.usuarioId === usuario.id)),
          { tutorialId, usuarioId: usuario.id, completado: true, fecha: f, practicas: d.progreso.find((p) => p.tutorialId === tutorialId && p.usuarioId === usuario.id)?.practicas ?? 0 },
        ],
      }));
      avisar("Habilidad agregada a tu perfil");
    },
    agendarCertificacion: (certId, cita) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, certificaciones: [...d.certificaciones.filter((c) => !(c.id === certId && c.usuarioId === usuario.id)), { id: certId, usuarioId: usuario.id, estado: "agendada", cita }] }));
      avisar("Demostración presencial agendada");
    },
    aprobarCertificacion: (certId) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, certificaciones: d.certificaciones.map((c) => (c.id === certId && c.usuarioId === usuario.id ? { ...c, estado: "certificada", fecha: fechaISO(new Date()) } : c)) }));
      avisar("Certificación registrada en tu perfil");
    },
  };

  return <DataContext.Provider value={ctx}>{children}</DataContext.Provider>;
}

export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error("useData debe usarse dentro de DataProvider");
  return c;
}

export { CODIGO_DEMO };

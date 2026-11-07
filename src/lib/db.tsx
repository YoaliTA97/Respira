"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UMBRALES_BASE } from "./catalogos";
import { familiasDe, integrantes as integrantesDe, planInicialRelevos, relevoActual, type Integrante } from "./calculos";
import { evaluar, extraerMedicion, respuestaPorReglas, type Evaluacion, type Medicion } from "./reglas";
import { CODIGO_DEMO, DB_VERSION, FAMILIA_DEMO, crearSeed, fechaISO } from "./seed";
import type {
  Alerta, DB, Familia, Id, Intercambio, LecturaSignos, Medicamento, Membresia, Mensaje, Paciente, RolFamilia, SignoId, SolicitudRed, Tono, Usuario,
} from "./types";

// Capa de datos. Cada acción corresponde a una operación del backend del MVP (Supabase con
// políticas por membresía). En esta versión los datos viven en localStorage y se sincronizan
// entre pestañas; la sesión (usuario y espacio activo) vive en sessionStorage, por pestaña.

const LS_DB = "respira-db";
const SS_SESION = "respira-sesion";
const LS_TECH = "respira-capa-tecnica";
const TONOS: Tono[] = ["t1", "t2", "t3", "t4", "t5"];
const CENTRO_CDMX = { lat: 19.3135, lng: -99.146 };

const uid = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;
const ahoraISO = () => {
  const d = new Date();
  return `${fechaISO(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};
const soloDigitos = (t: string) => t.replace(/\D/g, "");

export type PerfilNuevo = Pick<Usuario, "nombre" | "telefono" | "genero" | "alcaldia" | "roles" | "experiencia" | "disponibilidad" | "ofreceAyuda" | "bio">;

export type InvitacionNueva = { nombre: string; telefono: string; parentesco: string; rol: RolFamilia; principal: boolean; genero: Usuario["genero"] };

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
  iniciarSesion: (telefono: string, codigo: string) => boolean;
  cerrarSesion: () => void;
  cambiarFamilia: (familiaId: Id | null) => void;
  crearCuenta: (p: PerfilNuevo) => void;
  actualizarPerfil: (p: Partial<Usuario>) => void;
  reiniciarDemo: () => void;
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
  // persona cuidada y medicación
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

function leerDB(ahora: Date): DB {
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) {
      const db = JSON.parse(raw) as DB;
      if (db.version === DB_VERSION) return db;
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
      s = JSON.parse(sessionStorage.getItem(SS_SESION) ?? "null") ?? s;
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

  const setSesion = useCallback((s: Sesion) => {
    setSesionState(s);
    try {
      sessionStorage.setItem(SS_SESION, JSON.stringify(s));
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
    if (!membresia) return false;
    if (accion === "administrar") return membresia.rol === "coordinacion";
    if (accion === "registrar") return membresia.rol !== "avisos";
    return membresia.rol !== "avisos";
  };

  const notificarWhatsApp = async (alerta: Alerta, fam: Familia, pac: Paciente) => {
    const d = dbRef.current!;
    const principales = integrantesDe(d, fam.id).filter((i) => i.membresia.principal);
    const link = `${window.location.origin}/centros?lat=${fam.hogar.lat}&lng=${fam.hogar.lng}&p=${encodeURIComponent(pac.nombre)}`;
    const texto = `ALERTA MÉDICA de ${pac.nombre}. ${alerta.motivo} Lo que necesita excede lo que se puede atender en casa. Vean los centros cercanos y decidan a cuál llevarla: ${link}`;
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
  const procesarReporte = async (texto: string, medicionManual?: Medicion) => {
    const d = dbRef.current;
    if (!d || !paciente || !familia || !usuario) return;
    setProcesando(true);
    const ext = extraerMedicion(texto);
    let medicion: Medicion = { ...ext.medicion, ...(medicionManual ?? {}) };
    let ev: Evaluacion = evaluar(medicion, ext.senales, paciente.umbrales, paciente.condiciones, paciente.signos);
    let respuesta = respuestaPorReglas(ev, paciente.nombre, paciente.condiciones);
    let fuente: Mensaje["fuente"] = "reglas";
    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          medicionManual,
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
    const hayDatos = Object.values(medicion).some((v) => v !== undefined) || ev.senales.length > 0;
    const lectura: LecturaSignos | null = hayDatos
      ? { id: uid("l"), familiaId: familia.id, fechaHora: ts, porUsuarioId: usuario.id, ...medicion, senales: ev.senales, origen: medicionManual ? "formulario" : "nota de voz", nivel: ev.nivel }
      : null;
    const alerta: Alerta | null =
      ev.nivel !== "verde" ? { id: uid("a"), familiaId: familia.id, fechaHora: ts, nivel: ev.nivel, titulo: ev.titulo, motivo: ev.motivo, trifecta: ev.trifecta, estado: "activa" } : null;
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
    if (alerta && ev.notificarFamilia && familia.consentimiento.alertasWhatsApp) await notificarWhatsApp(alerta, familia, paciente);
    setProcesando(false);
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
    iniciarSesion: (telefono, codigo) => {
      const u = db.usuarios.find((x) => x.telefono === soloDigitos(telefono));
      if (!u || codigo !== CODIGO_DEMO) return false;
      setSesion({ usuarioId: u.id, familiaId: familiasDe(db, u.id)[0]?.familia.id ?? null });
      return true;
    },
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
      setSesion({ usuarioId: id, familiaId: null });
    },
    actualizarPerfil: (p) => {
      if (!usuario) return;
      mutar((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.id === usuario.id ? { ...u, ...p } : u)) }));
      avisar("Perfil actualizado");
    },
    reiniciarDemo: () => {
      const semilla = crearSeed(new Date());
      setDb((d) => {
        if (!d) return semilla;
        const demoIds = new Set(semilla.usuarios.map((u) => u.id));
        const ajena = (x: { familiaId: Id }) => x.familiaId !== FAMILIA_DEMO;
        return {
          ...semilla,
          usuarios: [...semilla.usuarios, ...d.usuarios.filter((u) => !demoIds.has(u.id))],
          familias: [...semilla.familias, ...d.familias.filter((f) => f.id !== FAMILIA_DEMO)],
          membresias: [...semilla.membresias, ...d.membresias.filter(ajena)],
          pacientes: [...semilla.pacientes, ...d.pacientes.filter(ajena)],
          medicamentos: [...semilla.medicamentos, ...d.medicamentos.filter(ajena)],
          lecturas: [...semilla.lecturas, ...d.lecturas.filter(ajena)],
          relevos: [...semilla.relevos, ...d.relevos.filter(ajena)],
          intercambios: d.intercambios.filter(ajena),
          solicitudes: d.solicitudes.filter(ajena),
          mensajes: [...semilla.mensajes, ...d.mensajes.filter(ajena)],
          alertas: d.alertas.filter(ajena),
        };
      });
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
        nuevasMembresias.push({ id: uid("mb"), familiaId: famId, usuarioId: r.id, rol: i.rol, parentesco: i.parentesco, principal: i.principal, estado: "invitada", desde: fechaISO(new Date()) });
      });
      const pac: Paciente = {
        id: uid("p"), familiaId: famId, nombre: f.paciente.nombre, edad: f.paciente.edad, sexo: f.paciente.sexo, condiciones: f.paciente.condiciones, alergias: f.paciente.alergias,
        evento: f.paciente.condiciones.includes("caida") ? { tipo: "caida", fecha: fechaISO(new Date()), descripcion: f.paciente.evento, lesion: f.paciente.lesion } : null,
        movilidad: f.paciente.movilidad, signos: f.paciente.signos.length ? f.paciente.signos : ["fc", "fr", "pa"], umbrales: UMBRALES_BASE, notas: "",
      };
      const familiaNueva: Familia = {
        id: famId, nombre: f.nombre, alcaldia: f.alcaldia, hogar: { ...CENTRO_CDMX, referencia: `${f.alcaldia} (ubicación aproximada)` }, creadaPor: usuario.id, creadaEn: ts,
        consentimiento: { ...f.consentimiento, fecha: ts },
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
        membresias: [...d.membresias, { id: uid("mb"), familiaId: familia.id, usuarioId: r.id, rol: i.rol, parentesco: i.parentesco, principal: i.principal, estado: "invitada", desde: fechaISO(new Date()) }],
      });
      avisar(`Invitación enviada a ${i.nombre}. Entra con su teléfono para aceptarla.`);
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
          intercambios: d.intercambios.map((x) => (x.id === id ? { ...x, estado: aceptar ? "aceptado" : "rechazado" } : x)),
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
          solicitudes: d.solicitudes.map((x) => (x.id === id ? { ...x, estado: aceptar ? "aceptada" : "rechazada" } : x)),
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
      mutar((d) => ({ ...d, alertas: d.alertas.map((a) => (a.id === id ? { ...a, estado: "atendida", centroElegido: centro ?? a.centroElegido } : a)) }));
      avisar(centro ? `Alerta atendida: van a ${centro}` : "Alerta marcada como atendida");
    },
    actualizarPaciente: (p) => {
      if (!paciente) return;
      mutar((d) => ({
        ...d,
        pacientes: d.pacientes.map((x) => (x.id === paciente.id ? { ...x, ...p } : x)),
      }));
      avisar("Perfil de la persona cuidada actualizado");
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

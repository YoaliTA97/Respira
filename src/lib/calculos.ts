import { CERTIFICACIONES, HORARIOS_SIGNOS_BASE, MINUTOS_A_TIEMPO, TUTORIALES, ZARIT_CORTE, condicionCatalogo } from "./catalogos";
import { diaSemana, fechaISO } from "./seed";
import type { DB, Disponibilidad, Id, Membresia, Relevo, Usuario } from "./types";

// Proyecciones sobre los datos. En el MVP son vistas SQL protegidas por membresía.

export const horaTexto = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:00`;
export const rangoRelevo = (r: Relevo) => `${horaTexto(r.inicio)} a ${r.inicio + r.horas >= 24 ? "24:00" : horaTexto(r.inicio + r.horas)}`;
export const fechaDe = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function cubre(disp: Disponibilidad, fecha: string, inicio: number, horas: number) {
  const ds = diaSemana(fechaDe(fecha));
  return (disp[ds] ?? []).some((r) => r.inicio <= inicio && r.fin >= Math.min(24, inicio + horas));
}

export const horasDisponibles = (disp: Disponibilidad) => Object.values(disp).reduce((acc, rs) => acc + rs.reduce((a, r) => a + (r.fin - r.inicio), 0), 0);

export type EstadoRelevo = "cubierto" | "en curso" | "programado" | "sin cubrir" | "pendiente de la red";

export function estadoRelevo(r: Relevo, ahora: Date, db?: DB): EstadoRelevo {
  const hoy = fechaISO(ahora);
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  if (!r.asignadoA) {
    if (db?.solicitudes.some((s) => s.relevoId === r.id && s.estado === "enviada")) return "pendiente de la red";
    return "sin cubrir";
  }
  if (r.fecha < hoy || (r.fecha === hoy && h >= r.inicio + r.horas)) return "cubierto";
  if (r.fecha === hoy && h >= r.inicio) return "en curso";
  return "programado";
}

export function relevoActual(db: DB, familiaId: Id, ahora: Date) {
  const hoy = fechaISO(ahora);
  const h = ahora.getHours() + ahora.getMinutes() / 60;
  return db.relevos.find((r) => r.familiaId === familiaId && r.fecha === hoy && h >= r.inicio && h < r.inicio + r.horas) ?? null;
}

export function proximosRelevos(db: DB, familiaId: Id | null, ahora: Date, dias = 7, usuarioId?: Id) {
  const hoy = fechaISO(ahora);
  const lim = new Date(ahora);
  lim.setDate(lim.getDate() + dias);
  const limite = fechaISO(lim);
  const h = ahora.getHours();
  return db.relevos
    .filter((r) => (!familiaId || r.familiaId === familiaId) && (!usuarioId || r.asignadoA === usuarioId) && r.fecha >= hoy && r.fecha <= limite && !(r.fecha === hoy && r.inicio + r.horas <= h))
    .sort((a, b) => (a.fecha === b.fecha ? a.inicio - b.inicio : a.fecha < b.fecha ? -1 : 1));
}

export function horasCuidado(db: DB, usuarioId: Id, ahora: Date, desde?: string, familiaId?: Id) {
  return db.relevos
    .filter((r) => r.asignadoA === usuarioId && (!familiaId || r.familiaId === familiaId) && estadoRelevo(r, ahora) === "cubierto" && (!desde || r.fecha >= desde))
    .reduce((acc, r) => acc + r.horas, 0);
}

export type Integrante = { membresia: Membresia; usuario: Usuario };

export function integrantes(db: DB, familiaId: Id, incluirInvitados = false): Integrante[] {
  return db.membresias
    .filter((m) => m.familiaId === familiaId && (incluirInvitados || m.estado === "activa"))
    .map((m) => ({ membresia: m, usuario: db.usuarios.find((u) => u.id === m.usuarioId)! }))
    .filter((x) => !!x.usuario);
}

export function familiasDe(db: DB, usuarioId: Id) {
  return db.membresias
    .filter((m) => m.usuarioId === usuarioId && m.estado === "activa")
    .map((m) => ({ membresia: m, familia: db.familias.find((f) => f.id === m.familiaId)! }))
    .filter((x) => !!x.familia);
}

export function cargaSemana(db: DB, familiaId: Id, ahora: Date) {
  const d = new Date(ahora);
  d.setDate(d.getDate() - 7);
  const desde = fechaISO(d);
  const filas = integrantes(db, familiaId).filter((i) => i.membresia.rol !== "persona").map((i) => ({ ...i, horas: horasCuidado(db, i.usuario.id, ahora, desde, familiaId) }));
  const externas = db.relevos
    .filter((r) => r.familiaId === familiaId && r.origen === "red" && r.fecha >= desde && estadoRelevo(r, ahora) === "cubierto")
    .reduce((a, r) => a + r.horas, 0);
  const total = filas.reduce((a, f) => a + f.horas, 0) + externas || 1;
  const mujeres = filas.filter((f) => f.usuario.genero === "mujer").reduce((a, f) => a + f.horas, 0);
  return { filas, externas, total, pctMujeres: Math.round((mujeres / total) * 100) };
}

export function coberturaSemana(db: DB, familiaId: Id, ahora: Date) {
  const proximos = proximosRelevos(db, familiaId, ahora, 7);
  const horas = proximos.reduce((a, r) => a + r.horas, 0) || 1;
  const cubiertas = proximos.filter((r) => r.asignadoA).reduce((a, r) => a + r.horas, 0);
  return { horas, cubiertas, pct: Math.round((cubiertas / horas) * 100), sinCubrir: proximos.filter((r) => !r.asignadoA) };
}

export function candidatosFamilia(db: DB, relevo: Relevo, excluir?: Id) {
  return integrantes(db, relevo.familiaId).filter(
    (i) => i.usuario.id !== excluir && i.membresia.rol !== "avisos" && cubre(i.usuario.disponibilidad, relevo.fecha, relevo.inicio, relevo.horas),
  );
}

export function perfilesRed(db: DB, familiaId: Id, radioKm: number, relevo?: Relevo) {
  const fam = db.familias.find((f) => f.id === familiaId);
  if (!fam) return [];
  const miembros = new Set(db.membresias.filter((m) => m.familiaId === familiaId).map((m) => m.usuarioId));
  return db.usuarios
    .filter((u) => u.ofreceAyuda.activo && !miembros.has(u.id))
    .map((u) => ({ usuario: u, distancia: km(fam.hogar, u.ubicacion) }))
    .filter((x) => x.distancia <= radioKm && x.distancia <= x.usuario.ofreceAyuda.radioKm && (!relevo || cubre(x.usuario.disponibilidad, relevo.fecha, relevo.inicio, relevo.horas)))
    .sort((a, b) => a.distancia - b.distancia);
}

export function completados(db: DB, usuarioId: Id) {
  return new Set(db.progreso.filter((p) => p.usuarioId === usuarioId && p.completado).map((p) => p.tutorialId));
}

export function habilidades(db: DB, usuarioId: Id) {
  const hechos = completados(db, usuarioId);
  return TUTORIALES.filter((t) => hechos.has(t.id)).map((t) => ({ tutorial: t, practicas: db.progreso.find((p) => p.usuarioId === usuarioId && p.tutorialId === t.id)?.practicas ?? 0 }));
}

export function certificadas(db: DB, usuarioId: Id) {
  return db.certificaciones.filter((c) => c.usuarioId === usuarioId && c.estado === "certificada").map((c) => CERTIFICACIONES.find((d) => d.id === c.id)!).filter(Boolean);
}

export function tutorialesRecomendados(db: DB, familiaId: Id | null) {
  const p = familiaId ? db.pacientes.find((x) => x.familiaId === familiaId) : null;
  const ids = new Set((p?.condiciones ?? []).flatMap((c) => condicionCatalogo(c)?.tutoriales ?? []));
  ids.add("signos-vitales");
  return TUTORIALES.filter((t) => ids.has(t.id));
}

export function estadoCertificaciones(db: DB, usuarioId: Id, ahora: Date) {
  const hechos = completados(db, usuarioId);
  const horas = horasCuidado(db, usuarioId, ahora);
  return CERTIFICACIONES.map((c) => {
    const guardada = db.certificaciones.find((x) => x.id === c.id && x.usuarioId === usuarioId);
    const faltan = c.requiere.filter((r) => !hechos.has(r));
    const horasOk = horas >= c.horasMinimas;
    const estado: "bloqueada" | "disponible" | "agendada" | "certificada" = guardada?.estado ?? (faltan.length === 0 && horasOk ? "disponible" : "bloqueada");
    return { def: c, estado, faltan, horas, horasOk, cita: guardada?.cita, fecha: guardada?.fecha };
  });
}

export function adherencia(db: DB, familiaId: Id, ahora: Date) {
  const hoy = fechaISO(ahora);
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const meds = db.medicamentos.filter((m) => m.familiaId === familiaId);
  const debidas = meds.flatMap((m) => m.horarios.filter((h) => h <= hora).map((h) => ({ m, h })));
  const dadas = debidas.filter(({ m, h }) => db.tomas.some((t) => t.medicamentoId === m.id && t.fecha === hoy && t.horario === h && t.estado === "dada"));
  return { debidas: debidas.length, dadas: dadas.length, pct: debidas.length ? Math.round((dadas.length / debidas.length) * 100) : 100 };
}

export function planInicialRelevos(familiaId: Id, usuarios: Usuario[], ahora: Date): Relevo[] {
  const out: Relevo[] = [];
  const bloques = [
    { inicio: 7, horas: 6 },
    { inicio: 13, horas: 6 },
    { inicio: 19, horas: 4 },
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + i);
    const f = fechaISO(d);
    bloques.forEach((b, j) => {
      const quien = usuarios.find((u) => cubre(u.disponibilidad, f, b.inicio, b.horas)) ?? null;
      out.push({ id: `r-${familiaId}-${f}-${j}`, familiaId, fecha: f, inicio: b.inicio, horas: b.horas, asignadoA: quien?.id ?? null, origen: "familia" });
    });
  }
  return out;
}

// Personas con perfil que ya conoces: integrantes de tus otros espacios y quien de la red ya
// cubrió relevos en tus espacios. Sirven para dar de alta a alguien sin capturarlo de nuevo.
export function conocidos(db: DB, usuarioId: Id, excluir: Id[] = []) {
  const misEspacios = familiasDe(db, usuarioId).map((x) => x.familia);
  const fuera = new Set([usuarioId, ...excluir]);
  const vistos = new Map<Id, { usuario: Usuario; contexto: string }>();
  misEspacios.forEach((f) => {
    db.membresias
      .filter((m) => m.familiaId === f.id && m.estado === "activa")
      .forEach((m) => {
        const u = db.usuarios.find((x) => x.id === m.usuarioId);
        if (u && !fuera.has(u.id) && !vistos.has(u.id)) vistos.set(u.id, { usuario: u, contexto: `${m.parentesco} · ${f.nombre}` });
      });
    db.relevos
      .filter((r) => r.familiaId === f.id && r.origen === "red" && r.asignadoA)
      .forEach((r) => {
        const u = db.usuarios.find((x) => x.id === r.asignadoA);
        if (u && !fuera.has(u.id) && !vistos.has(u.id)) vistos.set(u.id, { usuario: u, contexto: `Red de cuidado · cubrió relevos en ${f.nombre}` });
      });
  });
  return Array.from(vistos.values());
}

// Qué se muestra de un perfil existente al darlo de alta: nombre y alcaldía siempre; habilidades
// y experiencia solo si ya es público en la red o si comparten algún espacio.
export function perfilVisible(db: DB, quienVe: Id, perfil: Usuario) {
  const comparten = db.membresias.some((m) => m.usuarioId === perfil.id && m.estado === "activa" && db.membresias.some((n) => n.usuarioId === quienVe && n.familiaId === m.familiaId && n.estado === "activa"));
  return perfil.ofreceAyuda.activo || comparten;
}

const minutosEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);

// Ingreso que una persona recibió por cuidar: relevos pagados en la red e intercambios monetarios.
export function ingresoCuidado(db: DB, usuarioId: Id, familiaId?: Id) {
  const red = db.solicitudes.filter((s) => s.usuarioId === usuarioId && s.estado === "aceptada" && s.pago === "pago" && (!familiaId || s.familiaId === familiaId)).reduce((a, s) => a + s.monto, 0);
  const inter = db.intercambios.filter((i) => i.aUsuarioId === usuarioId && i.estado === "aceptado" && i.tipo === "monetario" && (!familiaId || i.familiaId === familiaId)).reduce((a, i) => a + i.monto, 0);
  return red + inter;
}

// Indicadores del espacio familiar: horas de relevo del mes, sobrecarga (Zarit),
// alertas atendidas a tiempo y cuidadoras certificadas con ingreso.
export function metricasEspacio(db: DB, familiaId: Id, ahora: Date) {
  const hace30 = new Date(ahora);
  hace30.setDate(hace30.getDate() - 30);
  const desde = fechaISO(hace30);
  const cubiertos = db.relevos.filter((r) => r.familiaId === familiaId && r.asignadoA && r.fecha >= desde && estadoRelevo(r, ahora) === "cubierto");
  const horasFamilia = cubiertos.filter((r) => r.origen === "familia").reduce((a, r) => a + r.horas, 0);
  const horasRed = cubiertos.filter((r) => r.origen === "red").reduce((a, r) => a + r.horas, 0);

  const miembros = integrantes(db, familiaId).filter((i) => i.membresia.rol !== "persona");
  const zarit = miembros.map(({ usuario }) => {
    const suyas = db.zarit.filter((z) => z.usuarioId === usuario.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return { usuario, ultima: suyas[0] ?? null, anterior: suyas[1] ?? null };
  });
  const conZarit = zarit.filter((z) => z.ultima);
  const sobrecargadas = conZarit.filter((z) => z.ultima!.puntaje >= ZARIT_CORTE);

  const alertas = db.alertas.filter((a) => a.familiaId === familiaId && a.nivel === "rojo" && a.fechaHora.slice(0, 10) >= desde);
  const tiempos = alertas.filter((a) => a.atendidaEn).map((a) => minutosEntre(a.fechaHora, a.atendidaEn!));
  const aTiempo = tiempos.filter((m) => m <= MINUTOS_A_TIEMPO).length;
  const ordenados = [...tiempos].sort((a, b) => a - b);
  const mediana = ordenados.length ? ordenados[Math.floor(ordenados.length / 2)] : null;

  const redIds = cubiertos.filter((r) => r.origen === "red").map((r) => r.asignadoA!);
  const personas = Array.from(new Set([...miembros.map((m) => m.usuario.id), ...redIds]))
    .map((id) => db.usuarios.find((u) => u.id === id)!)
    .filter(Boolean)
    .map((u) => ({ usuario: u, certs: certificadas(db, u.id), ingreso: ingresoCuidado(db, u.id) }));
  const certificadasConIngreso = personas.filter((p) => p.certs.length > 0 && p.ingreso > 0);

  // Horas de relevo para la cuidadora principal (quien creó el espacio): las que cubrió alguien más.
  const fam = db.familias.find((f) => f.id === familiaId);
  const principal = db.usuarios.find((u) => u.id === fam?.creadaPor) ?? null;
  const relevoPrincipal = cubiertos.filter((r) => r.asignadoA !== principal?.id);
  const zPrincipal = db.zarit.filter((z) => z.usuarioId === principal?.id).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const pac = db.pacientes.find((p) => p.familiaId === familiaId);
  const vozCompleta = !!(pac?.voz?.palabras && pac.voz.decisiones && pac.voz.consentimiento);
  return {
    principal,
    horasRelevoPrincipal: relevoPrincipal.reduce((a, r) => a + r.horas, 0),
    zaritPrincipal: { inicial: zPrincipal[0] ?? null, ultima: zPrincipal.at(-1) ?? null },
    vozCompleta,
    horasMes: horasFamilia + horasRed, horasFamilia, horasRed,
    zarit, conZarit: conZarit.length, sobrecargadas: sobrecargadas.length,
    alertas: { total: alertas.length, atendidas: tiempos.length, aTiempo, activas: alertas.filter((a) => a.estado === "activa").length, mediana },
    certificadas: personas.filter((p) => p.certs.length > 0), certificadasConIngreso,
    conSeguridadSocial: certificadasConIngreso.filter((p) => !!p.usuario.seguridadSocial),
  };
}

// CV de cuidado: lo que la persona sabe hacer y la evidencia que lo respalda.
export function cvCuidado(db: DB, usuarioId: Id, ahora: Date) {
  const hechos = completados(db, usuarioId);
  const certs = estadoCertificaciones(db, usuarioId, ahora);
  const certificadasIds = new Set(certs.filter((c) => c.estado === "certificada").flatMap((c) => c.def.requiere));
  const relevos = db.relevos.filter((r) => r.asignadoA === usuarioId && estadoRelevo(r, ahora) === "cubierto");
  const habilidadesCv = TUTORIALES.map((t) => {
    const practicas = db.progreso.find((p) => p.usuarioId === usuarioId && p.tutorialId === t.id)?.practicas ?? 0;
    const nivel: "Certificada" | "Verificada" | "Por aprender" = certificadasIds.has(t.id) ? "Certificada" : hechos.has(t.id) ? "Verificada" : "Por aprender";
    return { tutorial: t, practicas, nivel };
  });
  const evidencias = db.evidencias.filter((e) => e.porUsuarioId === usuarioId);
  return {
    horas: horasCuidado(db, usuarioId, ahora),
    relevos: relevos.length,
    relevosRed: relevos.filter((r) => r.origen === "red").length,
    familias: new Set(relevos.map((r) => r.familiaId)).size,
    registros: db.lecturas.filter((l) => l.porUsuarioId === usuarioId).length,
    evidencias: evidencias.length,
    confirmadas: evidencias.filter((e) => e.confirmadaPor).length,
    habilidades: habilidadesCv,
    certificaciones: certs,
    ingreso: ingresoCuidado(db, usuarioId),
  };
}

// Equipo: quién de la familia o de la red puede prestar algo, dentro del radio del hogar.
export function prestadoresEquipo(db: DB, familiaId: Id, tipo: string, radioKm = 6) {
  const fam = db.familias.find((f) => f.id === familiaId);
  if (!fam) return [];
  const miembros = new Set(db.membresias.filter((m) => m.familiaId === familiaId && m.estado === "activa").map((m) => m.usuarioId));
  return db.usuarios
    .filter((u) => (u.equipo ?? []).includes(tipo) && (miembros.has(u.id) || u.ofreceAyuda.activo))
    .map((u) => ({ usuario: u, distancia: km(fam.hogar, u.ubicacion), deLaFamilia: miembros.has(u.id) }))
    .filter((x) => x.deLaFamilia || x.distancia <= radioKm)
    .sort((a, b) => a.distancia - b.distancia);
}

// "Yo decido sobre mis datos": la persona mayor puede retirar a alguien el permiso de ver su historial.
export function puedeVerHistorial(p: { usuarioId?: Id; voz?: { permisos: Record<Id, boolean> } } | null, usuarioId?: Id | null) {
  if (!p || !usuarioId) return false;
  return p.usuarioId === usuarioId || p.voz?.permisos?.[usuarioId] !== false;
}

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
const minDe = (iso: string) => aMin(iso.slice(11, 16));

// Signos en sus horarios y medicación de los últimos 7 días (para los indicadores del espacio).
export function cumplimientoSemana(db: DB, familiaId: Id, ahora: Date) {
  const pac = db.pacientes.find((p) => p.familiaId === familiaId);
  const horarios = pac?.horariosSignos?.length ? pac.horariosSignos : HORARIOS_SIGNOS_BASE;
  const lecturas = db.lecturas.filter((l) => l.familiaId === familiaId);
  const meds = db.medicamentos.filter((m) => m.familiaId === familiaId);
  const s = { programadas: 0, cumplidas: 0 };
  const m = { programadas: 0, dadas: 0, omitidas: 0 };
  for (let i = 0; i < 7; i++) {
    const dia = new Date(ahora);
    dia.setDate(dia.getDate() - i);
    const f = fechaISO(dia);
    const limite = i === 0 ? ahora.getHours() * 60 + ahora.getMinutes() : 24 * 60;
    horarios.filter((h) => aMin(h) <= limite).forEach((h) => {
      s.programadas++;
      if (lecturas.some((l) => l.fechaHora.slice(0, 10) === f && Math.abs(minDe(l.fechaHora) - aMin(h)) <= 150)) s.cumplidas++;
    });
    meds.forEach((med) => {
      // Cada medicamento cuenta desde su primer registro de toma
      const inicio = db.tomas.filter((x) => x.medicamentoId === med.id).map((x) => x.fecha).sort()[0] ?? fechaISO(ahora);
      if (f < inicio) return;
      med.horarios.filter((h) => aMin(h) <= limite).forEach((h) => {
        const t = db.tomas.find((x) => x.medicamentoId === med.id && x.fecha === f && x.horario === h);
        m.programadas++;
        if (t?.estado === "dada") m.dadas++;
        if (t?.estado === "omitida") m.omitidas++;
      });
    });
  }
  const desde = new Date(ahora);
  desde.setDate(desde.getDate() - 30);
  return { signos: { ...s, registros30: lecturas.filter((l) => l.fechaHora.slice(0, 10) >= fechaISO(desde)).length }, medicacion: m };
}

export type Notificacion = {
  id: string;
  nivel: "rojo" | "amarillo" | "info";
  titulo: string;
  detalle: string;
  href: string;
  fecha: string;
};

// Centro de notificaciones: no solo lo registrado, también lo que pide acción. Depende del rol.
export function notificaciones(db: DB, usuario: Usuario, familiaId: Id | null, rol: Membresia["rol"] | null, ahora: Date): Notificacion[] {
  const out: Notificacion[] = [];
  const hoy = fechaISO(ahora);
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
  const iso = `${hoy}T${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}:00`;
  const nombre = (id?: Id | null) => db.usuarios.find((u) => u.id === id)?.nombre.split(" ")[0] ?? "Alguien";
  const hace3 = new Date(ahora);
  hace3.setDate(hace3.getDate() - 3);
  const desde3 = fechaISO(hace3);

  // Personales: lo que te piden en la red
  db.solicitudes.filter((x) => x.usuarioId === usuario.id && x.estado === "enviada").forEach((x) =>
    out.push({ id: `sol-${x.id}`, nivel: "amarillo", titulo: "Una familia te pide un relevo", detalle: db.familias.find((f) => f.id === x.familiaId)?.nombre ?? "", href: "/red", fecha: x.creadaEn }),
  );
  db.prestamos.filter((x) => x.aUsuarioId === usuario.id && x.estado === "enviada").forEach((x) =>
    out.push({ id: `pre-${x.id}`, nivel: "amarillo", titulo: "Te piden equipo prestado", detalle: `${nombre(x.deUsuarioId)} · ${x.tipo}`, href: "/red", fecha: x.creadaEn }),
  );

  if (familiaId && rol) {
    const cuida = rol === "coordinacion" || rol === "cuidado" || rol === "apoyo";
    const pac = db.pacientes.find((p) => p.familiaId === familiaId);
    const relevos = db.relevos.filter((r) => r.familiaId === familiaId);
    const etiqueta = (r: Relevo) => `${r.fecha === hoy ? "Hoy" : ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][diaSemana(fechaDe(r.fecha))]} ${rangoRelevo(r)}`;

    // Alertas activas: sin seguimiento, o recién lanzadas
    db.alertas.filter((a) => a.familiaId === familiaId && a.estado === "activa").forEach((a) => {
      const min = Math.round((new Date(iso).getTime() - new Date(a.fechaHora).getTime()) / 60000);
      const sinRespuesta = !(a.respuestas ?? []).length;
      if (sinRespuesta && min > MINUTOS_A_TIEMPO) out.push({ id: `sinseg-${a.id}`, nivel: "rojo", titulo: "Alerta sin seguimiento", detalle: `${a.titulo} · hace ${min} min nadie ha respondido`, href: "/alertas", fecha: a.fechaHora });
      else if (a.origen === "persona") out.push({ id: `per-${a.id}`, nivel: "amarillo", titulo: a.titulo, detalle: "Lo pidió desde su cuenta: respóndele", href: "/alertas", fecha: a.fechaHora });
      else out.push({ id: `al-${a.id}`, nivel: a.nivel === "rojo" ? "rojo" : "amarillo", titulo: a.origen === "panico" ? `Botón de pánico de ${nombre(a.porUsuarioId)}` : a.titulo, detalle: sinRespuesta ? "Responde para avisar que la atiendes" : `${(a.respuestas ?? []).length} respuesta(s)`, href: "/alertas", fecha: a.fechaHora });
    });

    if (rol === "persona") {
      // La persona ve las respuestas a lo que pidió y quién la acompaña hoy
      db.alertas.filter((a) => a.familiaId === familiaId && a.porUsuarioId === usuario.id && (a.respuestas ?? []).length).forEach((a) => {
        const r = a.respuestas!.at(-1)!;
        out.push({ id: `resp-${a.id}-${r.fechaHora}`, nivel: "info", titulo: `${nombre(r.porUsuarioId)} te respondió`, detalle: r.texto, href: "/mi-voz", fecha: r.fechaHora });
      });
      const turno = relevos.find((r) => r.fecha === hoy && r.inicio * 60 <= ahoraMin && (r.inicio + r.horas) * 60 > ahoraMin && r.asignadoA);
      if (turno) out.push({ id: `turno-${turno.id}`, nivel: "info", titulo: `Hoy te acompaña ${nombre(turno.asignadoA)}`, detalle: rangoRelevo(turno), href: "/mi-voz", fecha: `${hoy}T${String(turno.inicio).padStart(2, "0")}:00:00` });
    }

    if (cuida) {
      // Horarios sin cubrir en los próximos 7 días
      const limite = new Date(ahora);
      limite.setDate(limite.getDate() + 7);
      relevos
        .filter((r) => !r.asignadoA && r.fecha >= hoy && r.fecha <= fechaISO(limite) && !(r.fecha === hoy && (r.inicio + r.horas) * 60 <= ahoraMin))
        .filter((r) => !db.solicitudes.some((x) => x.relevoId === r.id && x.estado === "enviada"))
        .forEach((r) => out.push({ id: `sin-${r.id}`, nivel: "amarillo", titulo: "Horario sin cubrir", detalle: `${etiqueta(r)}: pide apoyo a la familia o a la red`, href: "/relevos", fecha: `${r.fecha}T${String(r.inicio).padStart(2, "0")}:00:00` }));

      // Relevos aceptados (últimos 3 días)
      db.intercambios.filter((x) => x.familiaId === familiaId && x.estado === "aceptado" && (x.respondidoEn ?? "") >= desde3).forEach((x) => {
        const r = relevos.find((y) => y.id === x.relevoId);
        out.push({ id: `acep-i-${x.id}`, nivel: "info", titulo: `${nombre(x.aUsuarioId)} aceptó el relevo`, detalle: r ? etiqueta(r) : "", href: "/relevos", fecha: x.respondidoEn! });
      });
      db.solicitudes.filter((x) => x.familiaId === familiaId && x.estado === "aceptada" && (x.respondidaEn ?? "") >= desde3).forEach((x) => {
        const r = relevos.find((y) => y.id === x.relevoId);
        out.push({ id: `acep-s-${x.id}`, nivel: "info", titulo: `${nombre(x.usuarioId)} (red) aceptó el relevo`, detalle: r ? etiqueta(r) : "", href: "/relevos", fecha: x.respondidaEn! });
      });

      // "Vuelve a revisar": recordatorio para volver a medir
      const ultima = db.lecturas.filter((l) => l.familiaId === familiaId).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))[0];
      if (ultima && ultima.nivel === "amarillo" && ultima.fechaHora.slice(0, 10) === hoy) {
        const toca = minDe(ultima.fechaHora) + (pac?.revisarEnMin ?? 15);
        const hh = `${String(Math.floor(toca / 60) % 24).padStart(2, "0")}:${String(toca % 60).padStart(2, "0")}`;
        out.push(toca <= ahoraMin
          ? { id: `revisar-${ultima.id}`, nivel: "amarillo", titulo: "Toca volver a medir", detalle: `Lo recomendó el registro de las ${ultima.fechaHora.slice(11, 16)}; si empeora, sube a alerta grave`, href: "/chat", fecha: `${hoy}T${hh}:00` }
          : { id: `revisar-pre-${ultima.id}`, nivel: "info", titulo: `Vuelve a medir a las ${hh}`, detalle: "Recomendación de «vuelve a revisar»", href: "/chat", fecha: iso });
      }

      // Horario de toma de signos vitales
      const horarios = pac?.horariosSignos?.length ? pac.horariosSignos : HORARIOS_SIGNOS_BASE;
      horarios.forEach((h) => {
        const m = aMin(h);
        const hecha = db.lecturas.some((l) => l.familiaId === familiaId && l.fechaHora.slice(0, 10) === hoy && Math.abs(minDe(l.fechaHora) - m) <= 150);
        if (hecha) return;
        if (m <= ahoraMin) out.push({ id: `sig-${hoy}-${h}`, nivel: "amarillo", titulo: `Toca registrar signos de las ${h}`, detalle: `Signos de ${pac?.nombre ?? "la persona mayor"} sin registrar`, href: "/valoracion", fecha: `${hoy}T${h}:00` });
        else if (m - ahoraMin <= 60) out.push({ id: `sig-pre-${hoy}-${h}`, nivel: "info", titulo: `En ${m - ahoraMin} min toca la toma de signos`, detalle: `Horario de las ${h}`, href: "/valoracion", fecha: iso });
      });

      // Medicación pendiente de hoy
      db.medicamentos.filter((med) => med.familiaId === familiaId).forEach((med) =>
        med.horarios.filter((h) => aMin(h) <= ahoraMin && !db.tomas.some((t) => t.medicamentoId === med.id && t.fecha === hoy && t.horario === h)).forEach((h) =>
          out.push({ id: `med-${med.id}-${hoy}-${h}`, nivel: "amarillo", titulo: `${med.nombre} de las ${h} sin registrar`, detalle: "Marca si se dio o se omitió", href: "/paciente", fecha: `${hoy}T${h}:00` }),
        ),
      );

      // Gastos del mes arriba del tope: necesitan apoyo financiero
      const famG = db.familias.find((f) => f.id === familiaId);
      if (famG?.topeGastoMes) {
        const hace30g = new Date(ahora);
        hace30g.setDate(hace30g.getDate() - 30);
        const totalMes = db.gastos.filter((g) => g.familiaId === familiaId && g.fecha >= fechaISO(hace30g)).reduce((a, g) => a + g.monto, 0);
        if (totalMes > famG.topeGastoMes) out.push({ id: `tope-${hoy}`, nivel: "amarillo", titulo: "Gastos arriba del tope del mes", detalle: `$${totalMes.toLocaleString("es-MX")} de $${famG.topeGastoMes.toLocaleString("es-MX")}: busquen apoyo financiero`, href: "/gastos", fecha: iso });
      }

      // Evidencia por confirmar y escala de Zarit pendiente
      const porConfirmar = db.evidencias.filter((e) => e.familiaId === familiaId && !e.confirmadaPor && e.porUsuarioId !== usuario.id).length;
      if (porConfirmar) out.push({ id: `evi-${porConfirmar}`, nivel: "info", titulo: `${porConfirmar} registro(s) por confirmar`, detalle: "Confirma lo que registró otra persona de la familia", href: "/seguimiento", fecha: iso });
      const z = db.zarit.filter((x) => x.usuarioId === usuario.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
      const hace30 = new Date(ahora);
      hace30.setDate(hace30.getDate() - 30);
      if (!z || z.fecha < fechaISO(hace30)) out.push({ id: `zarit-${hoy}`, nivel: "info", titulo: "¿Cómo estás tú?", detalle: "Responde la escala de sobrecarga (2 minutos)", href: "/perfil", fecha: iso });
    }
  }
  const peso = { rojo: 0, amarillo: 1, info: 2 };
  return out.sort((a, b) => peso[a.nivel] - peso[b.nivel] || (a.fecha < b.fecha ? 1 : -1));
}

// Gastos del cuidado en un periodo: total, por categoría, quién aportó, cuánto le toca a cada quien
// según el reparto acordado y las transferencias para quedar a mano. Lo que paga la persona mayor
// (por ejemplo, de su pensión) se descuenta antes de repartir.
export function resumenGastos(db: DB, familiaId: Id, desde: string) {
  const fam = db.familias.find((f) => f.id === familiaId);
  const pac = db.pacientes.find((p) => p.familiaId === familiaId);
  const gastos = db.gastos.filter((g) => g.familiaId === familiaId && g.fecha >= desde).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const total = gastos.reduce((a, g) => a + g.monto, 0);
  const porCategoria = Object.entries(gastos.reduce<Record<string, number>>((a, g) => ({ ...a, [g.categoria]: (a[g.categoria] ?? 0) + g.monto }), {})).sort((a, b) => b[1] - a[1]);
  const deElla = gastos.filter((g) => g.pagoPor === pac?.usuarioId).reduce((a, g) => a + g.monto, 0);
  const miembros = integrantes(db, familiaId).filter((i) => i.membresia.rol !== "persona").map((i) => i.usuario);
  const reparto = fam?.reparto && Object.keys(fam.reparto).length ? fam.reparto : Object.fromEntries(miembros.map((u) => [u.id, 100 / Math.max(1, miembros.length)]));
  const sumaPct = Object.values(reparto).reduce((a, b) => a + b, 0) || 100;
  const aRepartir = total - deElla;
  const filas = miembros.map((u) => {
    const aporto = gastos.filter((g) => g.pagoPor === u.id).reduce((a, g) => a + g.monto, 0);
    const pct = (reparto[u.id] ?? 0) / sumaPct;
    const leToca = Math.round(aRepartir * pct);
    return { usuario: u, aporto, pct: Math.round(pct * 100), leToca, saldo: aporto - leToca };
  });
  // Lo que alguien pone de más como aportación voluntaria no se le reembolsa: reduce lo que deben los demás.
  const voluntario = new Set(Object.entries(fam?.aportaDeMas ?? {}).filter(([, v]) => v).map(([k]) => k));
  const creditoTotal = filas.filter((f) => f.saldo > 0).reduce((a, f) => a + f.saldo, 0);
  const creditoCobrable = filas.filter((f) => f.saldo > 0 && !voluntario.has(f.usuario.id)).reduce((a, f) => a + f.saldo, 0);
  const factor = creditoTotal ? creditoCobrable / creditoTotal : 1;
  // Transferencias mínimas: quien debe le paga a quien puso de más (y no lo aportó como voluntario)
  const deudores = filas.filter((f) => f.saldo < 0).map((f) => ({ u: f.usuario, m: Math.round(-f.saldo * factor) }));
  const acreedores = filas.filter((f) => f.saldo > 0 && !voluntario.has(f.usuario.id)).map((f) => ({ u: f.usuario, m: f.saldo }));
  const transferencias: { de: Usuario; a: Usuario; monto: number }[] = [];
  for (const dd of deudores) {
    for (const ac of acreedores) {
      if (dd.m <= 0) break;
      const m = Math.min(dd.m, ac.m);
      if (m > 0) {
        transferencias.push({ de: dd.u, a: ac.u, monto: m });
        dd.m -= m;
        ac.m -= m;
      }
    }
  }
  const tope = fam?.topeGastoMes ?? 0;
  return {
    gastos, total, porCategoria, deElla, aRepartir, transferencias, reparto, tope, excedido: tope > 0 && total > tope,
    filas: filas.map((f) => ({ ...f, voluntario: voluntario.has(f.usuario.id), debeAjustado: f.saldo < 0 ? Math.round(-f.saldo * factor) : 0 })),
  };
}

// Transición de la familia: cómo se repartía el cuidado antes de Respira y cómo se reparte ahora.
export function transicionFamilia(db: DB, familiaId: Id, ahora: Date) {
  const fam = db.familias.find((f) => f.id === familiaId);
  const carga = cargaSemana(db, familiaId, ahora);
  const total = carga.filas.reduce((a, f) => a + f.horas, 0) + carga.externas;
  const principal = carga.filas.find((f) => f.usuario.id === fam?.creadaPor);
  const zarit = db.zarit.filter((z) => z.usuarioId === fam?.creadaPor).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
  const turnos = carga.filas
    .filter((f) => f.usuario.id !== fam?.creadaPor && f.horas > 0)
    .map((f) => {
      const suyos = db.relevos.filter((r) => r.familiaId === familiaId && r.asignadoA === f.usuario.id);
      const tipo = suyos.filter((r) => r.inicio >= 19).length >= suyos.length / 2 ? "noches" : suyos.filter((r) => r.inicio >= 13).length >= suyos.length / 2 ? "tardes" : "mañanas";
      return { usuario: f.usuario, rol: f.membresia.rol, horas: f.horas, tipo };
    });
  return {
    antes: fam?.lineaBase ?? null,
    principal: principal?.usuario ?? null,
    pctPrincipal: total ? Math.round(((principal?.horas ?? 0) / total) * 100) : 0,
    horasPrincipal: principal?.horas ?? 0,
    zaritAhora: zarit?.puntaje ?? null,
    turnos,
    externas: carga.externas,
  };
}

// ---------- Series para gráficas ----------
const ventanas = (ahora: Date, semanas: number) =>
  Array.from({ length: semanas }, (_, k) => {
    const fin = new Date(ahora);
    fin.setDate(fin.getDate() - 7 * (semanas - 1 - k));
    const ini = new Date(fin);
    ini.setDate(ini.getDate() - 6);
    return { desde: fechaISO(ini), hasta: fechaISO(fin), etiqueta: k === semanas - 1 ? "Esta sem." : `Hace ${semanas - 1 - k} sem.` };
  });

// Horas que cubrió una persona por semana (perfil individual)
export function horasPorSemana(db: DB, usuarioId: Id, ahora: Date, semanas = 4) {
  return ventanas(ahora, semanas).map((w) => ({
    etiqueta: w.etiqueta,
    valor: db.relevos.filter((r) => r.asignadoA === usuarioId && r.fecha >= w.desde && r.fecha <= w.hasta && estadoRelevo(r, ahora) === "cubierto").reduce((a, r) => a + r.horas, 0),
  }));
}

// Horas de relevo para la cuidadora principal por semana (las que cubrió alguien más)
export function relevoPrincipalPorSemana(db: DB, familiaId: Id, ahora: Date, semanas = 3) {
  const principal = db.familias.find((f) => f.id === familiaId)?.creadaPor;
  return ventanas(ahora, semanas).map((w) => ({
    etiqueta: w.etiqueta,
    valor: db.relevos.filter((r) => r.familiaId === familiaId && r.asignadoA && r.asignadoA !== principal && r.fecha >= w.desde && r.fecha <= w.hasta && estadoRelevo(r, ahora) === "cubierto").reduce((a, r) => a + r.horas, 0),
  }));
}

// Minutos hasta la primera respuesta de cada alerta grave
export function minutosAlertas(db: DB, familiaId: Id) {
  return db.alertas
    .filter((a) => a.familiaId === familiaId && a.nivel === "rojo" && a.atendidaEn)
    .sort((a, b) => (a.fechaHora < b.fechaHora ? -1 : 1))
    .map((a) => ({ etiqueta: `${a.fechaHora.slice(8, 10)}/${a.fechaHora.slice(5, 7)}`, valor: Math.max(0, Math.round((new Date(a.atendidaEn!).getTime() - new Date(a.fechaHora).getTime()) / 60000)) }));
}

// Serie de un signo en las últimas lecturas
export function serieSigno(db: DB, familiaId: Id, campo: "paSist" | "glucosa" | "fc", n = 10) {
  return db.lecturas
    .filter((l) => l.familiaId === familiaId && l[campo] !== undefined)
    .sort((a, b) => (a.fechaHora < b.fechaHora ? -1 : 1))
    .slice(-n)
    .map((l) => ({ etiqueta: `${l.fechaHora.slice(8, 10)}/${l.fechaHora.slice(5, 7)} ${l.fechaHora.slice(11, 13)}h`, valor: l[campo] as number }));
}

// Calificación de quien releva: promedio de reseñas de familias
export function calificacion(db: DB, usuarioId: Id) {
  const resenas = db.resenas.filter((r) => r.aUsuarioId === usuarioId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const promedio = resenas.length ? resenas.reduce((a, r) => a + r.estrellas, 0) / resenas.length : 0;
  return { promedio, n: resenas.length, resenas };
}

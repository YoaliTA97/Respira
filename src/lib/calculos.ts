import { CERTIFICACIONES, TUTORIALES, condicionCatalogo } from "./catalogos";
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
  const filas = integrantes(db, familiaId).map((i) => ({ ...i, horas: horasCuidado(db, i.usuario.id, ahora, desde, familiaId) }));
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

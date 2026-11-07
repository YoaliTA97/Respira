import { UMBRALES_BASE } from "./catalogos";
import centros from "@/data/centros-cdmx.json";
import type { DB, Disponibilidad, Relevo, Usuario } from "./types";

// Datos sintéticos: la familia Hernández, Lucía y los perfiles de la red son ficticios.
// Solo los centros de salud del mapa son datos reales (DENUE, INEGI).

export const DB_VERSION = 5;
export const CODIGO_DEMO = "123456";
export const FAMILIA_DEMO = "fam-hernandez";

export const fechaISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const masDias = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const diaSemana = (d: Date) => (d.getDay() + 6) % 7; // lunes = 0

export const semana = (inicio: number, fin: number, dias = [0, 1, 2, 3, 4, 5, 6]): Disponibilidad =>
  Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, dias.includes(d) ? [{ inicio, fin }] : []]));

const sinAyuda: Usuario["ofreceAyuda"] = { activo: false, radioKm: 3, modalidades: ["intercambio de horas"], tarifaHora: 0 };

export function crearSeed(hoy: Date): DB {
  const H = centros.hogar;
  const creado = `${fechaISO(masDias(hoy, -30))}T10:00:00`;
  const hace3 = fechaISO(masDias(hoy, -3));
  const antier = fechaISO(masDias(hoy, -2));
  const ayer = fechaISO(masDias(hoy, -1));
  const hoyISO = fechaISO(hoy);

  const usuario = (u: Partial<Usuario> & Pick<Usuario, "id" | "nombre" | "telefono" | "genero" | "tono">): Usuario => ({
    alcaldia: "Coyoacán",
    ubicacion: { lat: H.lat, lng: H.lng },
    bio: "",
    roles: [],
    experiencia: [],
    disponibilidad: {},
    ofreceAyuda: sinAyuda,
    saldoHoras: 0,
    creadoEn: creado,
    ...u,
  });

  const relevos: Relevo[] = [];
  for (let i = -14; i <= 7; i++) {
    const dia = masDias(hoy, i);
    const ds = diaSemana(dia);
    const f = fechaISO(dia);
    const tarde = ds === 1 || ds === 3 ? "u-mariana" : "u-rosa";
    const noche = ds <= 4 ? "u-jorge" : "u-rosa";
    // el próximo sábado queda sin cubrir; hace 5 días Lupita (red de cuidado) cubrió la mañana
    const manana = i > 0 && ds === 5 ? null : i === -5 ? "u-lupita" : "u-rosa";
    relevos.push(
      { id: `r-${f}-7`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 7, horas: 6, asignadoA: manana, origen: i === -5 ? "red" : "familia" },
      { id: `r-${f}-13`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 13, horas: 6, asignadoA: tarde, origen: "familia" },
      { id: `r-${f}-19`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 19, horas: 4, asignadoA: noche, origen: "familia" },
    );
  }

  return {
    version: DB_VERSION,
    usuarios: [
      usuario({ id: "u-rosa", nombre: "Rosa Hernández", telefono: "5510000001", genero: "mujer", tono: "t1", bio: "Cuido a mi mamá desde su caída. Dejé mi trabajo de medio tiempo.", roles: ["Cuidar a mi familiar", "Coordinar a la familia", "Llevar a consultas"], experiencia: ["Medir glucosa"], disponibilidad: semana(7, 23) }),
      usuario({ id: "u-jorge", nombre: "Jorge Hernández", telefono: "5510000002", genero: "hombre", tono: "t2", roles: ["Cuidar a mi familiar"], disponibilidad: { ...semana(19, 23, [0, 1, 2, 3, 4]), 5: [{ inicio: 9, fin: 14 }] } }),
      usuario({ id: "u-mariana", nombre: "Mariana López", telefono: "5510000003", genero: "mujer", tono: "t3", roles: ["Cuidar a mi familiar", "Acompañamiento"], disponibilidad: { ...semana(13, 20, [1, 3]), 6: [{ inicio: 10, fin: 18 }] } }),
      usuario({
        id: "u-lupita", nombre: "Lupita Méndez", telefono: "5510000004", genero: "mujer", tono: "t4", bio: "Cuidadora en cooperativa. Cuidé a mi papá 8 años.",
        roles: ["Hacer relevos en la red"], experiencia: ["Primeros auxilios", "Cuidado de demencia"], disponibilidad: semana(6, 22), ubicacion: { lat: H.lat + 0.008, lng: H.lng + 0.006 },
        ofreceAyuda: { activo: true, radioKm: 5, modalidades: ["pago", "programa de apoyo"], tarifaHora: 120 },
      }),
      usuario({
        id: "u-chela", nombre: "Chela Ramírez", telefono: "5510000005", genero: "mujer", tono: "t5", bio: "Vecina de la colonia; cuidé a mi mamá 6 años.",
        roles: ["Hacer relevos en la red", "Acompañamiento", "Compras y mandados"], experiencia: ["Preparar comida para diabetes"], disponibilidad: semana(8, 18), ubicacion: { lat: H.lat + 0.003, lng: H.lng - 0.003 },
        ofreceAyuda: { activo: true, radioKm: 2, modalidades: ["intercambio de horas", "pago"], tarifaHora: 80 },
      }),
      usuario({
        id: "u-teresa", nombre: "Teresa Gómez", telefono: "5510000006", genero: "mujer", tono: "t2", roles: ["Hacer relevos en la red"], experiencia: ["Rehabilitación"],
        disponibilidad: semana(7, 15, [0, 1, 2, 3, 4, 5]), ubicacion: { lat: H.lat - 0.018, lng: H.lng + 0.012 },
        ofreceAyuda: { activo: true, radioKm: 4, modalidades: ["pago"], tarifaHora: 90 },
      }),
      usuario({
        id: "u-alberto", nombre: "Alberto Pérez", telefono: "5510000007", genero: "hombre", tono: "t5", bio: "Enfermero general.", roles: ["Hacer relevos en la red", "Cuidado nocturno"], experiencia: ["Enfermería", "Manejo de sonda", "Oxígeno en casa"],
        disponibilidad: semana(7, 23), ubicacion: { lat: H.lat + 0.03, lng: H.lng - 0.022 },
        ofreceAyuda: { activo: true, radioKm: 8, modalidades: ["pago", "programa de apoyo"], tarifaHora: 150 },
      }),
      usuario({
        id: "u-guadalupe", nombre: "Guadalupe Torres", telefono: "5510000008", genero: "mujer", tono: "t3", roles: ["Hacer relevos en la red"], experiencia: ["Pie diabético"],
        disponibilidad: semana(6, 20), ubicacion: { lat: H.lat - 0.055, lng: H.lng - 0.04 }, alcaldia: "Tlalpan",
        ofreceAyuda: { activo: true, radioKm: 10, modalidades: ["pago"], tarifaHora: 130 },
      }),
    ],
    familias: [
      {
        id: FAMILIA_DEMO, nombre: "Familia Hernández", alcaldia: "Coyoacán", hogar: { lat: H.lat, lng: H.lng, referencia: "Santa Úrsula Coapa, Coyoacán (punto de ejemplo)" },
        creadaPor: "u-rosa", creadaEn: `${hace3}T18:00:00`, consentimiento: { registro: true, alertasWhatsApp: true, indicadores: true, fecha: `${hace3}T18:00:00` },
      },
    ],
    membresias: [
      { id: "mb-rosa", familiaId: FAMILIA_DEMO, usuarioId: "u-rosa", rol: "coordinacion", parentesco: "Hija", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-jorge", familiaId: FAMILIA_DEMO, usuarioId: "u-jorge", rol: "cuidado", parentesco: "Hijo", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-mariana", familiaId: FAMILIA_DEMO, usuarioId: "u-mariana", rol: "cuidado", parentesco: "Nieta", principal: false, estado: "activa", desde: hace3 },
    ],
    pacientes: [
      {
        id: "p-lucia", familiaId: FAMILIA_DEMO, nombre: "Lucía", edad: 78, sexo: "mujer", condiciones: ["diabetes", "caida", "Cataratas"], alergias: ["Penicilina"],
        evento: { tipo: "caida", fecha: hace3, descripcion: "Se resbaló en el baño.", lesion: "Sin fractura según urgencias; dolor en la cadera izquierda." },
        movilidad: "con apoyo", signos: ["fc", "fr", "pa", "glucosa", "dolor", "conciencia"], umbrales: UMBRALES_BASE,
        notas: "Usa bastón desde la caída. Dormitorio en planta baja.",
      },
    ],
    medicamentos: [
      { id: "med-1", familiaId: FAMILIA_DEMO, nombre: "Metformina", dosis: "Según receta", horarios: ["08:00", "20:00"], indicaciones: "Con alimentos." },
      { id: "med-2", familiaId: FAMILIA_DEMO, nombre: "Insulina", dosis: "Según receta", horarios: ["22:00"], indicaciones: "Aplicación subcutánea; rotar sitio." },
      { id: "med-3", familiaId: FAMILIA_DEMO, nombre: "Analgésico indicado en urgencias", dosis: "Según receta", horarios: ["08:00", "16:00"], indicaciones: "Solo los días que indicó el médico." },
    ],
    tomas: [
      { id: "t-1", medicamentoId: "med-1", fecha: hoyISO, horario: "08:00", estado: "dada", porUsuarioId: "u-rosa", registradaEn: `${hoyISO}T08:05:00` },
      { id: "t-2", medicamentoId: "med-3", fecha: hoyISO, horario: "08:00", estado: "dada", porUsuarioId: "u-rosa", registradaEn: `${hoyISO}T08:06:00` },
    ],
    lecturas: [
      { id: "l-0", familiaId: FAMILIA_DEMO, fechaHora: `${hace3}T19:20:00`, porUsuarioId: "u-jorge", fc: 92, fr: 20, paSist: 145, paDiast: 88, glucosa: 188, dolor: 7, conciencia: "alerta", senales: ["caida"], origen: "nota de voz", nivel: "amarillo" },
      { id: "l-1", familiaId: FAMILIA_DEMO, fechaHora: `${antier}T07:15:00`, porUsuarioId: "u-rosa", fc: 76, fr: 17, paSist: 128, paDiast: 78, glucosa: 135, dolor: 5, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
      { id: "l-2", familiaId: FAMILIA_DEMO, fechaHora: `${ayer}T19:05:00`, porUsuarioId: "u-jorge", fc: 80, fr: 18, paSist: 132, paDiast: 80, glucosa: 162, dolor: 4, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
      { id: "l-3", familiaId: FAMILIA_DEMO, fechaHora: `${hoyISO}T07:10:00`, porUsuarioId: "u-rosa", fc: 74, fr: 16, paSist: 125, paDiast: 76, glucosa: 118, dolor: 3, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
    ],
    relevos,
    intercambios: [],
    solicitudes: [],
    mensajes: [
      { id: "msg-1", familiaId: FAMILIA_DEMO, de: "asistente", tipo: "sistema", fechaHora: `${hace3}T18:01:00`, texto: "Se creó el espacio de cuidado de Lucía. Al recibirla en cada relevo, graben una nota de voz con su frecuencia cardiaca, respiración, presión, glucosa, dolor y cómo está de alerta." },
      { id: "msg-2", familiaId: FAMILIA_DEMO, de: "u-mariana", tipo: "texto", fechaHora: `${hace3}T20:12:00`, texto: "El martes y jueves en la tarde me quedo con la abuela." },
      { id: "msg-3", familiaId: FAMILIA_DEMO, de: "u-jorge", tipo: "nota de voz", fechaHora: `${ayer}T19:05:00`, texto: "Recibo a mi mamá. Pulso 80, respira 18 por minuto, presión 132 sobre 80, glucosa 162. Dolor 4 de 10, está platicando." },
      {
        id: "msg-4", familiaId: FAMILIA_DEMO, de: "asistente", tipo: "respuesta", nivel: "verde", fuente: "reglas", fechaHora: `${ayer}T19:05:30`,
        texto: "Recibí el reporte de Lucía. Los signos que registraste están dentro de los rangos de su perfil. Prevención: retira tapetes y cables del camino al baño y a la cama.",
        hallazgos: [
          { etiqueta: "Frecuencia cardiaca", valor: "80 lpm", estado: "normal" },
          { etiqueta: "Frecuencia respiratoria", valor: "18 rpm", estado: "normal" },
          { etiqueta: "Presión arterial", valor: "132/80 mmHg", estado: "normal" },
          { etiqueta: "Glucosa", valor: "162 mg/dL", estado: "normal" },
        ],
      },
    ],
    alertas: [],
    progreso: [
      { tutorialId: "signos-vitales", usuarioId: "u-rosa", completado: true, fecha: hace3, practicas: 6 },
      { tutorialId: "glucosa", usuarioId: "u-rosa", completado: true, fecha: hace3, practicas: 5 },
      { tutorialId: "movilizacion", usuarioId: "u-rosa", completado: true, fecha: antier, practicas: 2 },
      { tutorialId: "signos-vitales", usuarioId: "u-jorge", completado: true, fecha: antier, practicas: 2 },
      ...["signos-vitales", "insulina", "heridas", "movilizacion", "prevencion-caidas"].map((t) => ({ tutorialId: t, usuarioId: "u-lupita", completado: true, fecha: creado.slice(0, 10), practicas: 20 })),
      ...["movilizacion", "glucosa"].map((t) => ({ tutorialId: t, usuarioId: "u-chela", completado: true, fecha: creado.slice(0, 10), practicas: 10 })),
      ...["movilizacion", "prevencion-caidas"].map((t) => ({ tutorialId: t, usuarioId: "u-teresa", completado: true, fecha: creado.slice(0, 10), practicas: 8 })),
      ...["signos-vitales", "insulina", "heridas"].map((t) => ({ tutorialId: t, usuarioId: "u-alberto", completado: true, fecha: creado.slice(0, 10), practicas: 30 })),
      ...["signos-vitales", "glucosa", "pies"].map((t) => ({ tutorialId: t, usuarioId: "u-guadalupe", completado: true, fecha: creado.slice(0, 10), practicas: 15 })),
    ],
    certificaciones: [
      { id: "cuidados-basicos-1", usuarioId: "u-lupita", estado: "certificada", fecha: creado.slice(0, 10) },
      { id: "cuidados-basicos-1", usuarioId: "u-alberto", estado: "certificada", fecha: creado.slice(0, 10) },
      { id: "cuidado-diabetes", usuarioId: "u-guadalupe", estado: "certificada", fecha: creado.slice(0, 10) },
    ],
  };
}

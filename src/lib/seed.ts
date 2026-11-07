import { UMBRALES_BASE } from "./catalogos";
import centros from "@/data/centros-cdmx.json";
import type { DB, Disponibilidad, Relevo, Usuario } from "./types";

// Datos sintéticos: la familia Hernández, Lucía y los perfiles de la red son ficticios.
// Solo los centros de salud del mapa son datos reales (DENUE, INEGI).

export const DB_VERSION = 7;
export const CODIGO_DEMO = "123456";
export const FAMILIA_DEMO = "fam-hernandez";
export const CODIGO_FAMILIA_DEMO = "HRN482";

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

// Imagen ilustrativa de la pantalla de un equipo de medición (datos sintéticos de la demo).
export const imagenEjemplo = (valor: string, unidad: string) => lecturaSvg(valor, unidad);
const lecturaSvg = (valor: string, unidad: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" rx="28" fill="#dfe3ee"/><rect x="40" y="36" width="240" height="110" rx="14" fill="#c9d8c5" stroke="#8a9a86" stroke-width="3"/><text x="160" y="104" font-family="monospace" font-size="44" font-weight="700" text-anchor="middle" fill="#1b1e33">${valor}</text><text x="160" y="134" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#34384f">${unidad}</text><circle cx="160" cy="172" r="12" fill="#2e3f8f"/></svg>`,
  )}`;

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
        roles: ["Hacer relevos en la red"], experiencia: ["Primeros auxilios", "Cuidado de demencia"], equipo: ["oximetro", "glucometro"], disponibilidad: semana(6, 22), ubicacion: { lat: H.lat + 0.008, lng: H.lng + 0.006 },
        ofreceAyuda: { activo: true, radioKm: 5, modalidades: ["pago", "programa de apoyo"], tarifaHora: 120 },
      }),
      usuario({
        id: "u-chela", nombre: "Chela Ramírez", telefono: "5510000005", genero: "mujer", tono: "t5", bio: "Vecina de la colonia; cuidé a mi mamá 6 años.",
        roles: ["Hacer relevos en la red", "Acompañamiento", "Compras y mandados"], experiencia: ["Preparar comida para diabetes"], equipo: ["baumanometro", "silla-ruedas"], disponibilidad: semana(8, 18), ubicacion: { lat: H.lat + 0.003, lng: H.lng - 0.003 },
        ofreceAyuda: { activo: true, radioKm: 2, modalidades: ["intercambio de horas", "pago"], tarifaHora: 80 },
      }),
      usuario({
        id: "u-teresa", nombre: "Teresa Gómez", telefono: "5510000006", genero: "mujer", tono: "t2", roles: ["Hacer relevos en la red"], experiencia: ["Rehabilitación"], equipo: ["andadera"],
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
      // Lucía tiene su propio acceso: su voz, sus decisiones y sus permisos
      usuario({
        id: "u-lucia", nombre: "Lucía Hernández", telefono: "5510000012", genero: "mujer", tono: "t3", bio: "Abuela de la familia Hernández. Cocinera de mole los domingos.",
        roles: ["Acompañamiento"], disponibilidad: semana(10, 13, [1, 3]), saldoHoras: 5,
      }),
      // Personas identificadas por SIDECU (convenio por confirmar con la Secretaría de las Mujeres)
      usuario({
        id: "u-rocio", nombre: "Rocío Salinas", telefono: "5510000009", genero: "mujer", tono: "t2", fuente: "sidecu", bio: "Cuidadora comunitaria de un centro público de cuidado de la alcaldía.",
        roles: ["Hacer relevos en la red", "Acompañamiento"], experiencia: ["Movilizar en cama", "Tomar presión"], disponibilidad: semana(8, 16, [0, 1, 2, 3, 4, 5]),
        ubicacion: { lat: H.lat + 0.011, lng: H.lng - 0.009 }, ofreceAyuda: { activo: true, radioKm: 4, modalidades: ["programa de apoyo"], tarifaHora: 0 },
      }),
      usuario({
        id: "u-martha", nombre: "Martha Ruiz", telefono: "5510000010", genero: "mujer", tono: "t4", fuente: "sidecu", bio: "Promotora de cuidados para personas mayores.",
        roles: ["Acompañamiento", "Llevar a consultas"], experiencia: ["Primeros auxilios"], disponibilidad: semana(7, 19),
        ubicacion: { lat: H.lat - 0.007, lng: H.lng + 0.014 }, ofreceAyuda: { activo: true, radioKm: 5, modalidades: ["programa de apoyo", "pago"], tarifaHora: 90 },
      }),
      usuario({
        id: "u-irma", nombre: "Irma Castillo", telefono: "5510000011", genero: "mujer", tono: "t1", fuente: "sidecu", bio: "Auxiliar de cuidados en una residencia de día.",
        roles: ["Hacer relevos en la red"], experiencia: ["Curación de heridas", "Medir glucosa"], disponibilidad: semana(14, 22),
        ubicacion: { lat: H.lat + 0.021, lng: H.lng + 0.018 }, ofreceAyuda: { activo: true, radioKm: 6, modalidades: ["pago", "programa de apoyo"], tarifaHora: 110 },
      }),
    ],
    familias: [
      {
        id: FAMILIA_DEMO, nombre: "Familia Hernández", alcaldia: "Coyoacán", hogar: { lat: H.lat, lng: H.lng, referencia: "Santa Úrsula Coapa, Coyoacán (punto de ejemplo)" },
        creadaPor: "u-rosa", creadaEn: `${hace3}T18:00:00`, consentimiento: { registro: true, alertasWhatsApp: true, indicadores: true, fecha: `${hace3}T18:00:00` }, codigo: CODIGO_FAMILIA_DEMO,
      },
    ],
    membresias: [
      { id: "mb-rosa", familiaId: FAMILIA_DEMO, usuarioId: "u-rosa", rol: "coordinacion", parentesco: "Hija", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-jorge", familiaId: FAMILIA_DEMO, usuarioId: "u-jorge", rol: "cuidado", parentesco: "Hijo", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-mariana", familiaId: FAMILIA_DEMO, usuarioId: "u-mariana", rol: "cuidado", parentesco: "Nieta", principal: false, estado: "activa", desde: hace3 },
      { id: "mb-lucia", familiaId: FAMILIA_DEMO, usuarioId: "u-lucia", rol: "persona", parentesco: "Persona cuidada", principal: false, estado: "activa", desde: hace3 },
    ],
    pacientes: [
      {
        id: "p-lucia", familiaId: FAMILIA_DEMO, nombre: "Lucía", edad: 78, sexo: "mujer", condiciones: ["diabetes", "caida", "Cataratas"], alergias: ["Penicilina"],
        usuarioId: "u-lucia",
        voz: {
          palabras: {
            texto: "Me gusta despertar temprano y tomar mi café de olla viendo el patio. Quiero seguir cocinando el mole del domingo aunque sea sentada. No me gusta que me bañen con prisa ni que hablen de mí como si no estuviera. Prefiero que me pregunten antes de mover mis cosas.",
            fecha: hace3, porUsuarioId: "u-lucia",
          },
          gustos: ["Café de olla", "Radio por la mañana", "Cocinar el mole del domingo", "Ver a mis bisnietos"],
          rutinas: ["Me despierto a las 6:30", "Desayuno a las 8:00", "Siesta después de comer", "Rosario a las 19:00"],
          noQuiero: ["Que me bañen con prisa", "Que decidan por mí sin preguntarme", "Dormir con la luz apagada"],
          permisos: { "u-mariana": true, "u-jorge": true, "u-rosa": true },
          decisiones: {
            clinica: "Su hospital del IMSS (no quiere ir a uno privado lejos de casa)", acompanante: "Rosa; si no puede, Mariana", voluntadAnticipada: true,
            notas: "Documento de voluntad anticipada firmado (dato de ejemplo); copia con Rosa.", fecha: hace3,
          },
          metas: [
            { id: "meta-1", texto: "Caminar 10 minutos después de comer", hechas: [antier, ayer] },
            { id: "meta-2", texto: "Ponerme los zapatos sola", hechas: [ayer] },
          ],
        },
        historia: { antecedentes: ["Diabetes", "Caída en los últimos 6 meses"], dispositivos: ["Lentes", "Bastón"], notas: "Operación de cataratas pendiente.", actualizada: hace3, porUsuarioId: "u-rosa" },
        servicios: {
          afiliacion: ["IMSS"], unidad: "Unidad de Medicina Familiar de su colonia", medico: "", ultimaConsulta: "1 a 3 meses", urgencias3m: true, citaPendiente: true, recetaVigente: true,
          medicamentosDe: "Una parte y otra", actualizada: hace3, porUsuarioId: "u-rosa",
        },
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
    // Lupita (red, certificada) cubrió una mañana con pago: cuenta como cuidadora certificada con ingreso.
    solicitudes: [{ id: "s-0", familiaId: FAMILIA_DEMO, relevoId: `r-${fechaISO(masDias(hoy, -5))}-7`, usuarioId: "u-lupita", pago: "pago", monto: 720, estado: "aceptada", creadaEn: `${fechaISO(masDias(hoy, -7))}T12:00:00` }],
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
    alertas: [
      {
        id: "a-0", familiaId: FAMILIA_DEMO, fechaHora: `${hace3}T19:20:00`, nivel: "amarillo", titulo: "Vigilar: dolor después de la caída", motivo: "Dolor de 7 de 10 y presión alta para su perfil.",
        trifecta: false, estado: "atendida", atendidaEn: `${hace3}T19:38:00`, origen: "reporte", porUsuarioId: "u-jorge",
      },
      {
        id: "a-1", familiaId: FAMILIA_DEMO, fechaHora: `${fechaISO(masDias(hoy, -12))}T06:40:00`, nivel: "rojo", titulo: "Glucosa muy baja", motivo: "Glucosa de 58 mg/dL con sudoración.",
        trifecta: false, estado: "atendida", atendidaEn: `${fechaISO(masDias(hoy, -12))}T07:31:00`, origen: "reporte", porUsuarioId: "u-rosa", centroElegido: "Centro de salud cercano",
      },
    ],
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
    zarit: [
      { id: "z-1", usuarioId: "u-rosa", fecha: hace3, respuestas: [4, 4, 3, 4, 3, 3, 4], puntaje: 25 },
      { id: "z-0", usuarioId: "u-rosa", fecha: fechaISO(masDias(hoy, -20)), respuestas: [3, 3, 2, 3, 2, 3, 3], puntaje: 19 },
      { id: "z-2", usuarioId: "u-jorge", fecha: hace3, respuestas: [2, 2, 2, 2, 1, 1, 2], puntaje: 12 },
      { id: "z-3", usuarioId: "u-mariana", fecha: antier, respuestas: [2, 2, 1, 2, 1, 1, 2], puntaje: 11 },
    ],
    sentires: [
      { id: "se-1", familiaId: FAMILIA_DEMO, fechaHora: `${ayer}T09:10:00`, dolor: 4, animo: "Regular", sueno: "Dormí mal", nota: "Me dolió la cadera en la noche.", porUsuarioId: "u-lucia" },
      { id: "se-2", familiaId: FAMILIA_DEMO, fechaHora: `${hoyISO}T08:30:00`, dolor: 3, animo: "Bien", sueno: "Regular", nota: "", porUsuarioId: "u-lucia" },
    ],
    aportes: [
      { id: "ap-1", familiaId: FAMILIA_DEMO, usuarioId: "u-lucia", actividad: "Llamada de compañía a otra persona mayor", horas: 1, fecha: antier },
      { id: "ap-2", familiaId: FAMILIA_DEMO, usuarioId: "u-lucia", actividad: "Enseñar una receta o un oficio", horas: 2, fecha: fechaISO(masDias(hoy, -6)) },
      { id: "ap-3", familiaId: FAMILIA_DEMO, usuarioId: "u-lucia", actividad: "Acompañar a mis nietos", horas: 2, fecha: fechaISO(masDias(hoy, -9)) },
    ],
    equipos: [
      { id: "eq-1", familiaId: FAMILIA_DEMO, tipo: "baumanometro", estado: "tenemos" },
      { id: "eq-2", familiaId: FAMILIA_DEMO, tipo: "glucometro", estado: "tenemos" },
      { id: "eq-3", familiaId: FAMILIA_DEMO, tipo: "termometro", estado: "tenemos" },
      { id: "eq-4", familiaId: FAMILIA_DEMO, tipo: "oximetro", estado: "necesitamos" },
      { id: "eq-5", familiaId: FAMILIA_DEMO, tipo: "andadera", estado: "necesitamos" },
    ],
    prestamos: [],
    videosGuia: {},
    evidencias: [
      {
        id: "ev-1", familiaId: FAMILIA_DEMO, tipo: "lectura", descripcion: "Glucómetro al recibirla: 118 mg/dL", foto: lecturaSvg("118", "mg/dL"), lecturaId: "l-3",
        porUsuarioId: "u-rosa", fechaHora: `${hoyISO}T07:11:00`, confirmadaPor: "u-jorge", confirmadaEn: `${hoyISO}T09:30:00`,
      },
      { id: "ev-2", familiaId: FAMILIA_DEMO, tipo: "lectura", descripcion: "Baumanómetro: 132/80", foto: lecturaSvg("132/80", "mmHg"), lecturaId: "l-2", porUsuarioId: "u-jorge", fechaHora: `${ayer}T19:06:00` },
      { id: "ev-3", familiaId: FAMILIA_DEMO, tipo: "receta", descripcion: "Receta de urgencias después de la caída", porUsuarioId: "u-rosa", fechaHora: `${hace3}T21:00:00`, confirmadaPor: "u-mariana", confirmadaEn: `${antier}T10:00:00` },
    ],
  };
}

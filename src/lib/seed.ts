import { UMBRALES_BASE } from "./catalogos";
import centros from "@/data/centros-cdmx.json";
import type { DB, Disponibilidad, Relevo, Usuario } from "./types";

// Caso de ejemplo: doña Doreen Newman, 82 años, en Iztapalapa. Su hija Sara es la cuidadora
// principal; su sobrina Karla y sus nietos Mariana y Diego se reparten relevos. La red suma a Lupe,
// la vecina de enfrente, y a Ofelia, cuidadora certificada a 10 minutos. Con el banco de tiempo,
// Sara acompañó un sábado a don Luis, el vecino de al lado, y esas horas regresan a ella.
// Las personas son ficticias. Solo los centros del mapa son datos reales (DENUE, INEGI).

export const DB_VERSION = 11;
export const CODIGO_DEMO = "123456"; // código de verificación simulado (recuperar contraseña)
export const CLAVE_DEMO = "respira2026"; // contraseña de las cuentas de ejemplo
export const FAMILIA_DEMO = "fam-newman";
export const CODIGO_FAMILIA_DEMO = "NEW482";
// Datos de ejemplo de versiones anteriores: se quitan al actualizar (se conserva lo que creó cada persona).
export const DEMO_ANTERIOR = {
  familias: ["fam-hernandez"],
  usuarios: ["u-rosa", "u-lucia", "u-lupita", "u-jorge", "u-ana", "u-beto", "u-chela", "u-teresa", "u-alberto", "u-guadalupe", "u-rocio", "u-martha", "u-irma"],
};
const CLAVE_DEMO_HASH = { salt: "respira-demo-sal", hash: "8449a85974e1c4116b89f5896c99a663d72a95b2a49525c65d7594d5dd8688f2" };

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
  const dia = (n: number) => fechaISO(masDias(hoy, n));

  const usuario = (u: Partial<Usuario> & Pick<Usuario, "id" | "nombre" | "telefono" | "genero" | "tono">): Usuario => ({
    alcaldia: "Iztapalapa",
    ubicacion: { lat: H.lat, lng: H.lng },
    bio: "",
    roles: [],
    experiencia: [],
    disponibilidad: {},
    ofreceAyuda: sinAyuda,
    saldoHoras: 0,
    creadoEn: creado,
    aceptoTerminos: creado,
    clave: CLAVE_DEMO_HASH,
    ...u,
  });

  // Relevos de 2 semanas atrás a 1 adelante: Sara carga la mayor parte.
  const relevos: Relevo[] = [];
  for (let i = -14; i <= 7; i++) {
    const ds = diaSemana(masDias(hoy, i));
    const f = dia(i);
    const manana = i > 0 && ds === 5 ? null : ds === 5 ? "u-karla" : ds === 6 ? "u-diego" : "u-sara"; // el próximo sábado queda sin cubrir
    const tarde = ds === 1 || ds === 3 ? "u-mariana" : ds === 6 ? "u-diego" : "u-sara";
    const ofelia = i === -9 || i === -2; // Ofelia (cuidadora certificada de la red) cubrió dos noches con pago
    const noche = i === 0 ? null : ofelia ? "u-ofelia" : ds === 0 || ds === 2 ? "u-karla" : "u-sara"; // hoy en la noche queda sin cubrir
    relevos.push(
      { id: `r-${f}-7`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 7, horas: 6, asignadoA: manana, origen: "familia" },
      { id: `r-${f}-13`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 13, horas: 6, asignadoA: tarde, origen: "familia" },
      { id: `r-${f}-19`, familiaId: FAMILIA_DEMO, fecha: f, inicio: 19, horas: 4, asignadoA: noche, origen: ofelia ? "red" : "familia" },
    );
  }
  const manana1 = relevos.find((r) => r.id === `r-${dia(1)}-13`);
  if (manana1) manana1.asignadoA = "u-mariana"; // intercambio aceptado ayer

  // Semana previa: tomas de medicamentos (una dosis omitida) y signos en sus horarios
  const tomasSemana: DB["tomas"] = [];
  const meds = [
    { id: "med-1", horarios: ["08:00", "20:00"] },
    { id: "med-2", horarios: ["08:00"] },
    { id: "med-3", horarios: ["08:00", "16:00"] },
  ];
  for (let i = -6; i <= -1; i++) {
    const f = dia(i);
    for (const m of meds) {
      if (m.id === "med-3" && i < -3) continue; // el analgésico empezó después de la caída
      for (const h of m.horarios) {
        const omitida = m.id === "med-1" && h === "20:00" && i === -4;
        tomasSemana.push({ id: `t-${f}-${m.id}-${h}`, medicamentoId: m.id, fecha: f, horario: h, estado: omitida ? "omitida" : "dada", porUsuarioId: h < "14:00" ? "u-sara" : "u-karla", registradaEn: `${f}T${h}:10` });
      }
    }
  }
  const lecturasSemana: DB["lecturas"] = [
    { id: "l-a", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-6)}T07:40:00`, porUsuarioId: "u-sara", fc: 74, fr: 16, paSist: 122, paDiast: 76, glucosa: 128, senales: [], origen: "formulario", nivel: "verde" },
    { id: "l-b", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-6)}T20:10:00`, porUsuarioId: "u-karla", fc: 76, fr: 17, paSist: 126, paDiast: 78, glucosa: 150, senales: [], origen: "nota de voz", nivel: "verde" },
    { id: "l-c", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-5)}T08:05:00`, porUsuarioId: "u-sara", fc: 72, fr: 16, paSist: 118, paDiast: 74, glucosa: 121, senales: [], origen: "formulario", nivel: "verde" },
    { id: "l-d", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-4)}T07:55:00`, porUsuarioId: "u-sara", fc: 75, fr: 17, paSist: 116, paDiast: 72, glucosa: 133, senales: [], origen: "formulario", nivel: "verde" },
    { id: "l-e", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-4)}T20:20:00`, porUsuarioId: "u-karla", fc: 78, fr: 18, paSist: 120, paDiast: 76, glucosa: 158, senales: [], origen: "nota de voz", nivel: "verde" },
  ];

  return {
    version: DB_VERSION,
    usuarios: [
      usuario({
        id: "u-sara", nombre: "Sara Newman", telefono: "5510000001", genero: "mujer", tono: "t1", saldoHoras: 4, bio: "Tengo 48 años. Cuido a mi mamá desde que se cayó; dejé mi trabajo y mis semanas cotizadas.",
        roles: ["Cuidar a mi familiar", "Coordinar a la familia", "Llevar a consultas"], experiencia: ["Tomar presión", "Medir glucosa"], disponibilidad: semana(7, 23),
      }),
      usuario({ id: "u-karla", nombre: "Karla Newman", telefono: "5510000002", genero: "mujer", tono: "t2", bio: "Sobrina de doña Doreen. Trabajo de día; cubro noches entre semana y los sábados en la mañana.", roles: ["Cuidar a mi familiar"], disponibilidad: { ...semana(19, 23, [0, 2]), 5: [{ inicio: 7, fin: 14 }] } }),
      usuario({ id: "u-diego", nombre: "Diego Ruiz Newman", telefono: "5510000003", genero: "hombre", tono: "t4", bio: "Nieto de doña Doreen. Estudio; vengo los domingos.", roles: ["Cuidar a mi familiar", "Hacer trámites"], disponibilidad: { 6: [{ inicio: 7, fin: 19 }] } }),
      usuario({ id: "u-mariana", nombre: "Mariana Ruiz Newman", telefono: "5510000004", genero: "mujer", tono: "t3", bio: "Nieta de doña Doreen, hija de Sara. Estudio enfermería en las mañanas.", roles: ["Cuidar a mi familiar", "Acompañamiento", "Llevar a consultas"], disponibilidad: { ...semana(13, 20, [1, 3]) } }),
      // Doreen tiene su propio acceso: su voz, sus decisiones y sus permisos
      usuario({ id: "u-doreen", nombre: "Doreen Newman", telefono: "5510000005", genero: "mujer", tono: "t5", bio: "Me dicen Dori. Tejo y me gustan los boleros.", roles: ["Acompañamiento"], disponibilidad: semana(10, 13, [1, 3]), saldoHoras: 5 }),
      // Red cercana: no están en el espacio familiar, pero pueden relevarlos
      usuario({
        id: "u-lupe", nombre: "Lupe Ramírez", telefono: "5510000007", genero: "mujer", tono: "t4", bio: "Vecina de enfrente. Cuido con horas del banco de tiempo.",
        roles: ["Hacer relevos en la red", "Acompañamiento"], experiencia: ["Preparar comidas"], equipo: ["oximetro"], disponibilidad: semana(17, 23),
        ubicacion: { lat: H.lat + 0.0012, lng: H.lng + 0.0006 }, ofreceAyuda: { activo: true, radioKm: 1, modalidades: ["intercambio de horas"], tarifaHora: 0 },
        verificado: { identidad: true, referencias: 1 }, saldoHoras: 2,
      }),
      usuario({
        id: "u-ofelia", nombre: "Ofelia Torres", telefono: "5510000006", genero: "mujer", tono: "t2", bio: "Cuidadora certificada (EC0669). Vivo a 10 minutos; cubro noches.",
        roles: ["Hacer relevos en la red", "Cuidado nocturno"], experiencia: ["Primeros auxilios"], disponibilidad: semana(18, 24),
        ubicacion: { lat: H.lat + 0.011, lng: H.lng + 0.012 }, ofreceAyuda: { activo: true, radioKm: 5, modalidades: ["pago", "intercambio de horas"], tarifaHora: 90 },
        seguridadSocial: { ruta: "independiente", desde: dia(-60), apartadoPct: 10 },
        verificado: { identidad: true, referencias: 2 },
      }),
      // Don Luis: vecino de al lado; Sara lo acompañó con el banco de tiempo
      usuario({ id: "u-luis", nombre: "Luis Pérez", telefono: "5510000008", genero: "hombre", tono: "t5", bio: "Don Luis, 82 años, vecino de al lado. Recibe compañía por el banco de tiempo.", roles: ["Acompañamiento"], ubicacion: { lat: H.lat + 0.0003, lng: H.lng - 0.0005 } }),
    ],
    familias: [
      {
        id: FAMILIA_DEMO, nombre: "Familia Newman", alcaldia: "Iztapalapa", hogar: { lat: H.lat, lng: H.lng, referencia: "Unidad Vicente Guerrero, Iztapalapa (punto de ejemplo)" },
        lineaBase: { fecha: dia(-21), pctPrincipal: 94, horasSemanaPrincipal: 98, zarit: 27, nota: "Antes de Respira, Sara cuidaba casi sola: el resto de la familia ayudaba cuando podía, sin turnos." },
        reparto: { "u-sara": 25, "u-karla": 25, "u-mariana": 25, "u-diego": 25 },
        aportaDeMas: { "u-sara": true },
        topeGastoMes: 5000,
        creadaPor: "u-sara", creadaEn: `${hace3}T18:00:00`, consentimiento: { registro: true, alertasWhatsApp: true, indicadores: true, fecha: `${hace3}T18:00:00` }, codigo: CODIGO_FAMILIA_DEMO,
      },
    ],
    membresias: [
      { id: "mb-sara", familiaId: FAMILIA_DEMO, usuarioId: "u-sara", rol: "coordinacion", parentesco: "Hija", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-karla", familiaId: FAMILIA_DEMO, usuarioId: "u-karla", rol: "cuidado", parentesco: "Sobrina", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-mariana", familiaId: FAMILIA_DEMO, usuarioId: "u-mariana", rol: "cuidado", parentesco: "Nieta", principal: true, estado: "activa", desde: hace3 },
      { id: "mb-diego", familiaId: FAMILIA_DEMO, usuarioId: "u-diego", rol: "apoyo", parentesco: "Nieto", principal: false, estado: "activa", desde: hace3 },
      { id: "mb-doreen", familiaId: FAMILIA_DEMO, usuarioId: "u-doreen", rol: "persona", parentesco: "Persona mayor", principal: false, estado: "activa", desde: hace3 },
    ],
    pacientes: [
      {
        id: "p-doreen", familiaId: FAMILIA_DEMO, nombre: "Doreen", edad: 82, sexo: "mujer", condiciones: ["hipertension", "diabetes", "caida"], alergias: ["Penicilina"],
        usuarioId: "u-doreen",
        horariosSignos: ["08:00", "20:00"],
        umbralesDelMedico: true,
        revisarEnMin: 15,
        voz: {
          palabras: {
            texto: "Me llamo Doreen, pero en la casa me dicen Dori. Me gusta mi café con canela y escuchar boleros en la mañana. Me tranquiliza que me hablen despacio. No quiero que me bañen con prisa ni que decidan por mí. Si me pasa algo, quiero ir a mi clínica de siempre y que me acompañe Mariana.",
            fecha: hace3, porUsuarioId: "u-doreen",
          },
          gustos: ["Café con canela", "Boleros en la mañana", "Que me digan Dori", "Tejer"],
          rutinas: ["Me despierto a las 6:30", "Desayuno a las 8:00", "Siesta después de comer", "Telenovela a las 19:00"],
          noQuiero: ["Que me bañen con prisa", "Que decidan por mí sin preguntarme", "Ir a un hospital privado lejos de casa"],
          permisos: { "u-sara": true, "u-karla": true, "u-mariana": true, "u-diego": true },
          consentimiento: { fecha: hace3, porUsuarioId: "u-doreen" },
          decisiones: {
            clinica: "Mi clínica de siempre: la Unidad de Medicina Familiar del IMSS que me corresponde", acompanante: "Mariana, mi nieta", voluntadAnticipada: true,
            notas: "Documento de voluntad anticipada (dato de ejemplo); la copia la tiene Sara.", fecha: hace3,
          },
          metas: [
            { id: "meta-1", texto: "Caminar diez minutos al día", hechas: [antier, ayer] },
            { id: "meta-2", texto: "Vestirme sola", hechas: [ayer] },
          ],
        },
        historia: {
          antecedentes: ["Hipertensión", "Diabetes", "Caída en los últimos 6 meses"], dispositivos: ["Lentes", "Bastón"],
          notas: "Se marea al levantarse rápido; su médico ajustó la dosis del medicamento para la presión el mes pasado.", actualizada: hace3, porUsuarioId: "u-sara",
        },
        servicios: {
          afiliacion: ["IMSS"], unidad: "Unidad de Medicina Familiar de su colonia", medico: "", ultimaConsulta: "1 a 3 meses", urgencias3m: true, citaPendiente: true, recetaVigente: true,
          medicamentosDe: "Una parte y otra", actualizada: hace3, porUsuarioId: "u-sara",
        },
        evento: { tipo: "caida", fecha: hace3, descripcion: "Se cayó en la cocina al levantarse; dijo que se mareó.", lesion: "Sin fractura según urgencias; moretón en la cadera." },
        movilidad: "con apoyo", signos: ["fc", "fr", "pa", "glucosa", "dolor", "conciencia"],
        // Umbrales que indicó su médico (ejemplo): presión sistólica mínima 100 por el mareo
        umbrales: { ...UMBRALES_BASE, fc: { min: 55, max: 110 }, fr: { min: 12, max: 22 }, paSist: { min: 100, max: 160 }, glucosa: { min: 80, max: 250 }, temperatura: { max: 37.8 } },
        notas: "Usa bastón desde la caída. Recámara en planta baja.",
      },
    ],
    medicamentos: [
      { id: "med-1", familiaId: FAMILIA_DEMO, nombre: "Metformina", dosis: "Según receta", horarios: ["08:00", "20:00"], indicaciones: "Con alimentos." },
      { id: "med-2", familiaId: FAMILIA_DEMO, nombre: "Medicamento para la presión", dosis: "Según receta", horarios: ["08:00"], indicaciones: "Levantarse despacio después de tomarlo." },
      { id: "med-3", familiaId: FAMILIA_DEMO, nombre: "Analgésico indicado en urgencias", dosis: "Según receta", horarios: ["08:00", "16:00"], indicaciones: "Solo los días que indicó el médico." },
    ],
    tomas: [
      ...tomasSemana,
      { id: "t-1", medicamentoId: "med-1", fecha: hoyISO, horario: "08:00", estado: "dada", porUsuarioId: "u-sara", registradaEn: `${hoyISO}T08:05:00` },
      { id: "t-2", medicamentoId: "med-2", fecha: hoyISO, horario: "08:00", estado: "dada", porUsuarioId: "u-sara", registradaEn: `${hoyISO}T08:05:00` },
      { id: "t-3", medicamentoId: "med-3", fecha: hoyISO, horario: "08:00", estado: "dada", porUsuarioId: "u-sara", registradaEn: `${hoyISO}T08:06:00` },
    ],
    lecturas: [
      ...lecturasSemana,
      { id: "l-0", familiaId: FAMILIA_DEMO, fechaHora: `${hace3}T19:20:00`, porUsuarioId: "u-karla", fc: 92, fr: 20, paSist: 104, paDiast: 66, glucosa: 188, dolor: 7, conciencia: "alerta", senales: ["caida", "mareo"], origen: "nota de voz", nivel: "amarillo" },
      { id: "l-1", familiaId: FAMILIA_DEMO, fechaHora: `${antier}T07:15:00`, porUsuarioId: "u-sara", fc: 76, fr: 17, paSist: 118, paDiast: 74, glucosa: 135, dolor: 5, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
      { id: "l-2", familiaId: FAMILIA_DEMO, fechaHora: `${ayer}T19:05:00`, porUsuarioId: "u-karla", fc: 80, fr: 18, paSist: 124, paDiast: 78, glucosa: 162, dolor: 4, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
      { id: "l-3", familiaId: FAMILIA_DEMO, fechaHora: `${hoyISO}T07:10:00`, porUsuarioId: "u-sara", fc: 74, fr: 16, paSist: 118, paDiast: 72, glucosa: 118, dolor: 3, conciencia: "alerta", senales: [], origen: "nota de voz", nivel: "verde" },
    ],
    relevos,
    // Sara pidió cambio de la tarde de mañana y Mariana lo aceptó ayer (notificación de relevo aceptado)
    intercambios: [
      { id: "i-0", familiaId: FAMILIA_DEMO, relevoId: `r-${dia(1)}-13`, deUsuarioId: "u-sara", aUsuarioId: "u-mariana", tipo: "horas", monto: 6, estado: "aceptado", creadoEn: `${ayer}T10:00:00`, respondidoEn: `${ayer}T18:20:00` },
    ],
    // Ofelia cubrió dos noches con pago: cuidadora certificada con ingreso y seguridad social
    solicitudes: [
      { id: "s-0", familiaId: FAMILIA_DEMO, relevoId: `r-${dia(-9)}-19`, usuarioId: "u-ofelia", pago: "pago", monto: 360, estado: "aceptada", creadaEn: `${dia(-10)}T12:00:00`, respondidaEn: `${dia(-10)}T12:30:00` },
      { id: "s-1", familiaId: FAMILIA_DEMO, relevoId: `r-${dia(-2)}-19`, usuarioId: "u-ofelia", pago: "pago", monto: 360, estado: "aceptada", creadaEn: `${dia(-3)}T09:00:00`, respondidaEn: `${dia(-3)}T09:20:00` },
    ],
    mensajes: [
      { id: "msg-1", familiaId: FAMILIA_DEMO, de: "asistente", tipo: "sistema", fechaHora: `${hace3}T18:01:00`, texto: "Se creó el espacio de cuidado de doña Doreen. Al recibirla en cada relevo, graben una nota de voz con su pulso, respiración, presión, glucosa, dolor y cómo está de alerta." },
      { id: "msg-2", familiaId: FAMILIA_DEMO, de: "u-mariana", tipo: "texto", fechaHora: `${hace3}T20:12:00`, texto: "Martes y jueves en la tarde me quedo con la abuela Dori." },
      { id: "msg-3", familiaId: FAMILIA_DEMO, de: "u-karla", tipo: "nota de voz", fechaHora: `${ayer}T19:05:00`, texto: "Recibo a mi tía. Pulso 80, respira 18 por minuto, presión 124 sobre 78, glucosa 162. Dolor 4 de 10, está platicando." },
      {
        id: "msg-4", familiaId: FAMILIA_DEMO, de: "asistente", tipo: "respuesta", nivel: "verde", fuente: "reglas", fechaHora: `${ayer}T19:05:30`,
        texto: "Todo en orden: los signos están dentro de los rangos que indicó su médico. Prevención: que se levante despacio y con apoyo.",
        hallazgos: [
          { etiqueta: "Frecuencia cardiaca", valor: "80 lpm", estado: "normal" },
          { etiqueta: "Frecuencia respiratoria", valor: "18 rpm", estado: "normal" },
          { etiqueta: "Presión arterial", valor: "124/78 mmHg", estado: "normal" },
          { etiqueta: "Glucosa", valor: "162 mg/dL", estado: "normal" },
        ],
      },
    ],
    notifVistas: {},
    alertas: [
      {
        id: "a-2", familiaId: FAMILIA_DEMO, fechaHora: `${ayer}T11:05:00`, nivel: "amarillo", titulo: "Doreen pide: necesito compañía", motivo: "Doreen pidió desde su cuenta: necesito compañía. Me siento sola en la mañana.",
        trifecta: false, estado: "atendida", atendidaEn: `${ayer}T11:19:00`, origen: "persona", porUsuarioId: "u-doreen",
        respuestas: [{ porUsuarioId: "u-mariana", texto: "Abuela, voy a las 12 y comemos juntas", fechaHora: `${ayer}T11:19:00` }],
      },
      {
        id: "a-0", familiaId: FAMILIA_DEMO, fechaHora: `${hace3}T19:20:00`, nivel: "amarillo", titulo: "Vuelve a revisar: dolor y mareo después de la caída", motivo: "Dolor de 7 de 10 y mareo; presión cerca del mínimo que indicó su médico.",
        trifecta: false, estado: "atendida", atendidaEn: `${hace3}T19:31:00`, origen: "reporte", porUsuarioId: "u-karla",
      },
      {
        id: "a-1", familiaId: FAMILIA_DEMO, fechaHora: `${dia(-12)}T06:40:00`, nivel: "rojo", titulo: "Alerta grave: glucosa muy baja", motivo: "Glucosa de 58 mg/dL con sudoración.",
        trifecta: false, estado: "atendida", atendidaEn: `${dia(-12)}T06:52:00`, origen: "reporte", porUsuarioId: "u-sara", centroElegido: "Su clínica de siempre",
      },
    ],
    progreso: [
      ...["signos-vitales", "glucosa", "movilizacion", "prevencion-caidas", "autonomia"].map((t, i) => ({ tutorialId: t, usuarioId: "u-sara", completado: true, fecha: i < 2 ? hace3 : antier, practicas: 6 - i })),
      { tutorialId: "signos-vitales", usuarioId: "u-karla", completado: true, fecha: antier, practicas: 2 },
      { tutorialId: "movilizacion", usuarioId: "u-mariana", completado: true, fecha: antier, practicas: 3 },
      ...["signos-vitales", "movilizacion", "prevencion-caidas", "autonomia", "autocuidado"].map((t) => ({ tutorialId: t, usuarioId: "u-ofelia", completado: true, fecha: creado.slice(0, 10), practicas: 20 })),
    ],
    certificaciones: [{ id: "ec0669", usuarioId: "u-ofelia", estado: "certificada", fecha: dia(-60) }],
    // Zarit de Sara en el mes 0 y el mes 3 del piloto
    zarit: [
      { id: "z-0", usuarioId: "u-sara", fecha: dia(-90), respuestas: [4, 4, 4, 4, 4, 3, 4], puntaje: 27 },
      { id: "z-1", usuarioId: "u-sara", fecha: hace3, respuestas: [3, 4, 3, 3, 3, 3, 3], puntaje: 22 },
      { id: "z-2", usuarioId: "u-karla", fecha: hace3, respuestas: [2, 2, 2, 2, 1, 1, 2], puntaje: 12 },
      { id: "z-3", usuarioId: "u-diego", fecha: hace3, respuestas: [2, 1, 2, 1, 1, 1, 2], puntaje: 10 },
      { id: "z-4", usuarioId: "u-mariana", fecha: antier, respuestas: [2, 2, 1, 2, 1, 1, 2], puntaje: 11 },
    ],
    sentires: [
      { id: "se-1", familiaId: FAMILIA_DEMO, fechaHora: `${ayer}T09:10:00`, dolor: 4, animo: "Regular", sueno: "Dormí mal", nota: "Me dolió la cadera en la noche.", porUsuarioId: "u-doreen" },
      { id: "se-2", familiaId: FAMILIA_DEMO, fechaHora: `${hoyISO}T08:30:00`, dolor: 3, animo: "Bien", sueno: "Regular", nota: "", porUsuarioId: "u-doreen" },
    ],
    aportes: [
      { id: "ap-1", familiaId: FAMILIA_DEMO, usuarioId: "u-doreen", actividad: "Llamada de compañía a otra persona mayor", horas: 1, fecha: antier },
      { id: "ap-2", familiaId: FAMILIA_DEMO, usuarioId: "u-doreen", actividad: "Enseñar una receta o un oficio", horas: 2, fecha: dia(-6) },
      { id: "ap-3", familiaId: FAMILIA_DEMO, usuarioId: "u-doreen", actividad: "Enseñar a tejer a las nietas de la red", horas: 2, fecha: dia(-9) },
    ],
    banco: [
      { id: "bt-1", deUsuarioId: "u-sara", paraUsuarioId: "u-luis", horas: 4, concepto: "Acompañó a don Luis a su consulta del sábado", fecha: dia(-((diaSemana(hoy) + 2) % 7 || 7)) },
      { id: "bt-2", deUsuarioId: "u-lupe", paraUsuarioId: "u-luis", horas: 2, concepto: "Le llevó la comida a don Luis", fecha: dia(-4) },
      { id: "bt-3", deUsuarioId: "u-doreen", paraUsuarioId: "u-luis", horas: 1, concepto: "Llamada de compañía a don Luis", fecha: antier },
    ],
    resenas: [
      { id: "rs-4", aUsuarioId: "u-lupe", deUsuarioId: "u-sara", familiaId: FAMILIA_DEMO, estrellas: 5, comentario: "Vecina de toda la vida; se queda con mi mamá cuando lo necesito.", fecha: dia(-5) },
      { id: "rs-1", aUsuarioId: "u-ofelia", deUsuarioId: "u-sara", familiaId: FAMILIA_DEMO, estrellas: 5, comentario: "Llegó puntual a cubrir la noche, registró sus signos y dejó todo anotado en el chat.", fecha: dia(-8) },
      { id: "rs-2", aUsuarioId: "u-ofelia", deUsuarioId: "u-karla", familiaId: FAMILIA_DEMO, estrellas: 5, comentario: "Muy paciente con mi tía; respetó lo que ella dejó dicho en Mi voz.", fecha: dia(-1) },
      { id: "rs-3", aUsuarioId: "u-ofelia", deUsuarioId: "u-mariana", familiaId: FAMILIA_DEMO, estrellas: 4, comentario: "Buen relevo. Avisó a tiempo cuando se le iba a hacer tarde.", fecha: dia(-1) },
    ],
    gastos: [
      { id: "g-1", familiaId: FAMILIA_DEMO, fecha: dia(-18), categoria: "Medicinas", concepto: "Metformina y medicamento para la presión", monto: 620, pagoPor: "u-sara", registradoPor: "u-sara" },
      { id: "g-2", familiaId: FAMILIA_DEMO, fecha: dia(-15), categoria: "Despensa", concepto: "Despensa de la quincena", monto: 1350, pagoPor: "u-sara", registradoPor: "u-sara" },
      { id: "g-3", familiaId: FAMILIA_DEMO, fecha: dia(-14), categoria: "Despensa", concepto: "Despensa (de su pensión)", monto: 900, pagoPor: "u-doreen", registradoPor: "u-sara" },
      { id: "g-4", familiaId: FAMILIA_DEMO, fecha: dia(-12), categoria: "Equipo e insumos", concepto: "Tiras reactivas para el glucómetro", monto: 480, pagoPor: "u-karla", registradoPor: "u-karla" },
      { id: "g-5", familiaId: FAMILIA_DEMO, fecha: dia(-9), categoria: "Relevos pagados", concepto: "Noche con Ofelia (cuidadora certificada)", monto: 360, pagoPor: "u-karla", registradoPor: "u-karla" },
      { id: "g-6", familiaId: FAMILIA_DEMO, fecha: dia(-8), categoria: "Consultas y estudios", concepto: "Estudios de laboratorio", monto: 650, pagoPor: "u-karla", registradoPor: "u-karla" },
      { id: "g-7", familiaId: FAMILIA_DEMO, fecha: hace3, categoria: "Transporte", concepto: "Taxi a urgencias después de la caída", monto: 260, pagoPor: "u-sara", registradoPor: "u-sara" },
      { id: "g-8", familiaId: FAMILIA_DEMO, fecha: hace3, categoria: "Medicinas", concepto: "Analgésico indicado en urgencias", monto: 180, pagoPor: "u-mariana", registradoPor: "u-mariana" },
      { id: "g-9", familiaId: FAMILIA_DEMO, fecha: antier, categoria: "Equipo e insumos", concepto: "Bastón", monto: 350, pagoPor: "u-diego", registradoPor: "u-diego" },
      { id: "g-10", familiaId: FAMILIA_DEMO, fecha: dia(-2), categoria: "Relevos pagados", concepto: "Noche con Ofelia (cuidadora certificada)", monto: 360, pagoPor: "u-sara", registradoPor: "u-sara" },
      { id: "g-11", familiaId: FAMILIA_DEMO, fecha: ayer, categoria: "Despensa", concepto: "Fruta y verdura", monto: 380, pagoPor: "u-diego", registradoPor: "u-diego" },
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
        porUsuarioId: "u-sara", fechaHora: `${hoyISO}T07:11:00`, confirmadaPor: "u-karla", confirmadaEn: `${hoyISO}T09:30:00`,
      },
      { id: "ev-2", familiaId: FAMILIA_DEMO, tipo: "lectura", descripcion: "Baumanómetro: 124/78", foto: lecturaSvg("124/78", "mmHg"), lecturaId: "l-2", porUsuarioId: "u-karla", fechaHora: `${ayer}T19:06:00` },
      { id: "ev-3", familiaId: FAMILIA_DEMO, tipo: "receta", descripcion: "Receta de urgencias después de la caída", porUsuarioId: "u-sara", fechaHora: `${hace3}T21:00:00`, confirmadaPor: "u-mariana", confirmadaEn: `${antier}T10:00:00` },
    ],
  };
}

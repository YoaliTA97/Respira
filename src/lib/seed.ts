import type { DemoState } from "./types";

// Datos sintéticos de la demo: Rosa (persona ficticia) cuida a su mamá Lucía.
// Ningún dato corresponde a una persona real.

export const CASO_ROSA = "caso-rosa";
export const STORAGE_KEY = "respira-demo-v1";
export const SEED_VERSION = 1;

export function createSeed(): DemoState {
  return {
    version: SEED_VERSION,
    casoId: CASO_ROSA,
    recipient: {
      nombre: "Lucía",
      relacion: "mamá",
      condiciones: ["Diabetes"],
      municipio: "Municipio piloto",
    },
    members: [
      { id: "m-rosa", nombre: "Rosa", relacion: "Coordina el cuidado", ayuda: "A diario", estado: "Tú", genero: "mujer", tono: "dark", horasBaseSemana: 31 },
      { id: "m-mariana", nombre: "Mariana", relacion: "Hija", ayuda: "Algunos días", estado: "Aceptó", genero: "mujer", tono: "light", horasBaseSemana: 4 },
      { id: "m-jorge", nombre: "Jorge", relacion: "Hermano", ayuda: "Algunos días", estado: "Invitado", genero: "hombre", tono: "mid", horasBaseSemana: 6 },
    ],
    consent: { registro: true, promotora: true, indicadores: true },
    events: [
      {
        id: "e-seed-1", casoId: CASO_ROSA, actorId: "m-mariana", actorNombre: "Mariana", tipo: "accion",
        categoria: "Comida", competencia: "alimentacion", detalle: "Cena y acompañamiento", hora: "Ayer 21:00",
        canal: "app", verificacion: "V0", senales: ["tranquila"], duracionMin: 45,
      },
      {
        id: "e-seed-2", casoId: CASO_ROSA, actorId: "m-jorge", actorNombre: "Jorge", tipo: "observacion",
        categoria: "Glucosa", detalle: "Anotó la glucosa de la noche", hora: "Ayer 22:10",
        canal: "app", evidencia: "foto", verificacion: "V1", senales: [], duracionMin: 5,
      },
      {
        id: "e-seed-3", casoId: CASO_ROSA, actorId: "m-rosa", actorNombre: "Rosa", tipo: "accion",
        categoria: "Medicamento", competencia: "medicamentos", detalle: "Le dio su medicamento de la mañana", hora: "Hoy 7:30",
        canal: "app", confirmadoPor: "Mariana", verificacion: "V2", senales: [], duracionMin: 10,
      },
    ],
    alerts: [
      {
        id: "a-seed-juana", casoId: "caso-juana", persona: "Juana", cuidaA: "su esposo", nivel: "rojo",
        resumen: "Caída, no puede levantarse solo", motivo: "Una caída en una persona mayor necesita revisión aunque parezca leve.",
        reglas: ["Caída reportada"], senalesIA: [], hora: "8:28", creadaMs: 0, estado: "pendiente",
        transcripcion: "Se cayó al salir del baño y no lo puedo levantar sola.",
      },
      {
        id: "a-seed-martha", casoId: "caso-martha", persona: "Martha", cuidaA: "su mamá", nivel: "amarillo",
        resumen: "Dolor de rodilla al caminar", motivo: "El dolor al caminar aumenta el riesgo de caídas; conviene vigilarlo.",
        reglas: ["Dolor reportado"], senalesIA: [], hora: "7:50", creadaMs: 0, estado: "pendiente",
      },
      {
        id: "a-seed-carmen", casoId: "caso-carmen", persona: "Carmen", cuidaA: "su papá", nivel: "verde",
        resumen: "Durmió bien y comió completo", motivo: "Sin señales de alarma.",
        reglas: [], senalesIA: [], hora: "7:10", creadaMs: 0, estado: "confirmada",
      },
    ],
    shifts: {
      Lun: { Mañana: "m-rosa", Tarde: "m-rosa", Noche: "m-rosa" },
      Mar: { Mañana: "m-rosa", Tarde: "m-mariana", Noche: "m-rosa" },
      Mié: { Mañana: "m-rosa", Tarde: "m-rosa", Noche: "m-jorge" },
      Jue: { Mañana: "m-rosa", Tarde: "m-mariana", Noche: "m-rosa" },
      Vie: { Mañana: "m-rosa", Tarde: "m-rosa", Noche: "m-jorge" },
      Sáb: { Mañana: null, Tarde: "m-rosa", Noche: "m-rosa" },
      Dom: { Mañana: "m-rosa", Tarde: "m-jorge", Noche: "m-rosa" },
    },
    helpers: [
      { id: "h-chela", nombre: "Chela R.", iniciales: "CR", descripcion: "Vecina", nivel: "C2", distanciaKm: 0.6, habilidades: ["Acompañamiento", "Alimentación"], disponible: true },
      { id: "h-lupita", nombre: "Lupita M.", iniciales: "LM", descripcion: "Cooperativa de cuidado", nivel: "C3", distanciaKm: 1.2, habilidades: ["Movilización", "Medicamentos"], disponible: true },
      { id: "h-teresa", nombre: "Teresa G.", iniciales: "TG", descripcion: "Cuidadora de la red", nivel: "C2", distanciaKm: 2.6, habilidades: ["Movilización", "Alimentación"], disponible: true },
      { id: "h-beto", nombre: "Alberto P.", iniciales: "AP", descripcion: "Cooperativa de cuidado", nivel: "C3", distanciaKm: 4.3, habilidades: ["Movilización", "Primeros auxilios"], disponible: true },
    ],
    relevos: [
      { id: "r-seed-martha", casoId: "caso-martha", familia: "Martha", dia: "Vie", slot: "Tarde", horario: "15:00 a 19:00", helperId: "h-teresa", helperNombre: "Teresa G.", pagador: "Empleador (ejemplo)", estado: "confirmado" },
      { id: "r-seed-juana", casoId: "caso-juana", familia: "Juana", dia: "Jue", slot: "Mañana", horario: "8:00 a 12:00", helperId: "h-lupita", helperNombre: "Lupita M.", pagador: "DIF municipal", estado: "terminado" },
    ],
    skills: [
      { id: "medicamentos", nombre: "Manejo de medicamentos", microcurso: true, practicasValidadas: 5, certificada: false },
      { id: "alimentacion", nombre: "Alimentación e hidratación", microcurso: true, practicasValidadas: 4, certificada: false },
      { id: "movilizacion", nombre: "Movilización segura", microcurso: true, practicasValidadas: 2, certificada: false },
      { id: "primeros_auxilios", nombre: "Primeros auxilios", microcurso: true, practicasValidadas: 0, certificada: false },
    ],
    chat: [
      { id: "c-0", de: "bot", tipo: "texto", texto: "Buenos días, Rosa. ¿Cómo amaneció tu mamá? Mándame un audio cuando puedas.", hora: "8:30" },
    ],
    chatFase: "inicio",
    ofrecerAcompanamiento: false,
    bolsa: { pagador: "DIF municipal", totalHoras: 400, usadasHoras: 96 },
    base: { horasRegistradas: 403, horasVerificadas: 286, respiroHoras: 12, microcursos: 5 },
    techMode: false,
  };
}

export const SKILL_C2_PRACTICAS = 3;

// Directorio de ejemplo. En el MVP sale de DENUE sector 62 y CLUES (sustituto de SIDECU).
export const DIRECTORIO = [
  { id: "d-1", nombre: "Centro de Salud comunitario", fuente: "CLUES", distancia: "1.1 km", horario: "abre hasta las 20:00" },
  { id: "d-2", nombre: "Unidad de Medicina Familiar", fuente: "CLUES · IMSS", distancia: "2.4 km", horario: "abre las 24 horas" },
  { id: "d-3", nombre: "Consultorio médico de la colonia", fuente: "DENUE 621", distancia: "0.8 km", horario: "abre hasta las 18:00" },
];

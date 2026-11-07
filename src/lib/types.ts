// Modelo de dominio de Respira.
// Usuario = perfil individual (como una cuenta de Notion): habilidades, roles, disponibilidad
// y si ofrece ayuda en la red. Familia = espacio de trabajo privado al que se entra por
// invitación (Membresia). La red de cuidado conecta perfiles que se ofrecen a otras familias.
// En el MVP cada colección es una tabla de PostgreSQL (Supabase) con políticas por membresía.

export type Id = string;
export type Tono = "t1" | "t2" | "t3" | "t4" | "t5";

export type Rango = { inicio: number; fin: number }; // horas 0-24
export type Disponibilidad = Record<number, Rango[]>; // 0 = lunes

// Roles e intereses: sugerencias del catálogo o lo que la persona escriba.
export type RolInteres = string;

export type Usuario = {
  id: Id;
  nombre: string;
  telefono: string;
  genero: "mujer" | "hombre" | "otro";
  alcaldia: string;
  ubicacion: { lat: number; lng: number }; // aproximada, para la búsqueda por radio
  bio: string;
  tono: Tono;
  roles: RolInteres[];
  experiencia?: string[]; // habilidades que la persona declara (sin verificar); las verificadas salen de la capacitación
  disponibilidad: Disponibilidad;
  ofreceAyuda: { activo: boolean; radioKm: number; modalidades: ("intercambio de horas" | "pago" | "programa de apoyo")[]; tarifaHora: number };
  saldoHoras: number; // banco de horas: + horas que le deben
  creadoEn: string;
};

export type RolFamilia = "coordinacion" | "cuidado" | "apoyo" | "avisos";

export const ROL_TEXTO: Record<RolFamilia, { t: string; d: string }> = {
  coordinacion: { t: "Coordinación", d: "Administra el espacio, invita integrantes y asigna relevos" },
  cuidado: { t: "Cuidado", d: "Cubre relevos, registra signos y medicación" },
  apoyo: { t: "Apoyo", d: "Cubre relevos ocasionales e intercambios" },
  avisos: { t: "Solo avisos", d: "Recibe alertas y ve el estado, sin registrar" },
};

export type Familia = {
  id: Id;
  nombre: string;
  alcaldia: string;
  hogar: { lat: number; lng: number; referencia: string };
  creadaPor: Id;
  creadaEn: string;
  consentimiento: { registro: boolean; alertasWhatsApp: boolean; indicadores: boolean; fecha: string };
};

export type Membresia = {
  id: Id;
  familiaId: Id;
  usuarioId: Id;
  rol: RolFamilia;
  parentesco: string;
  principal: boolean; // recibe alertas médicas por WhatsApp
  estado: "activa" | "invitada";
  desde: string;
};

// Condiciones con protocolo en Respira (signos, reglas, tutoriales y prevención).
export type CondicionId = "diabetes" | "caida" | "hipertension" | "demencia" | "movilidad";
export type SignoId = "fc" | "fr" | "pa" | "glucosa" | "temperatura" | "spo2" | "dolor" | "conciencia";

export type Umbrales = {
  fc: { min: number; max: number };
  fr: { min: number; max: number };
  paSist: { min: number; max: number };
  glucosa: { min: number; max: number };
  temperatura: { max: number };
};

export type Paciente = {
  id: Id;
  familiaId: Id;
  nombre: string;
  edad: number;
  sexo: "mujer" | "hombre";
  condiciones: string[]; // id del catálogo (CondicionId) o el nombre que da de alta la familia
  alergias?: string[];
  evento: { tipo: "caida"; fecha: string; descripcion: string; lesion: string } | null;
  movilidad: "independiente" | "con apoyo" | "en cama";
  signos: SignoId[];
  umbrales: Umbrales;
  notas: string;
};

export type Medicamento = { id: Id; familiaId: Id; nombre: string; dosis: string; horarios: string[]; indicaciones: string };

export type Toma = { id: Id; medicamentoId: Id; fecha: string; horario: string; estado: "dada" | "omitida"; porUsuarioId: Id; registradaEn: string };

export type Nivel = "verde" | "amarillo" | "rojo";

export type LecturaSignos = {
  id: Id;
  familiaId: Id;
  fechaHora: string;
  porUsuarioId: Id;
  fc?: number;
  fr?: number;
  paSist?: number;
  paDiast?: number;
  glucosa?: number;
  temperatura?: number;
  spo2?: number;
  dolor?: number;
  conciencia?: "alerta" | "confundida" | "no responde";
  senales: string[];
  origen: "nota de voz" | "formulario";
  nivel: Nivel;
};

export type Relevo = {
  id: Id;
  familiaId: Id;
  fecha: string; // YYYY-MM-DD
  inicio: number;
  horas: number; // 4, 6, 8 o personalizado
  asignadoA: Id | null; // usuario
  origen: "familia" | "red";
  recibidoEn?: string;
};

export type Intercambio = {
  id: Id;
  familiaId: Id;
  relevoId: Id;
  deUsuarioId: Id;
  aUsuarioId: Id;
  tipo: "horas" | "monetario";
  monto: number;
  estado: "pendiente" | "aceptado" | "rechazado";
  creadoEn: string;
};

export type SolicitudRed = {
  id: Id;
  familiaId: Id;
  relevoId: Id;
  usuarioId: Id; // perfil de la red que recibe la solicitud
  pago: "intercambio de horas" | "pago" | "programa de apoyo";
  monto: number;
  estado: "enviada" | "aceptada" | "rechazada";
  creadaEn: string;
};

export type Mensaje = {
  id: Id;
  familiaId: Id;
  de: Id | "asistente";
  texto: string;
  fechaHora: string;
  tipo: "texto" | "nota de voz" | "respuesta" | "sistema";
  nivel?: Nivel;
  hallazgos?: { etiqueta: string; valor: string; estado: "normal" | "fuera de rango" }[];
  acciones?: ("911" | "centros" | "relevo" | "tutorial")[];
  tutorialId?: string;
  audioUrl?: string;
  fuente?: "reglas" | "reglas + Claude";
};

export type Alerta = {
  id: Id;
  familiaId: Id;
  fechaHora: string;
  nivel: Nivel;
  titulo: string;
  motivo: string;
  trifecta: boolean;
  estado: "activa" | "atendida";
  centroElegido?: string;
  whatsapp?: { enviadoA: string[]; modo: "real" | "simulado"; texto: string };
};

export type ProgresoTutorial = { tutorialId: string; usuarioId: Id; completado: boolean; fecha: string; practicas: number };

export type Certificacion = { id: string; usuarioId: Id; estado: "agendada" | "certificada"; cita?: string; fecha?: string };

export type DB = {
  version: number;
  usuarios: Usuario[];
  familias: Familia[];
  membresias: Membresia[];
  pacientes: Paciente[];
  medicamentos: Medicamento[];
  tomas: Toma[];
  lecturas: LecturaSignos[];
  relevos: Relevo[];
  intercambios: Intercambio[];
  solicitudes: SolicitudRed[];
  mensajes: Mensaje[];
  alertas: Alerta[];
  progreso: ProgresoTutorial[];
  certificaciones: Certificacion[];
};

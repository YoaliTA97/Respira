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
  equipo?: string[]; // equipo médico que puede prestar a otras familias (id de EQUIPOS)
  fuente?: "respira" | "sidecu"; // sidecu = persona identificada por convenio con SIDECU
  disponibilidad: Disponibilidad;
  ofreceAyuda: { activo: boolean; radioKm: number; modalidades: ("intercambio de horas" | "pago" | "programa de apoyo")[]; tarifaHora: number };
  saldoHoras: number; // banco de horas: + horas que le deben
  aceptoTerminos?: string; // fecha en que aceptó el uso de datos y los avisos de Respira
  clave?: { salt: string; hash: string }; // contraseña (PBKDF2); en el MVP la maneja Supabase Auth
  seguridadSocial?: { ruta: "independiente" | "cooperativa" | "plataforma"; desde: string; apartadoPct: number };
  verificado?: { identidad: boolean; referencias: number }; // respaldo para dejarle el cuidado
  creadoEn: string;
};

// "persona" = la persona mayor con acceso propio (su voz, sus decisiones y permisos).
export type RolFamilia = "coordinacion" | "cuidado" | "apoyo" | "avisos" | "persona";

export const ROL_TEXTO: Record<RolFamilia, { t: string; d: string }> = {
  coordinacion: { t: "Coordinación", d: "Administra el espacio, invita integrantes y asigna relevos" },
  cuidado: { t: "Cuidado", d: "Cubre relevos, registra signos y medicación" },
  apoyo: { t: "Apoyo", d: "Cubre relevos ocasionales e intercambios" },
  avisos: { t: "Solo avisos", d: "Recibe alertas y ve el estado, sin registrar" },
  persona: { t: "Persona mayor", d: "Su voz: rutinas, decisiones de salud y permisos sobre sus datos" },
};

export type Familia = {
  id: Id;
  nombre: string;
  alcaldia: string;
  hogar: { lat: number; lng: number; referencia: string };
  creadaPor: Id;
  creadaEn: string;
  consentimiento: { registro: boolean; alertasWhatsApp: boolean; indicadores: boolean; fecha: string };
  codigo?: string; // código de unión: va en el QR para entrar al espacio
  // Antes de Respira: cómo se repartía el cuidado (para mostrar la transición de roles)
  lineaBase?: { fecha: string; pctPrincipal: number; horasSemanaPrincipal: number; zarit: number; nota: string };
  reparto?: Record<Id, number>; // cómo se reparten los gastos (porcentaje por integrante)
  aportaDeMas?: Record<Id, boolean>; // lo que esta persona pone de más es aportación voluntaria (no se le reembolsa)
  topeGastoMes?: number; // arriba de este monto, la familia necesita apoyo financiero
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
  historia?: HistoriaClinica;
  servicios?: ServiciosSalud;
  usuarioId?: Id; // su propio perfil, si tiene acceso
  horariosSignos?: string[]; // horarios de toma de signos vitales (recordatorios)
  umbralesDelMedico?: boolean; // si no, solo aplican las banderas rojas generales
  revisarEnMin?: number; // "vuelve a revisar": minutos para volver a medir (lo indica el médico)
  voz?: VozPersona;
  evento: { tipo: "caida"; fecha: string; descripcion: string; lesion: string } | null;
  movilidad: "independiente" | "con apoyo" | "en cama";
  signos: SignoId[];
  umbrales: Umbrales;
  notas: string;
};

// Historia clínica y uso de servicios de salud: se registran en la valoración en checklist.
export type HistoriaClinica = {
  antecedentes: string[];
  dispositivos: string[];
  notas: string;
  actualizada: string;
  porUsuarioId: Id;
};

export type ServiciosSalud = {
  afiliacion: string[];
  unidad: string;
  medico: string;
  ultimaConsulta: string;
  urgencias3m: boolean | null;
  citaPendiente: boolean | null;
  recetaVigente: boolean | null;
  medicamentosDe: string;
  actualizada: string;
  porUsuarioId: Id;
};

// "Mi voz": la persona mayor como agente activo.
export type VozPersona = {
  palabras?: { texto: string; audio?: string; fecha: string; porUsuarioId: Id };
  gustos: string[];
  rutinas: string[];
  noQuiero: string[];
  permisos: Record<Id, boolean>; // quién puede ver su historial; sin registro = sí
  decisiones?: { clinica: string; acompanante: string; voluntadAnticipada: boolean; documento?: string; notas: string; fecha: string };
  metas: { id: Id; texto: string; hechas: string[] }[];
  consentimiento?: { fecha: string; porUsuarioId: Id }; // la persona acepta el uso de sus datos para su cuidado
};

// "¿Cómo me siento hoy?": lo reporta la propia persona mayor.
export type Sentir = { id: Id; familiaId: Id; fechaHora: string; dolor: number; animo: string; sueno: string; nota: string; porUsuarioId: Id };

// "Lo que yo aporto": horas de la persona mayor que cuentan en el banco de tiempo.
export type Aporte = { id: Id; familiaId: Id; usuarioId: Id; actividad: string; horas: number; fecha: string };

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
  sintomas?: string[]; // síntomas del checklist que no son señales de alarma
  origen: "nota de voz" | "formulario" | "valoración";
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
  respondidoEn?: string;
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
  respondidaEn?: string;
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
  atendidaEn?: string; // primera respuesta o atención: mide si se atendió a tiempo
  respuestas?: { porUsuarioId: Id; texto: string; fechaHora: string }[];
  origen?: "reporte" | "panico" | "persona"; // persona = lo pidió la propia persona mayor
  porUsuarioId?: Id;
  whatsapp?: { enviadoA: string[]; modo: "real" | "simulado"; texto: string };
};

// Equipo médico de la familia: lo que tienen, lo que les falta y de dónde viene.
export type Equipo = {
  id: Id;
  familiaId: Id;
  tipo: string; // id de EQUIPOS
  estado: "tenemos" | "necesitamos" | "prestado" | "rentado";
  de?: string; // quién lo prestó o qué aliado lo renta
  desde?: string;
};

export type Prestamo = {
  id: Id;
  familiaId: Id;
  tipo: string;
  aUsuarioId: Id; // quien presta
  deUsuarioId: Id; // quien lo pide
  estado: "enviada" | "aceptada" | "rechazada";
  creadaEn: string;
};

// Evidencia de seguimiento: respalda lo que se registra (foto de la lectura, de la herida, de la
// receta o de la toma) y otra persona de la familia puede confirmarla. Sirve para la trayectoria
// y la certificación de quien cuida.
export type Evidencia = {
  id: Id;
  familiaId: Id;
  tipo: "lectura" | "herida" | "medicamento" | "receta" | "relevo" | "otro";
  descripcion: string;
  foto?: string; // imagen reducida (data URL); en el MVP va a almacenamiento de Supabase
  lecturaId?: Id;
  porUsuarioId: Id;
  fechaHora: string;
  confirmadaPor?: Id;
  confirmadaEn?: string;
};

// Escala de sobrecarga de Zarit (versión abreviada de 7 preguntas) que responde quien cuida.
export type Zarit = { id: Id; usuarioId: Id; fecha: string; respuestas: number[]; puntaje: number };

// Gastos del cuidado: medicinas, despensa, consultas, transporte... y quién paga.
export type Gasto = {
  id: Id;
  familiaId: Id;
  fecha: string;
  categoria: string;
  concepto: string;
  monto: number;
  pagoPor: Id;
  registradoPor: Id;
  comprobante?: string;
};

// Reseña de una familia a quien cubrió un relevo: respalda a quién se le deja el cuidado.
export type Resena = { id: Id; aUsuarioId: Id; deUsuarioId: Id; familiaId: Id; estrellas: number; comentario: string; fecha: string };

// Banco de tiempo: horas de cuidado que alguien da a otra persona de la red (sin dinero).
export type MovimientoTiempo = { id: Id; deUsuarioId: Id; paraUsuarioId: Id; horas: number; concepto: string; fecha: string };

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
  equipos: Equipo[];
  prestamos: Prestamo[];
  videosGuia: Record<string, string>;
  evidencias: Evidencia[];
  zarit: Zarit[];
  sentires: Sentir[];
  notifVistas: Record<Id, string[]>; // notificaciones que cada persona ya vio
  aportes: Aporte[];
  gastos: Gasto[];
  resenas: Resena[];
  banco: MovimientoTiempo[]; // id de guía médica → enlace del video
};

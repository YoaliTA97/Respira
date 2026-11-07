// Modelo de datos de la demo. Es un subconjunto del modelo de la arquitectura
// (CareCase, CareTeamMember, CareEvent, Alert, Shift, Credential...).

export type Tone = "dark" | "mid" | "light";

export type Member = {
  id: string;
  nombre: string;
  relacion: string;
  ayuda: "A diario" | "Algunos días" | "Solo avisos";
  estado: "Tú" | "Aceptó" | "Invitado";
  genero: "mujer" | "hombre";
  tono: Tone;
  horasBaseSemana: number;
};

export type Recipient = {
  nombre: string;
  relacion: string;
  condiciones: string[];
  municipio: string;
};

export type Consent = {
  registro: boolean;
  promotora: boolean;
  indicadores: boolean;
};

// Niveles de verificación de un evento (sección "Tracking de acciones")
// V0 autorreportado · V1 con evidencia · V2 confirmado por otra persona · V3 validado por promotora
export type Verificacion = "V0" | "V1" | "V2" | "V3";

export type Senal = "confusion" | "poca_agua" | "caida" | "dolor" | "tranquila" | "cansada";

export type CareEvent = {
  id: string;
  casoId: string;
  actorId: string;
  actorNombre: string;
  tipo: "observacion" | "accion";
  categoria: string;
  competencia?: SkillId;
  detalle: string;
  hora: string;
  canal: "app" | "whatsapp";
  evidencia?: "foto" | "audio";
  confirmadoPor?: string;
  verificacion: Verificacion;
  senales: Senal[];
  duracionMin: number;
  transcripcion?: string;
};

export type Nivel = "rojo" | "amarillo" | "verde";

export type Alert = {
  id: string;
  casoId: string;
  persona: string;
  cuidaA: string;
  eventoId?: string;
  nivel: Nivel;
  resumen: string;
  motivo: string;
  reglas: string[];
  senalesIA: string[];
  transcripcion?: string;
  hora: string;
  creadaMs: number;
  estado: "pendiente" | "confirmada" | "reclasificada";
  revisadaMs?: number;
  destino?: string;
};

export type Day = "Lun" | "Mar" | "Mié" | "Jue" | "Vie" | "Sáb" | "Dom";
export type Slot = "Mañana" | "Tarde" | "Noche";
export type ShiftGrid = Record<Day, Record<Slot, string | null>>;

export type Helper = {
  id: string;
  nombre: string;
  iniciales: string;
  descripcion: string;
  nivel: "C2" | "C3";
  distanciaKm: number;
  habilidades: string[];
  disponible: boolean;
};

export type Relevo = {
  id: string;
  casoId: string;
  familia: string;
  dia: Day;
  slot: Slot;
  horario: string;
  helperId?: string;
  helperNombre?: string;
  pagador: string;
  estado: "solicitado" | "confirmado" | "terminado";
};

export type SkillId = "medicamentos" | "alimentacion" | "movilizacion" | "primeros_auxilios";

export type Skill = {
  id: SkillId;
  nombre: string;
  microcurso: boolean;
  practicasValidadas: number;
  certificada: boolean;
};

export type ChatMsg = {
  id: string;
  de: "bot" | "yo";
  tipo: "texto" | "audio" | "resumen" | "semaforo";
  texto?: string;
  hora: string;
  opciones?: string[];
  alertaId?: string;
};

export type Toast = { id: number; texto: string } | null;

export type DemoState = {
  version: number;
  casoId: string;
  recipient: Recipient;
  members: Member[];
  consent: Consent;
  events: CareEvent[];
  alerts: Alert[];
  shifts: ShiftGrid;
  helpers: Helper[];
  relevos: Relevo[];
  skills: Skill[];
  chat: ChatMsg[];
  chatFase: "inicio" | "audio" | "confirmado";
  ofrecerAcompanamiento: boolean;
  bolsa: { pagador: string; totalHoras: number; usadasHoras: number };
  base: { horasRegistradas: number; horasVerificadas: number; respiroHoras: number; microcursos: number };
  techMode: boolean;
};

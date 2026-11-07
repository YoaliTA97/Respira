// Mapa técnico: qué respalda cada parte de la plataforma.
// "ahora" = cómo opera en esta versión; "mvp" = cómo queda en el MVP con backend.
// Es la fuente de la capa técnica y de la página /tecnico.

export type EstadoAhora = "Operando" | "Operando si se configura" | "Simulado";

export type TechItem = {
  titulo: string;
  seccion: string;
  modulos: string;
  datos: string;
  servicio: string;
  integracion: string;
  ahora: EstadoAhora;
  detalleAhora: string;
};

export const TECH = {
  acceso: {
    titulo: "Inicio de sesión", seccion: "Acceso", modulos: "M1 Red del caso", datos: "Usuario, sesión",
    servicio: "Supabase Auth con código por SMS o WhatsApp", integracion: "Twilio Verify o proveedor OTP",
    ahora: "Simulado", detalleAhora: "Código fijo de prueba; la sesión es por pestaña.",
  },
  perfil: {
    titulo: "Perfil individual", seccion: "Personal", modulos: "M1 Identidad · M10 Certificación", datos: "Usuario: roles, disponibilidad, habilidades, oferta de ayuda",
    servicio: "GET/PATCH /perfil", integracion: "Supabase Auth",
    ahora: "Operando", detalleAhora: "Un perfil por persona; las habilidades salen de sus tutoriales y certificaciones.",
  },
  membresias: {
    titulo: "Espacio familiar privado y roles", seccion: "Espacio familiar", modulos: "M1 Red del caso", datos: "Familia, Membresia (rol, principal, estado)",
    servicio: "Políticas RLS por membresía en Supabase", integracion: "Invitación por WhatsApp",
    ahora: "Operando", detalleAhora: "Solo los integrantes activos ven el espacio; las invitaciones se aceptan desde el inicio de quien es invitado.",
  },
  "red-perfiles": {
    titulo: "Red de cuidado entre familias", seccion: "Personal", modulos: "M5 Relevos · M11 Directorio", datos: "Usuario.ofreceAyuda, SolicitudRed",
    servicio: "GET /red?radio= (PostGIS) · POST /solicitudes", integracion: "Mapa con OpenStreetMap",
    ahora: "Operando", detalleAhora: "Perfiles que se ofrecen reciben solicitudes y las aceptan desde su cuenta; sin acceso al espacio de la familia.",
  },
  "registro-familia": {
    titulo: "Alta de la familia y la persona cuidada", seccion: "Acceso", modulos: "M1 Red del caso · M2 Expediente", datos: "Familia, Miembro, Paciente, Consentimiento",
    servicio: "POST /familias (transacción)", integracion: "Supabase (PostgreSQL)",
    ahora: "Operando", detalleAhora: "Crea familia, paciente, integrantes, medicación y plan de relevos; guardado en el navegador.",
  },
  "perfil-paciente": {
    titulo: "Perfil y signos según la condición", seccion: "Paciente", modulos: "M2 Expediente", datos: "Paciente, condiciones, signos a vigilar",
    servicio: "Plantillas por condición", integracion: "—",
    ahora: "Operando", detalleAhora: "Cambiar condiciones cambia lo que se pide en cada nota de voz.",
  },
  umbrales: {
    titulo: "Umbrales por paciente", seccion: "Paciente", modulos: "M2 Expediente · M6 Alertas", datos: "Paciente.umbrales",
    servicio: "Motor de reglas", integracion: "Validación médica pendiente",
    ahora: "Operando", detalleAhora: "Valores de ejemplo editables; requieren validación médica.",
  },
  "mapa-nodos": {
    titulo: "Mapa de nodos de la familia", seccion: "Red de cuidado", modulos: "M1 Red del caso", datos: "Miembro, Externo",
    servicio: "GET /familias/{id}/red", integracion: "—",
    ahora: "Operando", detalleAhora: "Muestra la red real de la familia y quién está de turno.",
  },
  disponibilidad: {
    titulo: "Disponibilidad por días y horas", seccion: "Red de cuidado", modulos: "M5 Turnos y relevos", datos: "Miembro.disponibilidad",
    servicio: "PUT /miembros/{id}/disponibilidad", integracion: "—",
    ahora: "Operando", detalleAhora: "Se usa para sugerir quién puede cubrir cada relevo.",
  },
  relevos: {
    titulo: "Relevos de 4, 6, 8 horas o personalizados", seccion: "Relevos", modulos: "M5 Turnos y relevos", datos: "Relevo",
    servicio: "POST/PATCH /relevos", integracion: "Recordatorios por WhatsApp",
    ahora: "Operando", detalleAhora: "Crear, asignar y ver cobertura; los recordatorios aún no se envían.",
  },
  intercambio: {
    titulo: "Intercambio de horas o dinero", seccion: "Relevos", modulos: "M5 · M14 Financiamiento", datos: "Intercambio, banco de horas",
    servicio: "POST /intercambios · PATCH aceptar", integracion: "Pagos (SPEI o tarjeta) en fase posterior",
    ahora: "Operando", detalleAhora: "Propuesta y aceptación entre integrantes con saldo de horas; el pago monetario se registra, no se cobra.",
  },
  "red-externa": {
    titulo: "Relevo externo por radio", seccion: "Relevos", modulos: "M5 · M11 Directorio", datos: "Externo, SolicitudExterna",
    servicio: "GET /externos?radio= (PostGIS ST_DWithin)", integracion: "Mapa con OpenStreetMap",
    ahora: "Operando", detalleAhora: "Distancia y disponibilidad calculadas sobre perfiles de ejemplo; la persona acepta desde su cuenta (entra como Lupita, Chela o Teresa).",
  },
  chat: {
    titulo: "Chat de la red", seccion: "Red de cuidado", modulos: "M7 Comunicación", datos: "Mensaje",
    servicio: "Supabase Realtime", integracion: "WhatsApp como canal de entrada y salida",
    ahora: "Operando", detalleAhora: "Compartido entre pestañas del mismo navegador; entre teléfonos requiere el backend.",
  },
  "nota-voz": {
    titulo: "Nota de voz al recibir a la persona", seccion: "Red de cuidado", modulos: "M7 Agentes", datos: "Audio, transcripción",
    servicio: "Grabación en el navegador + dictado", integracion: "Web Speech API (Chrome); faster-whisper en el MVP",
    ahora: "Operando", detalleAhora: "Graba audio real y transcribe con el dictado del navegador si está disponible.",
  },
  asistente: {
    titulo: "Asistente de cuidado", seccion: "Red de cuidado", modulos: "M7 Agentes", datos: "Lectura de signos, Mensaje",
    servicio: "POST /api/asistente (reglas + IA)", integracion: "Claude (claude-opus-5-5) con salida estructurada",
    ahora: "Operando si se configura", detalleAhora: "Las reglas siempre operan; Claude se activa con ANTHROPIC_API_KEY.",
  },
  trifecta: {
    titulo: "Trifecta de alerta", seccion: "Comunicación", modulos: "M6 Alertas", datos: "FC, FR, presión arterial",
    servicio: "Reglas deterministas antes de cualquier IA", integracion: "—",
    ahora: "Operando", detalleAhora: "Si los tres signos salen de rango, se genera alerta roja y se avisa por WhatsApp.",
  },
  "whatsapp-alerta": {
    titulo: "Alerta por WhatsApp a familiares principales", seccion: "Comunicación", modulos: "M6 Alertas", datos: "Alerta, destinatarios",
    servicio: "POST /api/whatsapp", integracion: "API de Twilio (sandbox o número aprobado)",
    ahora: "Operando si se configura", detalleAhora: "Envío real con TWILIO_*; sin configurar queda registrado como simulado.",
  },
  centros: {
    titulo: "Mapa de centros de cuidado cercanos", seccion: "Comunicación", modulos: "M11 Directorio", datos: "Centros (DENUE sector 62)",
    servicio: "Página pública /centros enlazada desde la alerta", integracion: "INEGI DENUE; SIDECU por integrar",
    ahora: "Operando", detalleAhora: "Datos reales del DENUE en Coyoacán; SIDECU pendiente de definir.",
  },
  medicacion: {
    titulo: "Medicación y tomas", seccion: "Paciente", modulos: "M3 Plan de cuidado", datos: "Medicamento, Toma",
    servicio: "GET /tomas/hoy · POST /tomas", integracion: "Recordatorios por WhatsApp",
    ahora: "Operando", detalleAhora: "Registro de tomas por integrante; recordatorios pendientes.",
  },
  historial: {
    titulo: "Historial de signos", seccion: "Paciente", modulos: "M2 Expediente", datos: "LecturaSignos",
    servicio: "GET /lecturas", integracion: "FHIR Observation en fase posterior",
    ahora: "Operando", detalleAhora: "Cada nota de voz o formulario agrega una lectura con su nivel.",
  },
  tutoriales: {
    titulo: "Videotutoriales certificados", seccion: "Capacitación", modulos: "M9 Formación", datos: "Tutorial, Progreso",
    servicio: "Catálogo por necesidades del paciente", integracion: "Cruz Roja, UNAM, UAM (convenios por confirmar)",
    ahora: "Simulado", detalleAhora: "Pasos y evaluación funcionan; los videos están por producir con la institución.",
  },
  certificaciones: {
    titulo: "Desbloqueo de certificaciones", seccion: "Capacitación", modulos: "M10 Certificación", datos: "Certificación, horas, habilidades",
    servicio: "Reglas de desbloqueo + agenda presencial", integracion: "Institución certificadora; Open Badges",
    ahora: "Simulado", detalleAhora: "El desbloqueo es real; la aprobación de la institución se simula.",
  },
  trayectoria: {
    titulo: "Trayectoria: horas y salida laboral", seccion: "Capacitación", modulos: "M10 · M14", datos: "Horas cubiertas, certificaciones",
    servicio: "Vista de horas por integrante", integracion: "Empleo formal, facturación y Afore (alianzas por definir)",
    ahora: "Operando", detalleAhora: "Horas calculadas de los relevos cubiertos; las alianzas laborales están por definir.",
  },
  "carga-genero": {
    titulo: "Carga de cuidado por persona", seccion: "Hoy", modulos: "M12 Analítica", datos: "Horas por integrante y género",
    servicio: "Vista agregada", integracion: "Referencia ENUT 2024",
    ahora: "Operando", detalleAhora: "Calculado de los relevos cubiertos de los últimos 7 días.",
  },
} satisfies Record<string, TechItem>;

export type TechKey = keyof typeof TECH;

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
    titulo: "Inicio de sesión seguro", seccion: "Acceso", modulos: "M1 Red del caso", datos: "Usuario.clave (PBKDF2 con sal), sesión",
    servicio: "Supabase Auth: contraseña + verificación por código (WhatsApp/SMS)", integracion: "Twilio Verify o proveedor OTP",
    ahora: "Operando", detalleAhora: "Contraseña con PBKDF2 y sal aleatoria, bloqueo tras 5 intentos, «recordarme» por 12 horas; el código para crear o recuperar la contraseña es simulado (123456).",
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
    titulo: "Alta de la familia y la persona mayor", seccion: "Acceso", modulos: "M1 Red del caso · M2 Expediente", datos: "Familia, Miembro, Paciente, Consentimiento",
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
    titulo: "Apoyo por radio: red Respira + base SIDECU", seccion: "Relevos", modulos: "M5 · M11 Directorio", datos: "Usuario (fuente respira | sidecu), centros, SolicitudRed",
    servicio: "GET /red?radio= (PostGIS ST_DWithin) que une perfiles Respira y la base SIDECU", integracion: "SIDECU (Secretaría de las Mujeres y DIF) por convenio; mapa con OpenStreetMap",
    ahora: "Simulado", detalleAhora: "El radio y la disponibilidad se calculan de verdad. SIDECU hoy publica centros; las personas marcadas SIDECU son de ejemplo hasta el convenio, y los centros salen del DENUE.",
  },
  chat: {
    titulo: "Chat de la red", seccion: "Red de cuidado", modulos: "M7 Comunicación", datos: "Mensaje",
    servicio: "Supabase Realtime", integracion: "WhatsApp como canal de entrada y salida",
    ahora: "Operando", detalleAhora: "Compartido entre pestañas del mismo navegador; entre teléfonos requiere el backend.",
  },
  "demo-auto": {
    titulo: "Demo automática y nota de voz simulada", seccion: "Presentación", modulos: "—", datos: "Pasos del speech",
    servicio: "Reproductor que cambia de persona y pantalla y ejecuta las acciones", integracion: "Voz del navegador (speechSynthesis), sin API",
    ahora: "Operando", detalleAhora: "La nota simulada no usa micrófono, dictado ni internet; la respuesta sale de las reglas (Claude solo cambia la redacción si hay API key).",
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
    ahora: "Operando si se configura", detalleAhora: "Envío automático real con TWILIO_*. Sin configurar, cada integrante responde en la alerta y puede reenviar por WhatsApp desde su teléfono (enlace wa.me, sin API).",
  },
  centros: {
    titulo: "Mapa de centros de cuidado cercanos", seccion: "Comunicación", modulos: "M11 Directorio", datos: "Centros (DENUE sector 62)",
    servicio: "La alerta redirige a SIDECU; /centros muestra los 5 más cercanos como vista a futuro", integracion: "SIDECU (cuidados.mujeres.gob.mx) · INEGI DENUE",
    ahora: "Operando", detalleAhora: "Redirección real al sitio de SIDECU; la lista de cercanos usa datos reales del DENUE en Iztapalapa.",
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
  "boton-panico": {
    titulo: "Botón de pánico", seccion: "Comunicación", modulos: "M6 Alertas", datos: "Alerta (origen pánico), destinatarios",
    servicio: "POST /alertas + POST /api/whatsapp a toda la familia", integracion: "Twilio WhatsApp · SIDECU · 911",
    ahora: "Operando si se configura", detalleAhora: "La alerta, el chat y el aviso en la app operan; el WhatsApp sale real con TWILIO_*.",
  },
  valoracion: {
    titulo: "Valoración en checklist", seccion: "Paciente", modulos: "M2 Expediente · M4 Bitácora", datos: "LecturaSignos (origen valoración), síntomas, conciencia",
    servicio: "Mismas reglas de alarma que la nota de voz", integracion: "Asistente con Claude (opcional)",
    ahora: "Operando", detalleAhora: "Biométricos, síntomas y conciencia pasan por las reglas; la trifecta dispara la alerta.",
  },
  "historia-clinica": {
    titulo: "Historia clínica y uso de servicios de salud", seccion: "Paciente", modulos: "M2 Expediente", datos: "Paciente.historia, Paciente.servicios",
    servicio: "PATCH /pacientes", integracion: "Expediente de la unidad de salud (fase posterior)",
    ahora: "Operando", detalleAhora: "Se captura en la valoración y se muestra en la ficha de la persona mayor.",
  },
  "guias-medicas": {
    titulo: "Guías del médico en video", seccion: "Capacitación", modulos: "M9 Capacitación", datos: "Guía, enlace del video",
    servicio: "Catálogo de guías + reproductor", integracion: "Médico aliado; YouTube, Vimeo o almacenamiento propio",
    ahora: "Simulado", detalleAhora: "Los puntos clave están; el video se carga con un enlace cuando lo entregue el médico aliado.",
  },
  evidencia: {
    titulo: "Evidencia de seguimiento", seccion: "Paciente", modulos: "M4 Bitácora · M10 Certificación", datos: "Evidencia (foto, quién, cuándo, confirmación)",
    servicio: "POST /evidencias · confirmación por otro integrante", integracion: "Supabase Storage",
    ahora: "Operando", detalleAhora: "La foto se guarda reducida en el navegador; otra persona de la familia la confirma.",
  },
  equipo: {
    titulo: "Equipo médico: préstamo y renta", seccion: "Red de cuidado", modulos: "M7 Comunicación · M14 Alianzas", datos: "Equipo, Prestamo, aliados",
    servicio: "POST /prestamos; la persona acepta desde su cuenta", integracion: "Proveedores de equipo médico (alianza por confirmar)",
    ahora: "Simulado", detalleAhora: "El préstamo entre perfiles opera; la renta con aliados y sus tarifas son de ejemplo.",
  },
  "cv-cuidado": {
    titulo: "CV de cuidado", seccion: "Personal", modulos: "M10 Certificación · M14", datos: "Horas, habilidades, evidencias, certificaciones, ingreso",
    servicio: "Vista calculada + impresión a PDF", integracion: "Open Badges; bolsa de empleo (alianzas)",
    ahora: "Operando", detalleAhora: "Se calcula de lo registrado; se imprime o guarda como PDF desde el navegador.",
  },
  "union-qr": {
    titulo: "Unirse al espacio con QR", seccion: "Acceso", modulos: "M1 Red del caso", datos: "Familia.codigo, Membresia",
    servicio: "GET /unirse?c= con verificación por OTP", integracion: "Twilio Verify (código por WhatsApp)",
    ahora: "Simulado", detalleAhora: "El QR y el código funcionan; se elige el perfil en lugar de confirmar con OTP. Cada navegador tiene su copia de los datos.",
  },
  notificaciones: {
    titulo: "Notificaciones que piden acción", seccion: "Comunicación", modulos: "M6 Alertas · M5 Relevos", datos: "Relevos, alertas, lecturas, tomas, solicitudes",
    servicio: "Reglas de notificación por rol + push del navegador", integracion: "Web Push / WhatsApp (Twilio) en el MVP",
    ahora: "Operando", detalleAhora: "Horarios sin cubrir, relevos aceptados, pedidos de la persona mayor, alertas sin seguimiento, signos y medicación por registrar.",
  },
  terminos: {
    titulo: "Avisos y consentimiento de datos", seccion: "Acceso", modulos: "M1 · Ética", datos: "Usuario.aceptoTerminos, Paciente.voz.consentimiento",
    servicio: "Aceptación registrada con fecha", integracion: "Aviso de privacidad (LFPDPPP)",
    ahora: "Operando", detalleAhora: "Cada cuenta acepta uso de datos, que Respira no reemplaza a los expertos y que registrar habilidades no habilita por sí mismo para cobrar; la persona mayor da o retira su consentimiento.",
  },
  gastos: {
    titulo: "Gastos del cuidado y quién paga", seccion: "Espacio familiar", modulos: "M13 Finanzas familiares", datos: "Gasto, Familia.reparto",
    servicio: "Resumen por categoría, reparto acordado y transferencias para quedar a mano", integracion: "Comprobantes (Supabase Storage); pagos en el MVP",
    ahora: "Operando", detalleAhora: "Registro de gastos, reparto por porcentaje y cálculo de quién le pasa a quién; lo que paga la persona mayor se descuenta antes de repartir.",
  },
  transicion: {
    titulo: "Transición de la familia y sus roles", seccion: "Hoy", modulos: "M12 Analítica", datos: "Familia.lineaBase, relevos, Zarit",
    servicio: "Comparación antes / ahora", integracion: "—",
    ahora: "Operando", detalleAhora: "La línea base es de ejemplo; el reparto actual se calcula con los relevos de los últimos 7 días.",
  },
  "mi-voz": {
    titulo: "Mi voz: la persona mayor como agente activo", seccion: "Espacio familiar", modulos: "M1 Red del caso · M2 Expediente", datos: "Paciente.voz, Sentir, Aporte, permisos",
    servicio: "Cuenta propia con rol persona mayor; permisos que filtran su historial", integracion: "Ley de Voluntad Anticipada de la CDMX (documento adjunto)",
    ahora: "Operando", detalleAhora: "Nota de voz con transcripción, autorreporte, decisiones, permisos, metas y banco de tiempo; los permisos ocultan su historial a quien ella elija.",
  },
  accesos: {
    titulo: "Accesos según el rol", seccion: "Acceso", modulos: "M1 Red del caso", datos: "Usuario.roles, Membresia.rol",
    servicio: "Políticas por rol (RLS en Supabase)", integracion: "—",
    ahora: "Operando", detalleAhora: "El menú solo muestra lo que corresponde al rol; si se entra por la dirección, la pantalla explica por qué no está activa.",
  },
  metricas: {
    titulo: "Indicadores del espacio familiar", seccion: "Hoy", modulos: "M12 Analítica", datos: "Relevos, Zarit, alertas, certificaciones, ingresos",
    servicio: "Vista agregada por espacio", integracion: "Escala de Zarit abreviada (por validar con el equipo de salud)",
    ahora: "Operando", detalleAhora: "Calculado de lo registrado: horas de 30 días, última escala de cada cuidadora, minutos hasta la primera respuesta a cada alerta.",
  },
} satisfies Record<string, TechItem>;

export type TechKey = keyof typeof TECH;

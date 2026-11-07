import type { CondicionId, SignoId, Umbrales } from "./types";

// Umbrales de ejemplo para la demo. Deben validarse con personal médico y ajustarse por paciente.
export const UMBRALES_BASE: Umbrales = {
  fc: { min: 50, max: 120 },
  fr: { min: 10, max: 24 },
  paSist: { min: 90, max: 180 },
  glucosa: { min: 70, max: 300 },
  temperatura: { max: 38 },
};

export const SIGNOS: Record<SignoId, { nombre: string; unidad: string; ayuda: string }> = {
  fc: { nombre: "Frecuencia cardiaca", unidad: "lpm", ayuda: "Latidos por minuto" },
  fr: { nombre: "Frecuencia respiratoria", unidad: "rpm", ayuda: "Respiraciones por minuto" },
  pa: { nombre: "Presión arterial", unidad: "mmHg", ayuda: "Sistólica / diastólica" },
  glucosa: { nombre: "Glucosa", unidad: "mg/dL", ayuda: "Con glucómetro" },
  temperatura: { nombre: "Temperatura", unidad: "°C", ayuda: "Con termómetro" },
  spo2: { nombre: "Oxigenación", unidad: "%", ayuda: "Con oxímetro" },
  dolor: { nombre: "Dolor", unidad: "0-10", ayuda: "Cómo lo califica la persona" },
  conciencia: { nombre: "Estado de alerta", unidad: "", ayuda: "Alerta, confundida o no responde" },
};

export type Condicion = {
  id: CondicionId;
  nombre: string;
  descripcion: string;
  signos: SignoId[];
  tutoriales: string[];
  prevencion: string[];
};

export const CONDICIONES: Record<CondicionId, Condicion> = {
  diabetes: {
    id: "diabetes",
    nombre: "Diabetes",
    descripcion: "Vigilar glucosa, hidratación y pies.",
    signos: ["glucosa", "fc", "fr", "pa", "conciencia"],
    tutoriales: ["glucosa", "insulina", "pies"],
    prevencion: [
      "Mide la glucosa en los horarios que indicó su médico y anótala.",
      "Revisa sus pies todos los días: heridas, ampollas o cambios de color.",
      "Ofrécele agua durante el día; la deshidratación eleva la glucosa.",
      "Ten a la mano lo que su médico indicó para una baja de azúcar.",
    ],
  },
  caida: {
    id: "caida",
    nombre: "Caída reciente",
    descripcion: "Vigilar dolor, golpes, estado de alerta y riesgo de otra caída.",
    signos: ["dolor", "conciencia", "fc", "fr", "pa"],
    tutoriales: ["movilizacion", "prevencion-caidas", "heridas"],
    prevencion: [
      "Retira tapetes y cables del camino al baño y a la cama.",
      "Deja una luz encendida por la noche.",
      "Acompáñala al baño y al levantarse los primeros días.",
      "Que use calzado cerrado con suela antiderrapante.",
    ],
  },
  hipertension: {
    id: "hipertension",
    nombre: "Hipertensión",
    descripcion: "Vigilar presión arterial y frecuencia cardiaca.",
    signos: ["pa", "fc", "fr"],
    tutoriales: ["signos-vitales"],
    prevencion: ["Toma la presión a la misma hora cada día y anótala.", "Que tome sus medicamentos a sus horas, aunque se sienta bien."],
  },
  demencia: {
    id: "demencia",
    nombre: "Deterioro cognitivo",
    descripcion: "Vigilar estado de alerta y cambios de conducta.",
    signos: ["conciencia", "fc", "pa"],
    tutoriales: ["prevencion-caidas"],
    prevencion: ["Mantén rutinas fijas de comida y sueño.", "Anota cualquier cambio repentino de conducta."],
  },
  movilidad: {
    id: "movilidad",
    nombre: "Movilidad reducida",
    descripcion: "Vigilar piel, dolor y cambios de posición.",
    signos: ["dolor", "fc", "pa"],
    tutoriales: ["movilizacion", "heridas"],
    prevencion: ["Cambia su posición cada 2 horas si pasa mucho tiempo en cama.", "Revisa la piel de talones, cadera y espalda."],
  },
};

// Condiciones: las del catálogo traen protocolo; la familia puede dar de alta cualquier otra
// con su nombre. Esas no tienen reglas automáticas: la familia elige qué signos vigilar y el
// asistente las toma en cuenta al responder.
const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function condicionCatalogo(c: string): Condicion | undefined {
  return (CONDICIONES as Record<string, Condicion>)[c];
}

export function nombreCondicion(c: string) {
  return condicionCatalogo(c)?.nombre ?? c;
}

// Si lo que escriben coincide con una condición del catálogo, se usa la del catálogo.
export function normalizarCondicion(texto: string) {
  const t = sinAcentos(texto);
  const hit = Object.values(CONDICIONES).find((c) => sinAcentos(c.nombre) === t || c.id === t);
  return hit ? hit.id : texto.trim().replace(/^\p{Ll}/u, (l) => l.toUpperCase());
}

export function signosDeCondiciones(condiciones: string[]): SignoId[] {
  return Array.from(new Set(condiciones.flatMap((c) => condicionCatalogo(c)?.signos ?? [])));
}

// Al cambiar las condiciones se suman los signos de las nuevas y se quitan los que solo
// venían de las que se quitaron; los que la familia agregó a mano se conservan.
export function ajustarSignos(antes: string[], despues: string[], signos: SignoId[]): SignoId[] {
  const previos = signosDeCondiciones(antes);
  const manuales = signos.filter((s) => !previos.includes(s));
  return Array.from(new Set([...signosDeCondiciones(despues), ...manuales]));
}

export const SUGERENCIAS_CONDICION = [
  "Alzheimer", "Artrosis", "Cáncer", "Cataratas", "Depresión", "EPOC", "Embolia (secuelas)", "Enfermedad renal crónica", "Fractura de cadera",
  "Glaucoma", "Hipotiroidismo", "Incontinencia", "Insuficiencia cardiaca", "Osteoporosis", "Parkinson", "Pérdida auditiva", "Úlceras por presión",
];
export const SUGERENCIAS_ALERGIA = ["Penicilina", "Sulfas", "Ácido acetilsalicílico", "Ibuprofeno", "Látex", "Mariscos", "Huevo", "Polen"];
export const ROLES_INTERES = ["Cuidar a mi familiar", "Coordinar a la familia", "Hacer relevos en la red", "Acompañamiento"];
export const SUGERENCIAS_ROL = ["Llevar a consultas", "Hacer trámites", "Compras y mandados", "Preparar comidas", "Cuidado nocturno", "Apoyo emocional", "Traducción o lengua de señas"];
export const SUGERENCIAS_EXPERIENCIA = [
  "Primeros auxilios", "Enfermería", "Aplicar insulina", "Curación de heridas", "Medir glucosa", "Tomar presión", "Movilizar en cama",
  "Cuidado de demencia", "Rehabilitación", "Manejo de sonda", "Oxígeno en casa", "Lengua de señas",
];
export const PARENTESCOS = ["Hija", "Hijo", "Pareja", "Nieta", "Nieto", "Sobrina", "Sobrino", "Nuera", "Yerno", "Hermana", "Hermano", "Vecina", "Vecino", "Amiga", "Amigo", "Cuidadora contratada"];

export type Tutorial = {
  id: string;
  titulo: string;
  habilidad: string;
  duracionMin: number;
  institucion: string;
  pasos: string[];
  quiz: { pregunta: string; opciones: string[]; correcta: number }[];
};

const ALIADA = "Institución aliada (Cruz Roja, UNAM o UAM; convenio por confirmar)";

// Contenido de ejemplo para la demo. Cada tutorial debe producirlo y validarlo la institución aliada.
export const TUTORIALES: Tutorial[] = [
  {
    id: "signos-vitales",
    titulo: "Tomar pulso, respiración y presión",
    habilidad: "Signos vitales",
    duracionMin: 8,
    institucion: ALIADA,
    pasos: [
      "Que la persona esté sentada y en reposo al menos 5 minutos.",
      "Pulso: cuenta los latidos en la muñeca durante 30 segundos y multiplica por 2.",
      "Respiración: cuenta cuántas veces sube el pecho en un minuto, sin avisarle.",
      "Presión: brazo apoyado a la altura del corazón; anota los dos números.",
    ],
    quiz: [
      { pregunta: "¿Cuánto tiempo debe reposar antes de tomar la presión?", opciones: ["Nada", "Al menos 5 minutos", "Una hora"], correcta: 1 },
      { pregunta: "Contaste 40 latidos en 30 segundos. ¿Cuál es su frecuencia?", opciones: ["40", "80", "120"], correcta: 1 },
    ],
  },
  {
    id: "glucosa",
    titulo: "Medir la glucosa con glucómetro",
    habilidad: "Medición de glucosa",
    duracionMin: 6,
    institucion: ALIADA,
    pasos: [
      "Lávale las manos con agua y jabón y sécalas bien.",
      "Pon la tira en el glucómetro y pica un costado de la yema del dedo.",
      "Coloca la gota en la tira y espera el resultado.",
      "Anota el valor, la hora y si fue en ayunas o después de comer.",
    ],
    quiz: [
      { pregunta: "¿Dónde conviene picar el dedo?", opciones: ["En el centro de la yema", "En un costado de la yema", "En la uña"], correcta: 1 },
      { pregunta: "¿Qué se anota junto con el valor?", opciones: ["Solo el número", "La hora y si comió", "Nada"], correcta: 1 },
    ],
  },
  {
    id: "insulina",
    titulo: "Aplicar insulina (inyección subcutánea)",
    habilidad: "Inyección subcutánea",
    duracionMin: 10,
    institucion: ALIADA,
    pasos: [
      "Aplica solo la dosis que indicó su médico; nunca la cambies por tu cuenta.",
      "Lávate las manos y limpia la zona (abdomen o muslo).",
      "Toma un pliegue de piel e inyecta en ángulo recto.",
      "Cambia de sitio en cada aplicación y anota la hora.",
    ],
    quiz: [
      { pregunta: "¿Quién decide la dosis de insulina?", opciones: ["La cuidadora", "Su médico", "La persona cuidada"], correcta: 1 },
      { pregunta: "¿Por qué se cambia el sitio de inyección?", opciones: ["Para evitar lesiones en la piel", "Por costumbre", "No se cambia"], correcta: 0 },
    ],
  },
  {
    id: "heridas",
    titulo: "Limpiar y cubrir una herida",
    habilidad: "Curación de heridas",
    duracionMin: 9,
    institucion: ALIADA,
    pasos: [
      "Lávate las manos y usa guantes si tienes.",
      "Limpia con agua limpia o solución salina, del centro hacia afuera.",
      "Seca sin tallar y cubre con gasa limpia.",
      "Si hay pus, mal olor, fiebre o enrojecimiento que crece, avisa a su médico.",
    ],
    quiz: [
      { pregunta: "¿Hacia dónde se limpia una herida?", opciones: ["De afuera hacia el centro", "Del centro hacia afuera", "No importa"], correcta: 1 },
      { pregunta: "¿Cuándo hay que avisar al médico?", opciones: ["Si hay pus o fiebre", "Nunca", "Solo si duele"], correcta: 0 },
    ],
  },
  {
    id: "movilizacion",
    titulo: "Levantarla y movilizarla después de una caída",
    habilidad: "Movilización segura",
    duracionMin: 9,
    institucion: ALIADA,
    pasos: [
      "No la levantes de inmediato: pregúntale dónde le duele y revisa si se golpeó la cabeza.",
      "Si hay dolor fuerte, no puede mover una pierna o se golpeó la cabeza, no la muevas y pide ayuda.",
      "Si está bien, ayúdala a girar de lado, luego a gatas y a sentarse en una silla firme.",
      "Dobla tus rodillas y mantén la espalda recta al ayudarla.",
    ],
    quiz: [
      { pregunta: "¿Qué haces primero después de una caída?", opciones: ["Levantarla rápido", "Preguntar dónde le duele y revisar golpes", "Darle agua"], correcta: 1 },
      { pregunta: "Si se golpeó la cabeza, ¿qué haces?", opciones: ["La levanto", "No la muevo y pido ayuda", "Espero a mañana"], correcta: 1 },
    ],
  },
  {
    id: "prevencion-caidas",
    titulo: "Prevenir caídas en casa",
    habilidad: "Prevención de caídas",
    duracionMin: 5,
    institucion: ALIADA,
    pasos: [
      "Quita tapetes, cables y objetos del paso.",
      "Pon luz nocturna en el camino al baño.",
      "Instala barras o una silla en la regadera si es posible.",
      "Calzado cerrado y antiderrapante, también dentro de casa.",
    ],
    quiz: [
      { pregunta: "¿Qué ayuda a prevenir caídas de noche?", opciones: ["Luz nocturna", "Apagar todo", "Tapetes"], correcta: 0 },
      { pregunta: "¿Qué calzado es más seguro?", opciones: ["Pantuflas abiertas", "Cerrado y antiderrapante", "Descalza"], correcta: 1 },
    ],
  },
  {
    id: "pies",
    titulo: "Revisar los pies en diabetes",
    habilidad: "Cuidado del pie",
    duracionMin: 5,
    institucion: ALIADA,
    pasos: [
      "Revisa todos los días plantas, talones y entre los dedos.",
      "Busca heridas, ampollas, callos o cambios de color.",
      "Lava con agua tibia y seca muy bien entre los dedos.",
      "Cualquier herida que no mejora en 2 días: avisa a su médico.",
    ],
    quiz: [
      { pregunta: "¿Cada cuánto se revisan los pies?", opciones: ["Cada mes", "Todos los días", "Solo si duelen"], correcta: 1 },
      { pregunta: "¿Dónde se seca con más cuidado?", opciones: ["Entre los dedos", "En el talón", "No hace falta secar"], correcta: 0 },
    ],
  },
];

export type CertificacionDef = {
  id: string;
  nombre: string;
  institucion: string;
  requiere: string[]; // ids de tutoriales
  horasMinimas: number;
  modalidad: string;
  beneficios: string[];
};

export const CERTIFICACIONES: CertificacionDef[] = [
  {
    id: "cuidados-basicos-1",
    nombre: "Cuidados Básicos 1",
    institucion: "Cruz Roja (institución aliada propuesta; convenio por confirmar)",
    requiere: ["signos-vitales", "insulina", "heridas", "movilizacion"],
    horasMinimas: 40,
    modalidad: "Demostración presencial de 2 horas, en fin de semana",
    beneficios: ["Empleo formal con seguro social", "Cobrar y emitir facturas", "Autoempleo como cuidadora", "Cotizar para pensión y Afore"],
  },
  {
    id: "cuidado-diabetes",
    nombre: "Cuidado de la persona con diabetes",
    institucion: "Facultad de Enfermería, UNAM (institución aliada propuesta)",
    requiere: ["glucosa", "insulina", "pies"],
    horasMinimas: 20,
    modalidad: "Demostración presencial de 1 hora",
    beneficios: ["Ofrecer relevos pagados especializados", "Respaldo para empleo en residencias y hospitales"],
  },
];

export const DURACIONES_RELEVO = [4, 6, 8];
export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const ALCALDIAS = ["Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán", "Cuajimalpa", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco", "Iztapalapa", "Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta", "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco", "Estado de México (zona metropolitana)"];

// Teléfono de 10 dígitos: quita espacios, guiones y el prefijo +52 / 521 si se pega completo.
export function telefonoLimpio(v: string) {
  let d = v.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("521")) d = d.slice(3);
  else if (d.length > 10 && d.startsWith("52")) d = d.slice(2);
  return d.slice(0, 10);
}

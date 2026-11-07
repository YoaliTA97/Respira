import { SIGNOS, condicionCatalogo } from "./catalogos";
import type { Nivel, SignoId, Umbrales } from "./types";

// Reglas deterministas. Corren antes de cualquier modelo de IA: el nivel de alerta
// nunca depende del criterio de un LLM, y el modelo no puede bajarlo.
// Umbrales de ejemplo, pendientes de validación médica (ver catalogos.ts).

export type Senal =
  | "caida"
  | "golpe_cabeza"
  | "no_se_levanta"
  | "confusion"
  | "no_responde"
  | "dolor_pecho"
  | "dificultad_respirar"
  | "sangrado"
  | "mareo"
  | "poca_agua"
  | "sudoracion";

export const SENAL_TEXTO: Record<Senal, string> = {
  caida: "Caída",
  golpe_cabeza: "Golpe en la cabeza",
  no_se_levanta: "No puede levantarse",
  confusion: "Confusión",
  no_responde: "No responde",
  dolor_pecho: "Dolor de pecho",
  dificultad_respirar: "Dificultad para respirar",
  sangrado: "Sangrado",
  mareo: "Mareo",
  poca_agua: "Poca agua",
  sudoracion: "Sudoración o temblor",
};

export type Medicion = {
  fc?: number;
  fr?: number;
  paSist?: number;
  paDiast?: number;
  glucosa?: number;
  temperatura?: number;
  spo2?: number;
  dolor?: number;
  conciencia?: "alerta" | "confundida" | "no responde";
};

const num = (s: string) => Number(s.replace(",", "."));

export function extraerMedicion(texto: string): { medicion: Medicion; senales: Senal[] } {
  const t = texto.toLowerCase();
  const m: Medicion = {};
  const busca = (re: RegExp) => t.match(re);

  const fc = busca(/(?:pulso|frecuencia card[ií]aca|\bfc\b|latidos|coraz[oó]n)\D{0,18}(\d{2,3})/);
  if (fc) m.fc = num(fc[1]);
  const fr = busca(/(?:respiraci[oó]n|respiraciones|frecuencia respiratoria|\bfr\b|respira)\D{0,18}(\d{1,2})\b/);
  if (fr) m.fr = num(fr[1]);
  const pa = busca(/(?:presi[oó]n|tensi[oó]n|\bpa\b)\D{0,18}(\d{2,3})\s*(?:\/|sobre|de|-)\s*(\d{2,3})/);
  if (pa) {
    m.paSist = num(pa[1]);
    m.paDiast = num(pa[2]);
  }
  const glu = busca(/(?:glucosa|az[uú]car|glucemia|glucometro|gluc[oó]metro)\D{0,18}(\d{2,3})/);
  if (glu) m.glucosa = num(glu[1]);
  const temp = busca(/(?:temperatura|temp\b|fiebre)\D{0,14}(\d{2}(?:[.,]\d)?)/);
  if (temp) m.temperatura = num(temp[1]);
  const spo2 = busca(/(?:oxigenaci[oó]n|ox[ií]metro|saturaci[oó]n|spo2)\D{0,14}(\d{2,3})/);
  if (spo2) m.spo2 = num(spo2[1]);
  const dolor = busca(/dolor\D{0,24}?(\d{1,2})\s*(?:de|\/)\s*10/);
  if (dolor) m.dolor = num(dolor[1]);

  const senales = new Set<Senal>();
  if (/(se cay[oó]|ca[ií]da|se resbal[oó]|se fue al piso)/.test(t)) senales.add("caida");
  if (/(golpe[oó]? (en )?la cabeza|se peg[oó] en la cabeza|golpe en la cabeza|se peg[oó] la cabeza)/.test(t)) senales.add("golpe_cabeza");
  if (/(no (se )?puede (levantar|parar)|no la puedo levantar|no lo puedo levantar|no se puede levantar)/.test(t)) senales.add("no_se_levanta");
  if (/(confundid|desorientad|no (me )?reconoc|habla raro)/.test(t)) senales.add("confusion");
  if (/(no responde|inconscien|desmay|no despierta)/.test(t)) senales.add("no_responde");
  if (/dolor (en el|de|del) pecho/.test(t)) senales.add("dolor_pecho");
  if (/(cuesta respirar|dificultad para respirar|no puede respirar|se ahoga|le falta el aire)/.test(t)) senales.add("dificultad_respirar");
  if (/sangr/.test(t)) senales.add("sangrado");
  if (/mare/.test(t)) senales.add("mareo");
  if (/(poca agua|no ha tomado agua|casi no (ha )?tom|no quiere tomar)/.test(t)) senales.add("poca_agua");
  if (/(sudando|sudor|temblor|tiembla)/.test(t)) senales.add("sudoracion");

  if (senales.has("no_responde")) m.conciencia = "no responde";
  else if (senales.has("confusion")) m.conciencia = "confundida";
  else if (/(alerta|platicando|consciente|bien despierta|orientad)/.test(t)) m.conciencia = "alerta";
  return { medicion: m, senales: [...senales] };
}

export type Hallazgo = { etiqueta: string; valor: string; estado: "normal" | "fuera de rango" };

export type Evaluacion = {
  nivel: Nivel;
  titulo: string;
  motivo: string;
  trifecta: boolean;
  hallazgos: Hallazgo[];
  senales: Senal[];
  acciones: ("911" | "centros" | "relevo" | "tutorial")[];
  notificarFamilia: boolean;
  faltantes: SignoId[];
  indicaciones: string[];
};

const rank: Record<Nivel, number> = { verde: 0, amarillo: 1, rojo: 2 };
export const nivelMayor = (a: Nivel, b: Nivel): Nivel => (rank[a] >= rank[b] ? a : b);

export function evaluar(m: Medicion, senales: Senal[], u: Umbrales, condiciones: string[], signosPerfil: SignoId[]): Evaluacion {
  const hallazgos: Hallazgo[] = [];
  const s = new Set(senales);
  const fuera = { fc: false, fr: false, pa: false };

  if (m.fc !== undefined) {
    fuera.fc = m.fc < u.fc.min || m.fc > u.fc.max;
    hallazgos.push({ etiqueta: "Frecuencia cardiaca", valor: `${m.fc} lpm`, estado: fuera.fc ? "fuera de rango" : "normal" });
  }
  if (m.fr !== undefined) {
    fuera.fr = m.fr < u.fr.min || m.fr > u.fr.max;
    hallazgos.push({ etiqueta: "Frecuencia respiratoria", valor: `${m.fr} rpm`, estado: fuera.fr ? "fuera de rango" : "normal" });
  }
  if (m.paSist !== undefined) {
    fuera.pa = m.paSist < u.paSist.min || m.paSist > u.paSist.max;
    hallazgos.push({ etiqueta: "Presión arterial", valor: `${m.paSist}/${m.paDiast ?? "?"} mmHg`, estado: fuera.pa ? "fuera de rango" : "normal" });
  }
  let gluNivel: Nivel = "verde";
  if (m.glucosa !== undefined) {
    if (m.glucosa < u.glucosa.min || m.glucosa > 400) gluNivel = "rojo";
    else if (m.glucosa > u.glucosa.max) gluNivel = "amarillo";
    hallazgos.push({ etiqueta: "Glucosa", valor: `${m.glucosa} mg/dL`, estado: gluNivel === "verde" ? "normal" : "fuera de rango" });
  }
  if (m.temperatura !== undefined) {
    hallazgos.push({ etiqueta: "Temperatura", valor: `${m.temperatura} °C`, estado: m.temperatura > u.temperatura.max ? "fuera de rango" : "normal" });
  }
  if (m.spo2 !== undefined) {
    hallazgos.push({ etiqueta: "Oxigenación", valor: `${m.spo2}%`, estado: m.spo2 < 92 ? "fuera de rango" : "normal" });
  }
  if (m.dolor !== undefined) {
    hallazgos.push({ etiqueta: "Dolor", valor: `${m.dolor}/10`, estado: m.dolor >= 7 ? "fuera de rango" : "normal" });
  }
  if (m.conciencia) {
    hallazgos.push({ etiqueta: "Estado de alerta", valor: m.conciencia, estado: m.conciencia === "alerta" ? "normal" : "fuera de rango" });
  }

  const trifecta = fuera.fc && fuera.fr && fuera.pa;
  const fueraTrifecta = [fuera.fc, fuera.fr, fuera.pa].filter(Boolean).length;
  let nivel = "verde" as Nivel;
  let titulo = "Sin señales de alerta";
  let motivo = "Los signos que registraste están dentro de los rangos de su perfil.";
  const acciones = new Set<Evaluacion["acciones"][number]>();
  const indicaciones: string[] = [];

  const sube = (n: Nivel, t: string, mo: string) => {
    if (rank[n] > rank[nivel]) {
      nivel = n;
      titulo = t;
      motivo = mo;
    }
  };

  // Emergencias: llamada a la acción inmediata
  if (s.has("no_responde") || s.has("dolor_pecho") || s.has("dificultad_respirar")) {
    sube("rojo", "Alerta grave: llama al 911", "No responde, tiene dolor de pecho o le cuesta respirar. Esto requiere atención de emergencia ahora.");
    acciones.add("911");
  }
  if (s.has("caida") && (s.has("no_se_levanta") || s.has("golpe_cabeza"))) {
    sube("rojo", "Alerta grave: caída con lesión posible", "Después de una caída con golpe en la cabeza o sin poder levantarse, no la muevas y busca atención médica hoy.");
    acciones.add("911");
    indicaciones.push("No la levantes ni la muevas si le duele mucho o se golpeó la cabeza.");
  }
  if (trifecta) {
    sube("rojo", "Alerta grave: trifecta de signos fuera de rango", "Frecuencia cardiaca, frecuencia respiratoria y presión arterial están fuera de rango al mismo tiempo. Lo que necesita excede lo que se puede atender en casa.");
  }
  if (gluNivel === "rojo") {
    sube(
      "rojo",
      m.glucosa! < u.glucosa.min ? "Glucosa baja" : "Glucosa muy alta",
      m.glucosa! < u.glucosa.min
        ? "La glucosa está por debajo del mínimo de su perfil. Sigue el plan que te dio su médico para una baja de azúcar y vuelve a medir en 15 minutos."
        : "La glucosa está muy alta. Busca atención médica hoy.",
    );
  }
  if (s.has("confusion")) {
    sube("rojo", "Alerta grave: confusión repentina", "La confusión que aparece de repente necesita revisión médica hoy.");
  }
  if (nivel === "rojo") acciones.add("centros");

  // Vigilancia
  if (fueraTrifecta > 0 && !trifecta) sube("amarillo", "Vuelve a revisar", `${fueraTrifecta} de los 3 signos clave está fuera del rango que indicó su médico, sin señales de gravedad.`);
  if (gluNivel === "amarillo") sube("amarillo", "Glucosa alta", "La glucosa está por arriba del máximo de su perfil. Ofrécele agua y vuelve a medir antes de la siguiente comida.");
  if (m.temperatura !== undefined && m.temperatura > u.temperatura.max) sube("amarillo", "Temperatura alta", "Tiene temperatura alta. Vuelve a medir en una hora y avisa a su médico si sigue.");
  if (m.dolor !== undefined && m.dolor >= 7) sube("amarillo", "Dolor fuerte", "Reporta dolor fuerte. Anota dónde le duele y avisa a su médico.");
  if (s.has("caida")) {
    sube("amarillo", "Caída sin lesión aparente", "Hubo una caída. Revisa golpes y dolor durante las próximas 24 horas.");
    acciones.add("tutorial");
  }
  if (s.has("mareo") || s.has("poca_agua") || s.has("sangrado") || s.has("sudoracion")) {
    sube("amarillo", "Vuelve a revisar", "Hay señales que conviene vigilar de cerca.");
    if (condiciones.includes("diabetes") && (s.has("mareo") || s.has("sudoracion")) && m.glucosa === undefined) {
      indicaciones.push("Con diabetes, el mareo o el sudor pueden ser una baja de azúcar: mide la glucosa ahora.");
    }
  }

  const medidos: Record<SignoId, boolean> = {
    fc: m.fc !== undefined,
    fr: m.fr !== undefined,
    pa: m.paSist !== undefined,
    glucosa: m.glucosa !== undefined,
    temperatura: m.temperatura !== undefined,
    spo2: m.spo2 !== undefined,
    dolor: m.dolor !== undefined,
    conciencia: m.conciencia !== undefined,
  };
  const faltantes = signosPerfil.filter((x) => !medidos[x]);

  return {
    nivel,
    titulo,
    motivo,
    trifecta,
    hallazgos,
    senales,
    acciones: [...acciones],
    notificarFamilia: trifecta || nivel === "rojo",
    faltantes,
    indicaciones,
  };
}

// Respuesta sin modelo de IA: misma lógica, redactada con plantillas.
export function respuestaPorReglas(ev: Evaluacion, nombre: string, condiciones: string[], revisarEnMin = 15): string {
  const partes: string[] = [];
  if (ev.nivel === "rojo") {
    partes.push(`ALERTA: ${ev.titulo}. ${ev.motivo}`);
    if (ev.acciones.includes("911")) partes.push("Llama al 911 ahora.");
    else partes.push("Revisa el mapa de centros cercanos y decidan a cuál llevarla.");
    if (ev.notificarFamilia) partes.push("Avisé a los familiares principales por WhatsApp.");
  } else if (ev.nivel === "amarillo") {
    partes.push(`${ev.titulo}. ${ev.motivo}`);
    partes.push(`Vuelve a medir en ${revisarEnMin} minutos. Si se repite o empeora, Respira lanza la alerta grave. Si no empeora pero sigue igual, contacten a su médico en menos de 24 horas; para un servicio no urgente pueden buscar en SIDECU.`);
  } else {
    partes.push(`Recibí el reporte de ${nombre}. ${ev.motivo}`);
  }
  partes.push(...ev.indicaciones);
  if (ev.faltantes.length && ev.nivel !== "rojo") {
    partes.push(`Para su perfil también conviene registrar: ${ev.faltantes.map((f) => SIGNOS[f].nombre.toLowerCase()).join(", ")}.`);
  }
  if (ev.nivel === "verde") {
    const tip = condiciones.map((c) => condicionCatalogo(c)?.prevencion[0]).filter(Boolean)[0];
    if (tip) partes.push(`Prevención: ${tip}`);
  }
  return partes.join(" ");
}

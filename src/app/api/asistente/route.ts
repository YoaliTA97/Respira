import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { SIGNOS, condicionCatalogo, nombreCondicion } from "@/lib/catalogos";
import { evaluar, extraerMedicion, respuestaPorReglas, type Medicion, type Senal } from "@/lib/reglas";
import type { Paciente, SignoId, Umbrales } from "@/lib/types";

// Asistente de cuidado.
// 1) Reglas deterministas sobre el texto (siempre).
// 2) Si hay credenciales de Claude, el modelo redacta la respuesta y completa la extracción.
// 3) Las reglas se vuelven a aplicar sobre los datos combinados: el modelo nunca baja el nivel.

const MODELO = process.env.ASISTENTE_MODELO || "claude-opus-5-5";
const SENALES = ["caida", "golpe_cabeza", "no_se_levanta", "confusion", "no_responde", "dolor_pecho", "dificultad_respirar", "sangrado", "mareo", "poca_agua", "sudoracion"] as const;

const Salida = z.object({
  respuesta: z.string().describe("Mensaje para la cuidadora, en español de México, máximo 90 palabras"),
  medicion: z.object({
    fc: z.number().nullable(),
    fr: z.number().nullable(),
    paSist: z.number().nullable(),
    paDiast: z.number().nullable(),
    glucosa: z.number().nullable(),
    temperatura: z.number().nullable(),
    spo2: z.number().nullable(),
    dolor: z.number().nullable(),
    conciencia: z.enum(["alerta", "confundida", "no responde"]).nullable(),
  }),
  senales: z.array(z.enum(SENALES)),
});

type Entrada = {
  texto: string;
  medicionManual?: Medicion;
  senalesManual?: Senal[];
  paciente: Pick<Paciente, "nombre" | "edad" | "condiciones" | "alergias" | "evento" | "signos" | "umbrales">;
  historial: { de: "asistente" | "familia"; texto: string }[];
};

const SISTEMA = `Eres el asistente de cuidado de Respira, una app para familias de la Ciudad de México que cuidan a una persona mayor.
Hablas con la cuidadora que acaba de recibir a la persona en su relevo o que reporta algo durante el cuidado.

Tu trabajo:
- Extraer los signos que mencione (frecuencia cardiaca, frecuencia respiratoria, presión arterial, glucosa, temperatura, oxigenación, dolor de 0 a 10, estado de alerta) y las señales de alarma. Si un dato no se menciona, déjalo en null; no inventes valores.
- Responder en español de México, cálido y claro, en máximo 90 palabras.
- Si la evaluación de reglas es ROJA, tu mensaje es enfático: deja claro que lo que necesita excede lo que se puede atender en casa e indica la acción (llamar al 911 o acudir a un centro).
- Si es AMARILLA, indica qué vigilar y cuándo volver a medir.
- Si es VERDE, confirma y da un consejo de prevención propio de sus condiciones.
- Pide los signos del perfil que no se reportaron.
- Algunas condiciones las dio de alta la familia y no tienen reglas automáticas en Respira: tómalas en cuenta para lo que conviene vigilar y para la prevención, sin diagnosticar.
- Si hay alergias registradas, recuérdalas cuando el reporte hable de medicamentos, curaciones o alimentos.

Límites:
- No diagnosticas, no recetas y no cambias dosis; para eso remites a su médico.
- Nunca contradigas ni bajes el nivel que dieron las reglas.`;

function combinar(a: Medicion, b: z.infer<typeof Salida>["medicion"]): Medicion {
  const out: Medicion = { ...a };
  (Object.keys(b) as (keyof Medicion)[]).forEach((k) => {
    const v = b[k];
    if (out[k] === undefined && v !== null) (out as Record<string, unknown>)[k] = v;
  });
  return out;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Entrada;
  const p = body.paciente;
  const umbrales = p.umbrales as Umbrales;
  const condiciones = (p.condiciones ?? []) as string[];
  const alergias = (p.alergias ?? []) as string[];
  const signos = p.signos as SignoId[];

  const ext = extraerMedicion(body.texto);
  let medicion: Medicion = { ...ext.medicion, ...(body.medicionManual ?? {}) };
  let senales: Senal[] = Array.from(new Set([...ext.senales, ...(body.senalesManual ?? [])]));
  let ev = evaluar(medicion, senales, umbrales, condiciones, signos);
  let respuesta = respuestaPorReglas(ev, p.nombre, condiciones);
  let fuente: "reglas" | "reglas + Claude" = "reglas";

  const hayCredenciales = !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  if (hayCredenciales) {
    try {
      const client = new Anthropic();
      const conProtocolo = condiciones.filter((c) => condicionCatalogo(c)).map(nombreCondicion);
      const sinProtocolo = condiciones.filter((c) => !condicionCatalogo(c));
      const perfil = `Persona mayor: ${p.nombre}, ${p.edad} años. Condiciones con protocolo: ${conProtocolo.join(", ") || "ninguna"}.${
        sinProtocolo.length ? ` Otras condiciones que registró la familia (sin reglas automáticas): ${sinProtocolo.join(", ")}.` : ""
      }${alergias.length ? ` Alergias: ${alergias.join(", ")}.` : ""}${
        p.evento ? ` Evento reciente: caída el ${p.evento.fecha} (${p.evento.descripcion} ${p.evento.lesion}).` : ""
      } Signos que pide su perfil: ${signos.map((s) => SIGNOS[s].nombre).join(", ")}. Umbrales: FC ${umbrales.fc.min}-${umbrales.fc.max}, FR ${umbrales.fr.min}-${umbrales.fr.max}, presión sistólica ${umbrales.paSist.min}-${umbrales.paSist.max}, glucosa ${umbrales.glucosa.min}-${umbrales.glucosa.max}.`;
      const historial = body.historial.map((h) => `${h.de === "asistente" ? "Asistente" : "Familia"}: ${h.texto}`).join("\n");
      const reglas = `Evaluación de reglas: nivel ${ev.nivel.toUpperCase()} (${ev.titulo}). ${ev.motivo}${ev.faltantes.length ? ` Faltan: ${ev.faltantes.join(", ")}.` : ""}`;

      const r = await client.messages.parse({
        model: MODELO,
        max_tokens: 4096,
        output_config: { effort: "low", format: zodOutputFormat(Salida) },
        system: SISTEMA,
        messages: [
          {
            role: "user",
            content: `${perfil}\n\nConversación reciente:\n${historial || "(sin mensajes previos)"}\n\n${reglas}\n\nReporte nuevo de la cuidadora:\n"""${body.texto}"""`,
          },
        ],
      });

      if (r.stop_reason !== "refusal" && r.parsed_output) {
        const out = r.parsed_output;
        medicion = combinar(medicion, out.medicion);
        senales = Array.from(new Set([...senales, ...out.senales]));
        const ev2 = evaluar(medicion, senales, umbrales, condiciones, signos);
        const subio = ev2.nivel !== ev.nivel && ev2.nivel === "rojo";
        ev = ev2;
        respuesta = subio ? `${respuestaPorReglas(ev, p.nombre, condiciones)} ${out.respuesta}` : out.respuesta;
        if (ev.nivel === "rojo" && !/alerta/i.test(respuesta)) respuesta = `ALERTA: ${ev.titulo}. ${respuesta}`;
        fuente = "reglas + Claude";
      }
    } catch (error) {
      // Cualquier falla del modelo deja la respuesta de reglas, que ya es completa.
      if (error instanceof Anthropic.APIError) console.error(`Asistente: error ${error.status} de la API de Claude`);
      else console.error("Asistente: error al llamar a Claude");
    }
  }

  return Response.json({ evaluacion: ev, respuesta, fuente, medicion });
}

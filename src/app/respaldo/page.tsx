import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Límites y alcances · Respira" };

// Respaldo para las preguntas del jurado: qué hace y qué no hace Respira, y dónde se ve en la app.
const PREGUNTAS: { p: string; r: string; ver: { t: string; href: string }[] }[] = [
  {
    p: "¿Y si la IA se equivoca con una alerta?",
    r: "No diagnostica. Las banderas rojas son reglas fijas y revisables; ante la duda se escala (vuelve a revisar → alerta grave), y una enfermera aliada revisa cada semana las recomendaciones. La familia siempre puede llamar al 911 directo.",
    ver: [{ t: "Reglas en el mapa técnico", href: "/tecnico" }, { t: "Revisión semanal (seguimiento)", href: "/seguimiento" }, { t: "Botón de pánico y 911", href: "/familia" }],
  },
  {
    p: "¿Cómo protegen los datos de salud?",
    r: "Aviso de privacidad simple, datos mínimos y voluntarios, consentimiento de la persona mayor, permisos por familiar, contraseña cifrada y derecho a borrar. No vendemos datos.",
    ver: [{ t: "Mi voz: consentimiento, permisos y borrar", href: "/mi-voz" }, { t: "Inicio de sesión seguro", href: "/login" }],
  },
  {
    p: "¿Qué pasa con quien no tiene smartphone o no sabe usar apps?",
    r: "Todo funciona por voz y por WhatsApp; las promotoras del DIF pueden hacer el registro asistido.",
    ver: [{ t: "Nota de voz", href: "/chat" }, { t: "Alta guiada de la familia", href: "/nueva-familia" }],
  },
  {
    p: "¿Por qué pagaría una empresa?",
    r: "Una empleada que cuida falta, rinde menos o renuncia. El servicio es una prestación que ayuda a retenerla y a cumplir la NOM-035 (riesgos psicosociales, incluida la interferencia entre el trabajo y la familia).",
    ver: [{ t: "Quién paga y el impacto", href: "/impacto" }],
  },
  {
    p: "¿Las cuidadoras son trabajadoras del hogar?",
    r: "No. En el caso base cotizan como trabajadoras independientes y la app aparta en automático su cuota del IMSS. Estamos validando si aplica el régimen de plataformas digitales; si aplica, el modelo lo absorbe con un cargo de ~30%.",
    ver: [{ t: "Pasaporte de Cuidado", href: "/pasaporte" }, { t: "CV con apartado IMSS", href: "/cv" }],
  },
  {
    p: "¿En qué se distinguen del sistema de cuidados del gobierno?",
    r: "Lo complementamos. SIDECU es un directorio; Respira acompaña a la familia todos los días y la conecta con esos servicios.",
    ver: [{ t: "Alertas con enlace a SIDECU", href: "/alertas" }, { t: "Radio de cuidado", href: "/red" }],
  },
  {
    p: "¿Qué tan realistas son sus números?",
    r: "Son un caso base con supuestos explícitos. Con la mitad de la adopción, el equilibrio llega en el año 5. Por eso el primer paso es un piloto de 100 cuidadoras que mida todo.",
    ver: [{ t: "Indicadores del piloto", href: "/familia" }],
  },
  {
    p: "¿Qué necesitan hoy?",
    r: "Una alcaldía aliada para el piloto, 3 a 5 empresas dispuestas a probar el servicio y fondos no reembolsables por ~3.4 millones de pesos.",
    ver: [{ t: "Quién paga y el impacto", href: "/impacto" }],
  },
];

const LIMITES = [
  { t: "No diagnostica ni da tratamiento", d: "Compara con los umbrales que indicó su médico; sin ellos solo aplica banderas rojas generales y lo avisa." },
  { t: "Una persona confirma cada registro", d: "La transcripción de la nota de voz se revisa y confirma antes de guardarse; otra persona puede confirmar la evidencia." },
  { t: "Ante la duda, sube de nivel", d: "Vuelve a revisar en 15 min; si se repite o empeora, alerta grave con 911 y WhatsApp a toda la familia." },
  { t: "No reemplaza a los expertos", d: "Respira organiza y orienta; los médicos, enfermeras y servicios de urgencia deciden." },
  { t: "Registrar no es certificar", d: "Las horas y tutoriales no habilitan por sí solos para cobrar: la certificación la otorga una entidad del CONOCER." },
  { t: "Inyecciones y curaciones: solo familia", d: "Como servicio pagado corresponden a enfermería con cédula; en Respira se contratan como enfermería." },
];

export default function Respaldo() {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>
      <div>
        <h1 className="text-[30px] font-semibold tracking-tight">Límites y alcances</h1>
        <p className="mt-1 text-muted">Lo que Respira hace, lo que no hace y dónde se ve en la app.</p>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {LIMITES.map((l) => (
          <div key={l.t} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
            <span className="font-semibold">{l.t}</span>
            <span className="text-sm text-muted">{l.d}</span>
          </div>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Preguntas probables del jurado</h2>
        {PREGUNTAS.map((q) => (
          <details key={q.p} className="group rounded-2xl border border-line bg-white p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none font-semibold">{q.p}</summary>
            <p className="mt-2 text-[15px] text-ink-2">{q.r}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.ver.map((v) => <Link key={v.href + v.t} href={v.href} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primario hover:border-primario">{v.t}</Link>)}
            </div>
          </details>
        ))}
      </section>
      <p className="text-xs text-muted">Cifras de INEGI (31.7 millones de personas que cuidan, 75% mujeres, 23.9% del PIB, 19.2 millones de personas de 60+, 77.6% sin cuidados en su hogar) son datos. Las del modelo (año 4, 30 mil familias, 374 millones) son proyecciones del caso base. Doreen y Sara son un caso ilustrativo.</p>
    </div>
  );
}

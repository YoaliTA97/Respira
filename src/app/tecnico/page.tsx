import { TECH, type MvpEstado } from "@/lib/tech";

const ESTILO: Record<MvpEstado, string> = {
  Real: "bg-green-bg text-green-ink",
  "Real con datos sembrados": "bg-green-bg text-green-ink",
  Simulado: "bg-amber-bg text-amber-ink",
  "Fase posterior": "bg-chip text-ink-2",
};

const CAPAS = [
  { t: "Canales", d: "Web app (PWA) para la familia · paneles web · WhatsApp como entrada y salida" },
  { t: "Acceso", d: "Supabase Auth con OTP · políticas por consentimiento (RLS)" },
  { t: "Servicios", d: "Red del caso, expediente, bitácora, turnos, alertas, directorio, Pasaporte, respiro y financiamiento" },
  { t: "Agentes", d: "FastAPI · faster-whisper (voz a texto) · reglas de alarma antes del LLM · Claude Haiku 5.5 con herramientas" },
  { t: "Datos", d: "PostgreSQL con PostGIS y pgvector · bitácora append-only · archivos cifrados" },
  { t: "Integraciones", d: "Sandbox de WhatsApp de Twilio · OpenStreetMap · DENUE y CLUES · Open Badges (CONOCER)" },
];

export default function TecnicoPage() {
  const items = Object.values(TECH);
  const conteo = (e: MvpEstado) => items.filter((i) => i.mvp === e).length;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-semibold tracking-tight">Mapa técnico de la demo</h1>
        <p className="max-w-[760px] text-[15px] leading-relaxed text-muted">
          Esta demo corre solo en el navegador con datos sintéticos. Cada elemento de la interfaz está mapeado al módulo, los datos, el servicio y la integración que lo respaldan en el MVP. Activa la <strong className="text-tech">capa técnica</strong> arriba para verlo sobre las pantallas.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPAS.map((c) => (
          <div key={c.t} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{c.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed">{c.d}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Qué respalda cada elemento</h2>
          <p className="text-sm text-muted">
            {conteo("Real") + conteo("Real con datos sembrados")} reales en el MVP · {conteo("Simulado")} simulados · {conteo("Fase posterior")} en fase posterior
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-2">
                {["Elemento", "Dónde aparece", "Módulo", "Datos", "Servicio", "Integración", "En el MVP"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.titulo} className="border-b border-line-soft align-top last:border-0">
                  <td className="px-3 py-3 font-semibold">{i.titulo}</td>
                  <td className="px-3 py-3 text-ink-2">{i.pantalla}</td>
                  <td className="px-3 py-3">{i.modulos}</td>
                  <td className="px-3 py-3">{i.datos}</td>
                  <td className="px-3 py-3 font-mono text-[12px]">{i.servicio}</td>
                  <td className="px-3 py-3">{i.integracion}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO[i.mvp]}`}>{i.mvp}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

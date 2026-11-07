"use client";

import { useDemo } from "@/lib/store";
import { proyecciones } from "@/lib/rules";
import { TechTag } from "@/components/TechTag";
import { card } from "@/components/ui";

export default function IndicadoresPage() {
  const { state } = useDemo();
  const p = proyecciones(state);
  const rojas = state.alerts.filter((a) => a.nivel === "rojo");
  const rojasRevisadas = rojas.filter((a) => a.estado !== "pendiente");
  const tiempos = rojasRevisadas.filter((a) => a.revisadaMs && a.creadaMs > 0).map((a) => (a.revisadaMs! - a.creadaMs) / 60000);
  const tiempoProm = tiempos.length ? Math.max(1, Math.round(tiempos.reduce((x, y) => x + y, 0) / tiempos.length)) : null;
  const pctVerif = Math.round((p.horasVerificadas / p.horasRegistradas) * 100);

  const tiles = [
    { t: "Horas de respiro de Rosa", v: `${p.respiroHoras} h`, d: "Relevos confirmados × 4 h" },
    { t: "Carga de cuidado en mujeres", v: `${p.pctMujeres}%`, d: "De las horas de la red familiar esta semana" },
    {
      t: "Alertas rojas revisadas por una persona",
      v: `${rojasRevisadas.length} de ${rojas.length}`,
      d: tiempoProm ? `Tiempo promedio de revisión: ${tiempoProm} min` : "Confirma una alerta en el panel de la promotora",
    },
    { t: "Horas de Rosa con evidencia verificada", v: `${pctVerif}%`, d: "Cofirmadas por la familia o validadas" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-muted">DIF y municipio</p>
        <h1 className="text-[28px] font-semibold tracking-tight">Indicadores</h1>
        <p className="mt-1 max-w-[640px] text-sm text-muted">
          Calculados en vivo con los datos sintéticos de esta demo (una familia). No son resultados del piloto.
        </p>
      </div>

      <TechTag k="indicadores">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((k) => (
            <div key={k.t} className={`${card} flex flex-col gap-1.5 p-5`}>
              <span className="text-sm font-medium text-ink-2">{k.t}</span>
              <span className="text-[32px] font-semibold tracking-tight">{k.v}</span>
              <span className="text-[13px] text-muted">{k.d}</span>
            </div>
          ))}
        </div>
      </TechTag>

      <TechTag k="carga-persona">
        <section className={`${card} p-5`}>
          <h2 className="mb-3 text-lg font-semibold">Quién cuida en la red familiar</h2>
          <div className="flex flex-col gap-2.5">
            {p.cargaSemana.map((c) => (
              <div key={c.member.id} className="grid grid-cols-[110px_minmax(0,1fr)_60px] items-center gap-3 text-sm">
                <span>
                  {c.member.nombre} <span className="text-muted">({c.member.genero})</span>
                </span>
                <span className="flex h-2.5 rounded-full bg-chip">
                  <span className={`rounded-full ${c.member.genero === "mujer" ? "bg-ink" : "bg-tone-mid"}`} style={{ width: `${(c.horas / p.totalSemana) * 100}%` }} />
                </span>
                <span className="text-right font-semibold">{Math.round(c.horas)} h</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">En el piloto se compara con la referencia nacional de ENUT 2024 del análisis BUILD-HER.</p>
        </section>
      </TechTag>

      <section className={`${card} p-5`}>
        <h2 className="mb-1 text-lg font-semibold">Métricas del piloto propuesto</h2>
        <p className="mb-3 text-sm text-muted">1 municipio · 100 cuidadoras · 3 meses. Línea base y metas por definir con el DIF.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-2">
                <th className="px-2 py-2.5 font-medium">Métrica</th>
                <th className="px-2 py-2.5 font-medium">Cómo la calcula la plataforma</th>
                <th className="px-2 py-2.5 font-medium">Meta</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Horas de respiro al mes", "Relevos con entrada y salida"],
                ["Sobrecarga (escala Zarit)", "Cuestionario por WhatsApp al inicio y a los 3 meses"],
                ["Alertas canalizadas a tiempo", "Tiempo de alerta a revisión humana y a canalización"],
                ["Cuidadoras certificadas con ingreso", "Credencial C3 y primer relevo pagado en la red"],
              ].map(([m, c]) => (
                <tr key={m} className="border-b border-line-soft last:border-0">
                  <td className="px-2 py-2.5 font-semibold">{m}</td>
                  <td className="px-2 py-2.5">{c}</td>
                  <td className="px-2 py-2.5 text-muted">por definir</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

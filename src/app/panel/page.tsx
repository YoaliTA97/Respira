"use client";

import { useState } from "react";
import { DIRECTORIO, useDemo } from "@/lib/store";
import type { Nivel } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, StatusPill, btnPrimary, btnSecondary, card } from "@/components/ui";

const ORDEN: Record<Nivel, number> = { rojo: 0, amarillo: 1, verde: 2 };

export default function PromotoraPage() {
  const { state, confirmarAlerta, reclasificarAlerta, validarPractica, avisar } = useDemo();
  const [tab, setTab] = useState<"alertas" | "practicas">("alertas");
  const [destino, setDestino] = useState(DIRECTORIO[0].id);

  const pendientes = state.alerts.filter((a) => a.estado === "pendiente").sort((a, b) => ORDEN[a.nivel] - ORDEN[b.nivel]);
  const revisadas = state.alerts.filter((a) => a.estado !== "pendiente");
  const rosa = pendientes.find((a) => a.casoId === state.casoId);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = state.alerts.find((a) => a.id === selId) ?? rosa ?? pendientes[0] ?? revisadas[0];

  const practicas = state.events.filter((e) => e.competencia && (e.verificacion === "V2" || e.verificacion === "V3") && !e.id.startsWith("e-seed"));
  const porValidar = practicas.filter((e) => e.verificacion === "V2");

  const confirmar = () => {
    if (!sel) return;
    const d = DIRECTORIO.find((x) => x.id === destino)!;
    confirmarAlerta(sel.id, `${d.nombre} · ${d.distancia} · ${d.horario}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Ana · Centro de Salud comunitario</p>
          <h1 className="text-[28px] font-semibold tracking-tight">Panel de la promotora</h1>
        </div>
        <div className="flex gap-1 rounded-xl bg-chip p-1" role="tablist" aria-label="Vista">
          {(["alertas", "practicas"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-[40px] rounded-lg px-4 text-sm ${tab === t ? "border border-line bg-white font-semibold" : "font-medium text-muted"}`}
            >
              {t === "alertas" ? `Alertas (${pendientes.length})` : `Prácticas por validar (${porValidar.length})`}
            </button>
          ))}
        </div>
      </div>

      {tab === "alertas" && (
        <div className="flex flex-wrap items-start gap-5">
          <section aria-label="Cola de alertas" className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5 md:max-w-[340px]">
            <p className="text-[13px] leading-snug text-muted">Ordenadas por semáforo. Toda alerta roja requiere tu confirmación antes de canalizar.</p>
            {[...pendientes, ...revisadas].map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelId(a.id)}
                className={`flex flex-col gap-1.5 rounded-2xl border bg-white p-3.5 text-left transition ${sel?.id === a.id ? "border-ink ring-1 ring-ink" : "border-line hover:bg-chip"}`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold">{a.persona}</span>
                  <span className="text-xs text-muted">{a.hora}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusPill nivel={a.estado === "reclasificada" ? "amarillo" : a.nivel} />
                  {a.estado !== "pendiente" && <Pill>revisada</Pill>}
                </span>
                <span className="text-sm text-ink-2">{a.resumen}</span>
              </button>
            ))}
          </section>

          {sel && (
            <section aria-label="Detalle de la alerta" className="flex min-w-0 flex-[999_1_420px] flex-col gap-4">
              <div className={`${card} flex flex-wrap items-center justify-between gap-3 p-5`}>
                <div className="flex items-center gap-3">
                  <Avatar nombre={sel.persona} size={44} />
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{sel.persona}</h2>
                    <p className="text-sm text-muted">
                      Cuida a {sel.cuidaA} · recibida {sel.hora}
                    </p>
                  </div>
                </div>
                <StatusPill nivel={sel.estado === "reclasificada" ? "amarillo" : sel.nivel} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${card} flex flex-col gap-3 p-5`}>
                  <h3 className="text-[15px] font-semibold">Reporte</h3>
                  {sel.transcripcion ? (
                    <p className="text-sm leading-relaxed text-ink-2">«{sel.transcripcion}»</p>
                  ) : (
                    <p className="text-sm text-muted">Registro escrito en la app.</p>
                  )}
                </div>
                <TechTag k="estado-semaforo">
                  <div className={`${card} flex h-full flex-col gap-3 p-5`}>
                    <h3 className="text-[15px] font-semibold">Señales detectadas</h3>
                    <ul className="flex flex-col gap-2 text-sm">
                      {sel.reglas.map((r) => (
                        <li key={r} className="flex items-center justify-between gap-2">
                          <span className="font-medium">{r}</span>
                          <Pill tone="red">regla de alarma</Pill>
                        </li>
                      ))}
                      {sel.senalesIA.map((r) => (
                        <li key={r} className="flex items-center justify-between gap-2">
                          <span className="font-medium">{r}</span>
                          <Pill>extraído por IA</Pill>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-line-soft pt-3">
                      <p className="text-xs font-semibold text-ink-2">Motivo enviado a la familia</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{sel.motivo}</p>
                    </div>
                  </div>
                </TechTag>
              </div>

              {sel.estado === "pendiente" ? (
                <>
                  <TechTag k="directorio">
                    <fieldset className={`${card} flex flex-col gap-2 p-5`}>
                      <legend className="sr-only-text">Canalizar a</legend>
                      <h3 className="mb-1 text-[15px] font-semibold">Canalizar a</h3>
                      {DIRECTORIO.map((d) => (
                        <label key={d.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${destino === d.id ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                          <input type="radio" name="destino" checked={destino === d.id} onChange={() => setDestino(d.id)} className="mt-0.5 h-5 w-5 accent-ink" />
                          <span className="flex flex-col text-sm">
                            <span className="font-semibold">{d.nombre}</span>
                            <span className="text-muted">
                              {d.fuente} · {d.distancia} · {d.horario}
                            </span>
                          </span>
                        </label>
                      ))}
                      <p className="mt-1 text-xs text-muted">Directorio de ejemplo. En el MVP sale de DENUE sector 62 y CLUES, en lugar de SIDECU.</p>
                    </fieldset>
                  </TechTag>
                  <TechTag k="revision-humana">
                    <div className="flex flex-wrap gap-2.5">
                      <button type="button" className={btnPrimary} onClick={confirmar}>
                        Confirmar y canalizar
                      </button>
                      {sel.nivel === "rojo" && (
                        <button type="button" className={btnSecondary} onClick={() => reclasificarAlerta(sel.id)}>
                          Bajar a amarillo
                        </button>
                      )}
                      <button type="button" className={btnSecondary} onClick={() => avisar(`Llamando a ${sel.persona} (simulado)`)}>
                        Llamar a {sel.persona}
                      </button>
                    </div>
                  </TechTag>
                </>
              ) : (
                <div className={`${card} p-5 text-sm`}>
                  <span className="font-semibold">{sel.estado === "confirmada" ? "Confirmada y canalizada" : "Revisada y bajada a vigilar"}</span>
                  {sel.destino && <span className="text-muted"> · {sel.destino}</span>}
                  {sel.revisadaMs && sel.creadaMs > 0 && (
                    <span className="text-muted"> · revisada en {Math.max(1, Math.round((sel.revisadaMs - sel.creadaMs) / 60000))} min</span>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {tab === "practicas" && (
        <TechTag k="validar-practica">
          <section className={`${card} flex flex-col gap-1 p-5`}>
            <p className="mb-2 text-sm text-muted">
              Prácticas confirmadas por otra persona de la familia. Al validarlas suman a la certificación de la cuidadora.
            </p>
            {practicas.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Aún no hay prácticas. Registra una movilización en la app con la confirmación de Mariana.
              </p>
            )}
            {practicas.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar nombre={e.actorNombre} size={34} />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold">
                      {e.actorNombre} · {e.categoria}
                    </span>
                    <span className="text-[13px] text-muted">
                      {e.detalle} · {e.hora} · confirmado por {e.confirmadoPor}
                    </span>
                  </div>
                </div>
                {e.verificacion === "V2" ? (
                  <button type="button" className={btnSecondary} onClick={() => validarPractica(e.id)}>
                    Validar práctica
                  </button>
                ) : (
                  <Pill tone="green">Validada</Pill>
                )}
              </div>
            ))}
          </section>
        </TechTag>
      )}
    </div>
  );
}

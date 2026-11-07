"use client";

import Link from "next/link";
import { useDemo } from "@/lib/store";
import { proyecciones } from "@/lib/rules";
import type { Day, Slot } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { TechTag } from "@/components/TechTag";
import { btnPrimary, btnSecondary, card } from "@/components/ui";

const DIAS: Day[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const SLOTS: Slot[] = ["Mañana", "Tarde", "Noche"];
const NOMBRE_DIA: Record<Day, string> = { Lun: "Lunes", Mar: "Martes", Mié: "Miércoles", Jue: "Jueves", Vie: "Viernes", Sáb: "Sábado", Dom: "Domingo" };

export default function TurnosPage() {
  const { state, avisar } = useDemo();
  const p = proyecciones(state);

  const celda = (id: string | null) => {
    if (!id) return { texto: "Hueco", cls: "border-[1.5px] border-dashed border-[#d9867b] bg-red-bg text-red-ink text-[11px]" };
    const m = state.members.find((x) => x.id === id);
    if (m) {
      const cls = m.tono === "dark" ? "bg-tone-dark text-white" : m.tono === "mid" ? "bg-tone-mid text-white" : "bg-tone-light text-ink";
      return { texto: m.nombre.slice(0, 1), cls };
    }
    const h = state.helpers.find((x) => x.id === id);
    return { texto: h?.iniciales ?? "?", cls: "border-[1.5px] border-ink bg-white text-ink text-[11px]" };
  };

  const huecos = DIAS.flatMap((d) => SLOTS.filter((s) => !state.shifts[d][s]).map((s) => ({ d, s })));
  const hueco = huecos[0];
  const pendiente = state.relevos.find((r) => r.casoId === state.casoId && r.estado === "solicitado");
  const top = [...p.cargaSemana].sort((a, b) => b.horas - a.horas)[0];
  const pctTop = Math.round((top.horas / p.totalSemana) * 100);
  const nochesTop = DIAS.filter((d) => state.shifts[d].Noche === top.member.id).length;
  const externos = DIAS.flatMap((d) => SLOTS.map((s) => state.shifts[d][s])).filter((id) => id && state.helpers.some((h) => h.id === id));

  return (
    <>
      <AppHeader sub={`Cuidado de ${state.recipient.nombre}`} titulo="Turnos de la familia" right={<span className="text-[13px] font-medium">Esta semana</span>} />
      <div className="flex flex-col gap-3">
        <TechTag k="turnos">
          <section className={`${card} flex flex-col gap-3`}>
            <table className="-m-1 w-[calc(100%+8px)] border-separate border-spacing-1 text-[13px]">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="w-11 text-left font-medium">
                    <span className="sr-only-text">Día</span>
                  </th>
                  {SLOTS.map((s) => (
                    <th key={s} className="font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIAS.map((d) => (
                  <tr key={d}>
                    <th className="text-left font-medium text-muted">{d}</th>
                    {SLOTS.map((s) => {
                      const c = celda(state.shifts[d][s]);
                      return (
                        <td key={s} className={`h-[34px] rounded-[9px] text-center font-semibold ${c.cls}`}>
                          {c.texto}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-3 border-t border-line-soft pt-2.5 text-xs text-muted">
              {state.members.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded ${m.tono === "dark" ? "bg-tone-dark" : m.tono === "mid" ? "bg-tone-mid" : "bg-tone-light"}`} />
                  {m.nombre}
                </span>
              ))}
              {externos.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border-[1.5px] border-ink" />
                  Relevo de la red
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border-[1.5px] border-dashed border-[#d9867b]" />
                Sin cubrir
              </span>
            </div>
          </section>
        </TechTag>

        {hueco && (
          <section className={`${card} flex flex-col gap-2.5 border-red-line`}>
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">
                {NOMBRE_DIA[hueco.d]} por la {hueco.s.toLowerCase()} sin cubrir
              </span>
              <span className="text-[13px] text-muted">
                {pendiente ? `Pediste un relevo a ${pendiente.helperNombre}; falta que la cooperativa lo confirme.` : "Nadie de la familia marcó disponibilidad."}
              </span>
            </div>
            {!pendiente && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={btnSecondary} onClick={() => avisar("Se preguntó a la familia por WhatsApp (simulado)")}>
                  Pedir a la familia
                </button>
                <Link href="/app/relevo" className={`${btnPrimary} min-h-[44px] text-sm`}>
                  Relevo cercano
                </Link>
              </div>
            )}
          </section>
        )}

        {pctTop > 70 && (
          <TechTag k="sugerencia-reparto">
            <section className="flex items-start gap-3 rounded-[18px] border border-line bg-white/60 p-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
              </svg>
              <div className="flex flex-col gap-2">
                <span className="text-sm leading-snug">
                  {top.member.nombre} cubre el {pctTop}% de las horas y {nochesTop} de 7 noches. Si Jorge toma dos noches más, la carga se reparte mejor.
                </span>
                <button type="button" onClick={() => avisar("Propuesta enviada a Jorge por WhatsApp (simulado)")} className="self-start text-[13px] font-semibold underline underline-offset-2">
                  Proponer a Jorge
                </button>
              </div>
            </section>
          </TechTag>
        )}
      </div>
    </>
  );
}

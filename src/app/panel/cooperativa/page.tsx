"use client";

import { useDemo } from "@/lib/store";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, btnPrimary, card } from "@/components/ui";

const ESTADO = {
  solicitado: { t: "Por confirmar", tone: "amber" as const },
  confirmado: { t: "Confirmado", tone: "neutral" as const },
  terminado: { t: "Terminado", tone: "green" as const },
};

export default function CooperativaPage() {
  const { state, confirmarRelevo } = useDemo();
  const relevos = [...state.relevos].reverse();
  const cuenta = (e: keyof typeof ESTADO) => state.relevos.filter((r) => r.estado === e).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-muted">Cooperativa de cuidado (ejemplo)</p>
        <h1 className="text-[28px] font-semibold tracking-tight">Panel de la cooperativa</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { t: "Por confirmar", v: String(cuenta("solicitado")) },
          { t: "Confirmados", v: String(cuenta("confirmado")) },
          { t: "Terminados", v: String(cuenta("terminado")) },
          { t: `Bolsa ${state.bolsa.pagador}`, v: `${state.bolsa.usadasHoras} de ${state.bolsa.totalHoras} h` },
        ].map((k) => (
          <div key={k.t} className={`${card} flex flex-col gap-1`}>
            <span className="text-[13px] text-muted">{k.t}</span>
            <span className="text-2xl font-semibold tracking-tight">{k.v}</span>
          </div>
        ))}
      </div>

      <TechTag k="cooperativa-asignacion">
        <section className={`${card} p-5`}>
          <h2 className="mb-3 text-lg font-semibold">Solicitudes de respiro</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-2">
                  <th className="px-2 py-2.5 font-medium">Familia</th>
                  <th className="px-2 py-2.5 font-medium">Día y horario</th>
                  <th className="px-2 py-2.5 font-medium">Releva</th>
                  <th className="px-2 py-2.5 font-medium">Pagador</th>
                  <th className="px-2 py-2.5 font-medium">Estado</th>
                  <th className="px-2 py-2.5 font-medium">
                    <span className="sr-only-text">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {relevos.map((r) => (
                  <tr key={r.id} className={`border-b border-line-soft last:border-0 ${r.estado === "solicitado" ? "bg-[#fafaf9]" : ""}`}>
                    <td className="px-2 py-2.5 font-semibold">{r.familia}</td>
                    <td className="px-2 py-2.5">
                      {r.dia} · {r.horario}
                    </td>
                    <td className="px-2 py-2.5">{r.helperNombre}</td>
                    <td className="px-2 py-2.5">{r.pagador}</td>
                    <td className="px-2 py-2.5">
                      <Pill tone={ESTADO[r.estado].tone}>{ESTADO[r.estado].t}</Pill>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      {r.estado === "solicitado" && (
                        <button type="button" className={`${btnPrimary} min-h-[40px] px-4 text-sm`} onClick={() => confirmarRelevo(r.id)}>
                          Confirmar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </TechTag>

      <TechTag k="relevo-radio">
        <section className={`${card} p-5`}>
          <h2 className="mb-1 text-lg font-semibold">Red de cuidadoras</h2>
          <p className="mb-3 text-sm text-muted">Personas que ya saben cuidar y declararon horarios y radio.</p>
          <div className="grid gap-2.5 md:grid-cols-2">
            {state.ofrecerAcompanamiento && (
              <div className="flex items-center gap-3 rounded-xl border border-ink p-3">
                <Avatar nombre="Rosa" size={36} />
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">Rosa · nueva en la red</span>
                  <span className="text-[13px] text-muted">Práctica validada C2 · acompañamiento</span>
                </div>
                <Pill tone="green">Disponible</Pill>
              </div>
            )}
            {state.helpers.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Avatar nombre={h.nombre} tone="mid" size={36} />
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">
                    {h.nombre} <span className="font-normal text-muted">· {h.descripcion}</span>
                  </span>
                  <span className="text-[13px] text-muted">
                    {h.nivel === "C3" ? "Certificada C3" : "Práctica validada C2"} · {h.habilidades.join(", ").toLowerCase()} · {h.distanciaKm} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </TechTag>

      <TechTag k="pagador">
        <section className={`${card} p-5`}>
          <h2 className="mb-3 text-lg font-semibold">Bolsa de horas por pagador</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-2">
                  <th className="px-2 py-2.5 font-medium">Pagador</th>
                  <th className="px-2 py-2.5 font-medium">Tipo</th>
                  <th className="px-2 py-2.5 font-medium">Horas usadas</th>
                  <th className="px-2 py-2.5 font-medium">Disponibles</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line-soft">
                  <td className="px-2 py-2.5 font-semibold">{state.bolsa.pagador}</td>
                  <td className="px-2 py-2.5">Gobierno local</td>
                  <td className="px-2 py-2.5">{state.bolsa.usadasHoras}</td>
                  <td className="px-2 py-2.5">{state.bolsa.totalHoras - state.bolsa.usadasHoras}</td>
                </tr>
                <tr className="border-b border-line-soft">
                  <td className="px-2 py-2.5 font-semibold">Empleador (ejemplo)</td>
                  <td className="px-2 py-2.5">Prestación laboral</td>
                  <td className="px-2 py-2.5 text-muted">por definir</td>
                  <td className="px-2 py-2.5 text-muted">por definir</td>
                </tr>
                <tr>
                  <td className="px-2 py-2.5 font-semibold">Aseguradora (ejemplo)</td>
                  <td className="px-2 py-2.5">Beneficio de póliza</td>
                  <td className="px-2 py-2.5 text-muted">por definir</td>
                  <td className="px-2 py-2.5 text-muted">por definir</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Bolsa de ejemplo para la demo; el monto real se define en el convenio con el pagador.</p>
        </section>
      </TechTag>
    </div>
  );
}

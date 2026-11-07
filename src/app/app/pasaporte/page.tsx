"use client";

import { useDemo } from "@/lib/store";
import { nivelSkill, proyecciones } from "@/lib/rules";
import { SKILL_C2_PRACTICAS } from "@/lib/seed";
import { AppHeader } from "@/components/AppHeader";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, card } from "@/components/ui";

const NIVELES = ["C1", "C2", "C3"];

export default function PasaportePage() {
  const { state, setOfrecer, avisar } = useDemo();
  const p = proyecciones(state);
  const puedeOfrecer = p.skillsC2 > 0;

  return (
    <>
      <AppHeader sub="Tu trayectoria de cuidado" titulo="Pasaporte de Cuidado" />
      <div className="flex flex-col gap-3">
        <section className={`${card} flex items-center gap-3`}>
          <Avatar nombre="Rosa" size={48} />
          <div className="flex flex-1 flex-col">
            <span className="text-lg font-semibold tracking-tight">Rosa</span>
            <span className="text-[13px] text-muted">
              Cuida a su {state.recipient.relacion} · {state.recipient.municipio}
            </span>
          </div>
          <TechTag k="certificacion">
            <button type="button" onClick={() => avisar("QR de verificación del Pasaporte (simulado)")} className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line px-3 text-[13px] font-semibold">
              QR
            </button>
          </TechTag>
        </section>

        <TechTag k="pasaporte-horas">
          <section className="grid grid-cols-3 gap-2">
            {[
              { v: `${Math.round(p.horasRegistradas)} h`, t: "registradas" },
              { v: `${Math.round(p.horasVerificadas)} h`, t: "verificadas" },
              { v: `${p.respiroHoras} h`, t: "de respiro" },
            ].map((x) => (
              <div key={x.t} className="flex flex-col gap-0.5 rounded-[14px] border border-line bg-white p-3">
                <span className="text-[22px] font-semibold tracking-tight">{x.v}</span>
                <span className="text-xs text-muted">{x.t}</span>
              </div>
            ))}
          </section>
        </TechTag>

        <TechTag k="elegibilidad">
          <section className={`${card} flex flex-col`}>
            <h2 className="mb-1 text-[15px] font-semibold">Apoyos y financiamiento</h2>
            <div className="flex flex-col gap-1.5 border-b border-line-soft py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Apoyo a cuidadoras · programa piloto</span>
                <Pill tone={p.elegibleApoyo ? "green" : "amber"}>{p.elegibleApoyo ? "Elegible" : "Aún no"}</Pill>
              </div>
              <span className="text-[13px] leading-snug text-muted">
                Lo respaldan {Math.round(p.horasVerificadas)} h verificadas y {p.skillsC2} habilidades en nivel C2 o más. Regla de ejemplo: 250 h verificadas y 2 habilidades en C2.
              </span>
              {p.elegibleApoyo && (
                <button type="button" onClick={() => avisar("Solicitud enviada al pagador (simulado)")} className="mt-1 self-start rounded-[10px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-white">
                  Solicitar
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1 border-b border-line-soft py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Respiro pagado · {state.bolsa.pagador}</span>
                <Pill>Activo</Pill>
              </div>
              <span className="text-[13px] text-muted">{p.respiroHoras} h de respiro recibidas en el piloto</span>
            </div>
            <div className="flex flex-col gap-1 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Relevos pagados en tu radio</span>
                <Pill tone="amber">Al certificarte</Pill>
              </div>
              <span className="text-[13px] text-muted">Te falta: evaluación C3 con CONOCER</span>
            </div>
          </section>
        </TechTag>

        <TechTag k="habilidades">
          <section className={`${card} flex flex-col gap-3`}>
            <h2 className="text-[15px] font-semibold">Habilidades</h2>
            {state.skills.map((s) => {
              const n = nivelSkill(s);
              const lleno = n === "C3" ? 3 : n === "C2" ? 2 : n === "C1" ? 1 : 0;
              const faltan = SKILL_C2_PRACTICAS - s.practicasValidadas;
              return (
                <div key={s.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-[13px]">
                    <span className="font-medium">{s.nombre}</span>
                    <span className="text-muted">
                      {n}
                      {n === "C1" && faltan > 0 ? ` · faltan ${faltan} prácticas` : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-[3px]">
                    {NIVELES.map((x, i) => (
                      <span key={x} className={`h-1.5 rounded-full ${i < lleno ? "bg-ink" : "bg-line"}`} />
                    ))}
                  </div>
                </div>
              );
            })}
            <span className="border-t border-line-soft pt-2.5 text-xs text-muted">C1 formada · C2 {SKILL_C2_PRACTICAS} prácticas validadas · C3 certificada</span>
          </section>
        </TechTag>

        <section className={`${card} flex flex-col gap-3`}>
          <h2 className="text-[15px] font-semibold">Ruta a la certificación</h2>
          <ol className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">✓</span>
              Formación: {state.base.microcursos} microcursos
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white">✓</span>
              Práctica validada por la promotora
            </li>
            <li className="flex items-start gap-3">
              <span className="h-6 w-6 shrink-0 rounded-full border-2 border-ink bg-white" />
              <span className="flex flex-col gap-2">
                <span className="font-semibold">Evaluación con CONOCER</span>
                <span className="text-xs text-muted">Con un evaluador acreditado (estándar por definir con la alianza)</span>
                <button type="button" onClick={() => avisar("Evaluación agendada (simulado)")} className="self-start rounded-[10px] bg-ink px-3.5 py-2 text-[13px] font-semibold text-white">
                  Agendar
                </button>
              </span>
            </li>
            <li className="flex items-center gap-3 text-muted">
              <span className="h-6 w-6 rounded-full border-[1.5px] border-dashed border-[#b5b5b2]" />
              Certificada
            </li>
          </ol>
        </section>

        <section className={`${card} flex items-center justify-between gap-3`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">Acompañar a familias cercanas</span>
            <span className="text-xs text-muted">{puedeOfrecer ? "Ya puedes activarlo: tienes nivel C2" : "Se activa con nivel C2"}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.ofrecerAcompanamiento}
            aria-label="Acompañar a familias cercanas"
            disabled={!puedeOfrecer}
            onClick={() => setOfrecer(!state.ofrecerAcompanamiento)}
            className={`relative h-[26px] w-11 shrink-0 rounded-full transition disabled:opacity-40 ${state.ofrecerAcompanamiento ? "bg-ink" : "bg-[#d4d4d2]"}`}
          >
            <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-all ${state.ofrecerAcompanamiento ? "left-[21px]" : "left-[3px]"}`} />
          </button>
        </section>
      </div>
    </>
  );
}

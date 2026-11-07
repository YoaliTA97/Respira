"use client";

import Link from "next/link";
import { useDemo } from "@/lib/store";
import { proyecciones, NIVEL_UI } from "@/lib/rules";
import { AppHeader } from "@/components/AppHeader";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, StatusPill, btnPrimary, btnSecondary, card } from "@/components/ui";

const VERIF: Record<string, { texto: string; tone: "neutral" | "green" | "outline" }> = {
  V0: { texto: "autorreportado", tone: "outline" },
  V1: { texto: "con evidencia", tone: "outline" },
  V2: { texto: "confirmado", tone: "green" },
  V3: { texto: "validado por promotora", tone: "green" },
};

export default function InicioPage() {
  const { state } = useDemo();
  const p = proyecciones(state);
  const eventos = [...state.events].filter((e) => e.casoId === state.casoId).reverse().slice(0, 4);
  const max = Math.max(...p.cargaSemana.map((c) => c.horas));
  const top = [...p.cargaSemana].sort((a, b) => b.horas - a.horas)[0];
  const pctTop = Math.round((top.horas / p.totalSemana) * 100);
  const ui = NIVEL_UI[p.estadoHoy.nivel];

  return (
    <>
      <AppHeader
        sub={`Red familiar · ${state.members.length} integrantes`}
        titulo={`Cuidado de ${state.recipient.nombre}`}
        right={
          <div className="flex">
            {state.members.slice(0, 4).map((m, i) => (
              <span key={m.id} className={`rounded-full border-2 border-canvas ${i ? "-ml-2" : ""}`}>
                <Avatar nombre={m.nombre} tone={m.tono} size={30} />
              </span>
            ))}
          </div>
        }
      />
      <div className="flex flex-col gap-3">
        <TechTag k="estado-semaforo">
          <section className={`${card} flex flex-col gap-2.5 ${ui.line}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-muted">Estado de hoy</span>
              <StatusPill nivel={p.estadoHoy.nivel} />
            </div>
            <p className="text-base font-semibold tracking-tight">{p.estadoHoy.titulo}</p>
            <p className="text-sm leading-relaxed text-muted">{p.estadoHoy.detalle}</p>
            {p.estadoHoy.nivel === "verde" ? (
              <Link href="/app/whatsapp" className={`${btnSecondary} self-start`}>
                Contar cómo amaneció por WhatsApp
              </Link>
            ) : (
              p.alertaCaso?.estado === "confirmada" && (
                <span className={`${btnPrimary} self-start`}>Ver cómo llegar</span>
              )
            )}
          </section>
        </TechTag>

        <TechTag k="bitacora">
          <section className={`${card} flex flex-col gap-3`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold">Qué se ha hecho</h2>
              <Link href="/app/registrar" className="text-[13px] font-medium text-muted">
                Registrar
              </Link>
            </div>
            <ul className="flex flex-col gap-3">
              {eventos.map((e) => {
                const m = state.members.find((x) => x.id === e.actorId);
                const v = VERIF[e.verificacion];
                return (
                  <li key={e.id} className="flex items-start gap-2.5">
                    <Avatar nombre={e.actorNombre} tone={m?.tono ?? "mid"} size={28} />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm leading-snug">{e.detalle}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        {e.hora} · {e.canal === "whatsapp" ? "WhatsApp" : "app"}
                        <Pill tone={v.tone}>{e.confirmadoPor && e.verificacion === "V2" ? `confirmado por ${e.confirmadoPor}` : v.texto}</Pill>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </TechTag>

        <TechTag k="carga-persona">
          <section className={`${card} flex flex-col gap-3`}>
            <h2 className="text-[15px] font-semibold">Quién cuida esta semana</h2>
            <div className="flex flex-col gap-2.5 text-[13px]">
              {p.cargaSemana.map((c) => (
                <div key={c.member.id} className="grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-2.5">
                  <span>{c.member.nombre}</span>
                  <span className="flex h-2 rounded-full bg-chip">
                    <span
                      className={`rounded-full ${c.member.tono === "dark" ? "bg-tone-dark" : c.member.tono === "mid" ? "bg-tone-mid" : "bg-[#a8a8a5]"}`}
                      style={{ width: `${(c.horas / max) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold">{Math.round(c.horas)} h</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-3">
              <span className="text-[13px] text-muted">
                {top.member.nombre} cubre el {pctTop}% de las horas
              </span>
              <Link href="/app/turnos" className={`${btnSecondary} shrink-0 whitespace-nowrap`}>
                Repartir turnos
              </Link>
            </div>
          </section>
        </TechTag>

        <TechTag k="pendientes">
          <section className={`${card} flex flex-col gap-2.5`}>
            <h2 className="text-[15px] font-semibold">Pendiente hoy</h2>
            <div className="flex justify-between text-sm">
              <span>Medicamento · 14:00</span>
              <span className="text-muted">Rosa</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Glucosa · 22:00</span>
              <span className="text-muted">Jorge</span>
            </div>
          </section>
        </TechTag>
      </div>
    </>
  );
}

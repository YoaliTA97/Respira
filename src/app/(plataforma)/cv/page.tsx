"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/lib/db";
import { DIAS, nombreEquipo } from "@/lib/catalogos";
import { cvCuidado, horasDisponibles, perfilVisible } from "@/lib/calculos";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, Tarjeta, btnPrimary, btnSecondary } from "@/components/ui";

const TONO_NIVEL = { Certificada: "dark", Verificada: "green", "Por aprender": "outline" } as const;

// CV de cuidado: estado actual de conocimientos y habilidades de quien cuida, con la evidencia que lo respalda.
function Cv() {
  const { db, ahora, usuario } = useData();
  const q = useSearchParams();
  if (!usuario) return null;
  const pedido = q.get("u");
  const otra = pedido ? db.usuarios.find((u) => u.id === pedido) : null;
  const persona = otra && (otra.id === usuario.id || perfilVisible(db, usuario.id, otra)) ? otra : usuario;
  const propio = persona.id === usuario.id;
  const cv = cvCuidado(db, persona.id, ahora);
  const certs = cv.certificaciones.filter((c) => c.estado === "certificada" || c.estado === "agendada");
  const verificadas = cv.habilidades.filter((h) => h.nivel !== "Por aprender");
  const porAprender = cv.habilidades.filter((h) => h.nivel === "Por aprender");

  return (
    <TechTag k="cv-cuidado">
      <article className="mx-auto flex max-w-[860px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={propio ? "/perfil" : "/red"} className="text-sm text-muted">← {propio ? "Mi perfil" : "Red de cuidado"}</Link>
          <div className="flex gap-2">
            {propio && <button type="button" className={btnSecondary} onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/cv?u=${persona.id}`)}>Copiar enlace</button>}
            <button type="button" className={btnPrimary} onClick={() => window.print()}>Descargar PDF</button>
          </div>
        </div>

        <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white p-6">
          <Avatar nombre={persona.nombre} tono={persona.tono} size={64} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">CV de cuidado</span>
            <h1 className="text-3xl font-semibold tracking-tight">{persona.nombre}</h1>
            <span className="text-sm text-muted">
              {persona.alcaldia || "Ciudad de México"} · {horasDisponibles(persona.disponibilidad)} h por semana disponibles{persona.fuente === "sidecu" ? " · identificada por SIDECU" : ""}
            </span>
            <div className="flex flex-wrap gap-1.5">{persona.roles.map((r) => <Pill key={r} tono="outline">{r}</Pill>)}</div>
          </div>
        </header>

        {persona.bio && <p className="px-1 text-[15px] text-ink-2">{persona.bio}</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { v: `${cv.horas} h`, t: "de cuidado registradas" },
            { v: cv.relevos, t: `relevos cubiertos${cv.relevosRed ? ` (${cv.relevosRed} en la red)` : ""}` },
            { v: cv.registros, t: "reportes de signos" },
            { v: `${cv.confirmadas}/${cv.evidencias}`, t: "evidencias confirmadas" },
          ].map((k) => (
            <div key={k.t} className="rounded-2xl border border-line bg-white p-4">
              <p className="text-2xl font-semibold tracking-tight">{k.v}</p>
              <p className="text-xs text-muted">{k.t}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Tarjeta titulo="Habilidades de cuidado">
            <ul className="flex flex-col divide-y divide-line-soft">
              {verificadas.map((h) => (
                <li key={h.tutorial.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="flex flex-col">
                    <span className="font-medium">{h.tutorial.habilidad}</span>
                    <span className="text-xs text-muted">{h.practicas} prácticas registradas · aval {h.tutorial.institucion}</span>
                  </span>
                  <Pill tono={TONO_NIVEL[h.nivel]}>{h.nivel}</Pill>
                </li>
              ))}
              {verificadas.length === 0 && <li className="py-2 text-sm text-muted">Aún sin habilidades verificadas.</li>}
            </ul>
            {(persona.experiencia ?? []).length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
                <span className="text-xs font-semibold text-muted">Experiencia declarada (sin verificar)</span>
                <div className="flex flex-wrap gap-1.5">{(persona.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}</div>
              </div>
            )}
            {propio && porAprender.length > 0 && (
              <p className="border-t border-line-soft pt-3 text-xs text-muted print:hidden">
                Por aprender: {porAprender.map((h) => h.tutorial.habilidad).join(", ")}. <Link href="/capacitacion" className="font-semibold underline">Ir a capacitación</Link>
              </p>
            )}
          </Tarjeta>

          <div className="flex flex-col gap-4">
            <Tarjeta titulo="Certificaciones">
              {certs.length === 0 && <p className="text-sm text-muted">Sin certificaciones todavía.</p>}
              {certs.map((c) => (
                <div key={c.def.id} className="flex flex-col gap-0.5 text-sm">
                  <span className="flex items-center justify-between gap-2"><span className="font-semibold">{c.def.nombre}</span><Pill tono={c.estado === "certificada" ? "dark" : "amber"}>{c.estado}</Pill></span>
                  <span className="text-xs text-muted">{c.def.institucion}{c.fecha ? ` · ${c.fecha}` : c.cita ? ` · ${c.cita}` : ""}</span>
                </div>
              ))}
            </Tarjeta>
            <Tarjeta titulo="Disponibilidad">
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {DIAS.map((d, i) => {
                  const r = persona.disponibilidad[i]?.[0];
                  return (
                    <div key={d} className={`rounded-lg px-0.5 py-1.5 ${r ? "bg-primario text-white" : "bg-chip text-muted"}`}>
                      <div className="font-semibold">{d}</div>
                      <div>{r ? `${r.inicio}-${r.fin}` : "—"}</div>
                    </div>
                  );
                })}
              </div>
              {persona.ofreceAyuda.activo && <p className="text-xs text-muted">Ayuda en la red a {persona.ofreceAyuda.radioKm} km · {persona.ofreceAyuda.modalidades.join(", ")}</p>}
              {(persona.equipo ?? []).length > 0 && <p className="text-xs text-muted">Puede prestar: {(persona.equipo ?? []).map(nombreEquipo).join(", ")}</p>}
            </Tarjeta>
            {propio && cv.ingreso > 0 && (
              <Tarjeta titulo="Ingreso por cuidado">
                <p className="text-2xl font-semibold">${cv.ingreso.toLocaleString("es-MX")} MXN</p>
                <p className="text-xs text-muted">Relevos pagados e intercambios monetarios dentro de Respira.</p>
              </Tarjeta>
            )}
          </div>
        </div>
        <p className="px-1 text-xs text-muted">Generado por Respira con lo registrado en la plataforma: horas de relevos cubiertos, prácticas en reportes, evidencias confirmadas por otra persona y certificaciones de instituciones aliadas.</p>
      </article>
    </TechTag>
  );
}

export default function CvPage() {
  return (
    <Suspense fallback={null}>
      <Cv />
    </Suspense>
  );
}

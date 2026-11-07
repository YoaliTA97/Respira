"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/lib/db";
import { AVISOS, CERTIFICABLES, GUIAS_MEDICAS, TUTORIALES, type Tutorial } from "@/lib/catalogos";
import { completados, estadoCertificaciones, horasCuidado, tutorialesRecomendados } from "@/lib/calculos";
import { GuiaModal } from "@/components/GuiaVideo";
import { TechTag } from "@/components/TechTag";
import { Encabezado, Modal, Pill, Tarjeta, btnPrimary, btnSecondary } from "@/components/ui";

function TutorialModal({ t, onCerrar }: { t: Tutorial; onCerrar: () => void }) {
  const { completarTutorial } = useData();
  const [resp, setResp] = useState<Record<number, number>>({});
  const [revisado, setRevisado] = useState(false);
  const correctas = t.quiz.filter((q, i) => resp[i] === q.correcta).length;
  const aprobado = correctas === t.quiz.length;
  return (
    <Modal abierto onCerrar={onCerrar} titulo={t.titulo}>
      <div className="flex flex-col gap-4">
        <div className="flex aspect-video items-center justify-center rounded-2xl bg-realce p-4 text-center text-sm text-muted">
          Videotutorial de {t.duracionMin} min · por producir con la institución aliada
        </div>
        <p className="text-xs text-muted">Aval: {t.institucion}</p>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">{t.pasos.map((p) => <li key={p}>{p}</li>)}</ol>
        <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
          <span className="text-sm font-semibold">Evaluación</span>
          {t.quiz.map((q, i) => (
            <fieldset key={q.pregunta} className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm">{q.pregunta}</legend>
              {q.opciones.map((o, j) => (
                <label key={o} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${revisado && j === q.correcta ? "border-green-ink" : "border-line"}`}>
                  <input type="radio" name={`q${i}`} checked={resp[i] === j} onChange={() => setResp({ ...resp, [i]: j })} className="h-4 w-4 accent-primario" />
                  {o}
                </label>
              ))}
            </fieldset>
          ))}
          {revisado && <p className={`text-sm font-medium ${aprobado ? "text-green-ink" : "text-red-ink"}`}>{aprobado ? "Aprobado: la habilidad se suma a tu perfil." : `${correctas} de ${t.quiz.length} correctas. Revisa los pasos e inténtalo de nuevo.`}</p>}
          {!revisado || !aprobado ? (
            <button type="button" className={btnPrimary} disabled={Object.keys(resp).length < t.quiz.length} onClick={() => setRevisado(true)}>Revisar respuestas</button>
          ) : (
            <button type="button" className={btnPrimary} onClick={() => { completarTutorial(t.id); onCerrar(); }}>Agregar «{t.habilidad}» a mi perfil</button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Capacitacion() {
  const { db, ahora, usuario, familia, paciente, agendarCertificacion, aprobarCertificacion } = useData();
  const q = useSearchParams();
  const [abierto, setAbierto] = useState<string | null>(q.get("t"));
  const [guia, setGuia] = useState<string | null>(q.get("g"));
  if (!usuario) return null;
  const hechos = completados(db, usuario.id);
  const recomendados = tutorialesRecomendados(db, familia?.id ?? null);
  const otros = TUTORIALES.filter((t) => !recomendados.some((r) => r.id === t.id));
  const certs = estadoCertificaciones(db, usuario.id, ahora);
  const horas = horasCuidado(db, usuario.id, ahora);
  const practicas = (id: string) => db.progreso.find((p) => p.usuarioId === usuario.id && p.tutorialId === id)?.practicas ?? 0;
  const tAbierto = TUTORIALES.find((t) => t.id === abierto);

  const tarjeta = (t: Tutorial) => (
    <button key={t.id} type="button" onClick={() => setAbierto(t.id)} className="flex flex-col gap-1.5 rounded-xl border border-line bg-white p-4 text-left transition hover:border-primario">
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{t.duracionMin} min · {t.habilidad}</span>
        {hechos.has(t.id) ? <Pill tono="green">Completado</Pill> : <Pill tono="outline">Pendiente</Pill>}
      </span>
      <span className="flex gap-1">
        {t.soloFamiliar ? <Pill tono="amber">Ruta A · solo para tu familiar</Pill> : <Pill>Ruta A y B</Pill>}
      </span>
      <span className="font-semibold">{t.titulo}</span>
      {hechos.has(t.id) && <span className="text-xs text-muted">{practicas(t.id)} prácticas registradas en reportes</span>}
    </button>
  );

  return (
    <>
      <Encabezado sub="Ruta A: cuidar a mi familiar · Ruta B: cuidar como oficio, con certificación oficial del CONOCER" titulo="Capacitación y certificación" />

      <TechTag k="tutoriales">
        <Tarjeta titulo={paciente ? `Recomendados para el cuidado de ${paciente.nombre}` : "Tutoriales recomendados"}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{recomendados.map(tarjeta)}</div>
          {otros.length > 0 && (
            <>
              <span className="mt-2 text-sm font-semibold">Otros tutoriales</span>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{otros.map(tarjeta)}</div>
            </>
          )}
        </Tarjeta>
      </TechTag>

      <TechTag k="guias-medicas" className="mt-4">
        <section id="guias" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[15px] font-semibold">Guías del médico: cómo medir y valorar en casa</h2>
            <p className="text-sm text-muted">Videos cortos de un médico aliado para validar el estado de salud: uso del baumanómetro, glucómetro y oxímetro, y cómo valorar el estado de conciencia.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {GUIAS_MEDICAS.map((g) => (
              <button key={g.id} type="button" onClick={() => setGuia(g.id)} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 text-left transition hover:border-primario">
                <span className="grid aspect-video place-items-center rounded-lg bg-realce">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2e3f8f" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M10 8.5v7l6-3.5z" fill="#2e3f8f" /></svg>
                </span>
                <span className="text-sm font-semibold leading-snug">{g.titulo}</span>
                <span className="flex items-center justify-between gap-2 text-xs text-muted">
                  {g.minutos} min
                  {db.videosGuia[g.id] ? <Pill tono="green">Video listo</Pill> : <Pill tono="outline">Video por entregar</Pill>}
                </span>
              </button>
            ))}
          </div>
        </section>
      </TechTag>

      <TechTag k="certificaciones" className="mt-4">
        <Tarjeta titulo="Certificaciones">
          <p className="text-sm text-muted">Al acumular habilidades y horas se desbloquea la certificación. Se obtiene en una demostración presencial corta; no es un curso largo.</p>
          <p className="rounded-xl bg-canvas p-3 text-xs text-muted">{AVISOS.noRemuneracion}</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {certs.map((c) => (
              <div key={c.def.id} className={`flex flex-col gap-3 rounded-2xl border p-4 ${c.estado === "certificada" ? "border-primario" : "border-line"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tracking-tight">{c.def.nombre}</span>
                    <span className="text-xs text-muted">{c.def.institucion}</span>
                  </div>
                  <Pill tono={c.estado === "certificada" ? "dark" : c.estado === "disponible" ? "green" : c.estado === "agendada" ? "amber" : "outline"}>{c.estado}</Pill>
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {c.def.requiere.map((r) => {
                    const t = TUTORIALES.find((x) => x.id === r)!;
                    const ok = !c.faltan.includes(r);
                    return (
                      <li key={r} className="flex items-center justify-between gap-2">
                        <span className={ok ? "" : "text-muted"}>{ok ? "✓" : "○"} {t.habilidad}</span>
                        {!ok && <button type="button" className="text-xs font-semibold underline" onClick={() => setAbierto(r)}>Aprender</button>}
                      </li>
                    );
                  })}
                  <li className={c.horasOk ? "" : "text-muted"}>{c.horasOk ? "✓" : "○"} {Math.min(c.horas, c.def.horasMinimas)} de {c.def.horasMinimas} horas de cuidado registradas</li>
                </ul>
                <p className="text-xs text-muted">{c.def.modalidad}</p>
                {c.estado === "disponible" && (
                  <p className="rounded-xl bg-green-bg p-3 text-sm font-semibold text-green-ink">Ya cubres lo que pide el {c.def.nombre.split(" · ")[0]}. ¿Quieres agendar tu evaluación?</p>
                )}
                {c.estado === "disponible" && (
                  <div className="flex flex-wrap gap-2">
                    {["Sábado 10:00 a 12:00 (en domicilio)", "Domingo 10:00 a 12:00"].map((s) => (
                      <button key={s} type="button" className={btnSecondary} onClick={() => agendarCertificacion(c.def.id, s)}>Agendar {s}</button>
                    ))}
                  </div>
                )}
                {c.estado === "agendada" && (
                  <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3 text-sm">
                    <span>Demostración presencial: <span className="font-semibold">{c.cita}</span></span>
                    <button type="button" className={`${btnPrimary} self-start`} onClick={() => aprobarCertificacion(c.def.id)}>Registrar resultado aprobado</button>
                    <span className="text-xs text-muted">En el MVP este resultado lo registra la institución certificadora, no la cuidadora.</span>
                  </div>
                )}
                {c.estado === "certificada" && (
                  <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3 text-sm">
                    <span className="font-semibold">Lo que te abre esta certificación</span>
                    <ul className="list-disc pl-5 text-ink-2">{c.def.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>
                    <span className="text-xs text-muted">Los convenios de empleo, facturación y seguridad social están por definir con las alianzas.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Tarjeta>
      </TechTag>

      <TechTag k="certificaciones" className="mt-4">
        <Tarjeta titulo="Qué se puede certificar para trabajar y qué es solo para cuidar en casa">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Habilidad</th>
                  <th className="py-2 pr-3 font-medium">Cuidado en casa (Ruta A)</th>
                  <th className="py-2 pr-3 font-medium">Certificable para trabajar (Ruta B)</th>
                  <th className="py-2 pr-3 font-medium">Estándar o nota</th>
                </tr>
              </thead>
              <tbody>
                {CERTIFICABLES.map((c) => (
                  <tr key={c.habilidad} className="border-b border-line-soft last:border-0">
                    <td className="py-2 pr-3">{c.habilidad}</td>
                    <td className="py-2 pr-3">{c.casa}</td>
                    <td className={`py-2 pr-3 ${c.trabajo === "No" ? "text-red-ink" : ""}`}>{c.trabajo}</td>
                    <td className="py-2 pr-3 text-muted">{c.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">Por validar con asesoría legal y médica (práctica de enfermería, NOM-019-SSA3-2013).</p>
        </Tarjeta>
      </TechTag>

      <TechTag k="trayectoria" className="mt-4">
        <Tarjeta titulo="Pasaporte de Cuidado" accion={<a href="/pasaporte" className="text-sm font-medium text-muted">Ver mi pasaporte</a>}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{horas}</p><p className="text-xs text-muted">horas de cuidado</p></div>
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{hechos.size}</p><p className="text-xs text-muted">habilidades</p></div>
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{certs.filter((c) => c.estado === "certificada").length}</p><p className="text-xs text-muted">certificaciones</p></div>
          </div>
          <p className="text-sm text-muted">Tus horas y módulos se acumulan aquí y respaldan tu evaluación del CONOCER.</p>
          <div className="grid gap-2 border-t border-line-soft pt-3 text-sm md:grid-cols-3">
            {[
              { r: "independiente", t: "A · Trabajadora independiente", d: "Incorporación voluntaria al IMSS; Respira separa de cada pago tu apartado para la cuota." },
              { r: "cooperativa", t: "B · Cooperativa de cuidadoras", d: "Socias de una cooperativa en el régimen obligatorio; contratos con alcaldías y empresas." },
              { r: "plataforma", t: "C · Plataformas digitales (a validar)", d: "Si aplica, Respira registra y paga la cuota patronal." },
            ].map((x) => (
              <div key={x.r} className={`rounded-xl border p-3 ${usuario.seguridadSocial?.ruta === x.r ? "border-primario bg-realce/50" : "border-line"}`}>
                <p className="font-semibold">{x.t}</p>
                <p className="text-xs text-muted">{x.d}</p>
                {usuario.seguridadSocial?.ruta === x.r && <p className="mt-1 text-xs font-semibold text-primario">Tu ruta · apartado {usuario.seguridadSocial.apartadoPct}% de cada pago</p>}
              </div>
            ))}
          </div>
        </Tarjeta>
      </TechTag>

      {tAbierto && <TutorialModal key={tAbierto.id} t={tAbierto} onCerrar={() => setAbierto(null)} />}
      {guia && GUIAS_MEDICAS.some((g) => g.id === guia) && <GuiaModal key={guia} id={guia} onCerrar={() => setGuia(null)} />}
    </>
  );
}

export default function CapacitacionPage() {
  return (
    <Suspense fallback={null}>
      <Capacitacion />
    </Suspense>
  );
}

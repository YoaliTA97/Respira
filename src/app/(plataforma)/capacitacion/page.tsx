"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useData } from "@/lib/db";
import { TUTORIALES, type Tutorial } from "@/lib/catalogos";
import { completados, estadoCertificaciones, horasCuidado, tutorialesRecomendados } from "@/lib/calculos";
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
      <span className="font-semibold">{t.titulo}</span>
      {hechos.has(t.id) && <span className="text-xs text-muted">{practicas(t.id)} prácticas registradas en reportes</span>}
    </button>
  );

  return (
    <>
      <Encabezado sub="Habilidades que vas sumando según lo que necesita la persona que cuidas" titulo="Capacitación y certificación" />

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

      <TechTag k="certificaciones" className="mt-4">
        <Tarjeta titulo="Certificaciones">
          <p className="text-sm text-muted">Al acumular habilidades y horas se desbloquea la certificación. Se obtiene en una demostración presencial corta; no es un curso largo.</p>
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
                  <div className="flex flex-wrap gap-2">
                    {["Sábado 10:00 a 12:00", "Domingo 10:00 a 12:00"].map((s) => (
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

      <TechTag k="trayectoria" className="mt-4">
        <Tarjeta titulo="Tu trayectoria">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{horas}</p><p className="text-xs text-muted">horas de cuidado</p></div>
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{hechos.size}</p><p className="text-xs text-muted">habilidades</p></div>
            <div className="rounded-xl bg-canvas p-3"><p className="text-2xl font-semibold">{certs.filter((c) => c.estado === "certificada").length}</p><p className="text-xs text-muted">certificaciones</p></div>
          </div>
          <p className="text-sm text-muted">El trabajo de cuidado que registras se convierte en evidencia para certificarte y para el empleo formal, con seguro y pensión.</p>
        </Tarjeta>
      </TechTag>

      {tAbierto && <TutorialModal key={tAbierto.id} t={tAbierto} onCerrar={() => setAbierto(null)} />}
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

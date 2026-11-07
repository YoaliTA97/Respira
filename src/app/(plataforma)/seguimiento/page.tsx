"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { reducirImagen } from "@/lib/imagen";
import { puedeVerHistorial } from "@/lib/calculos";
import { imagenEjemplo } from "@/lib/seed";
import type { Evidencia } from "@/lib/types";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Encabezado, NivelPill, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const TIPOS: { v: Evidencia["tipo"]; t: string }[] = [
  { v: "lectura", t: "Lectura de un equipo" },
  { v: "herida", t: "Herida o piel" },
  { v: "medicamento", t: "Toma de medicamento" },
  { v: "receta", t: "Receta o indicación médica" },
  { v: "relevo", t: "Entrega de relevo" },
  { v: "otro", t: "Otro" },
];

type Fila = { id: string; fecha: string; quien: string; que: string; como: string; nivel?: "verde" | "amarillo" | "rojo"; evidencia?: Evidencia };

// Bitácora de seguimiento: todo lo que se registra, quién y cómo, con la evidencia que lo respalda.
// Lo que confirma otra persona de la familia cuenta como evidencia verificada para la trayectoria.
function Seguimiento() {
  const { db, usuario, familia, paciente, puede, agregarEvidencia, confirmarEvidencia } = useData();
  const [nueva, setNueva] = useState<{ tipo: Evidencia["tipo"]; descripcion: string; foto?: string }>({ tipo: "lectura", descripcion: "" });
  const [ver, setVer] = useState<string | null>(null);
  if (!familia || !usuario || !paciente) return null;
  if (!puedeVerHistorial(paciente, usuario.id)) {
    return (
      <>
        <Encabezado sub="Lo que se registra del cuidado y lo que lo respalda" titulo="Seguimiento y evidencia" />
        <Vacio>{paciente.nombre} no comparte su historial contigo por ahora. Lo decide en su sección Mi voz.</Vacio>
      </>
    );
  }
  const nombre = (id: string) => db.usuarios.find((u) => u.id === id)?.nombre.split(" ")[0] ?? "—";
  const evidencias = db.evidencias.filter((e) => e.familiaId === familia.id);
  const conFoto = (lecturaId: string) => evidencias.find((e) => e.lecturaId === lecturaId);

  const filas: Fila[] = [
    ...db.lecturas
      .filter((l) => l.familiaId === familia.id)
      .map((l) => ({
        id: l.id, fecha: l.fechaHora, quien: l.porUsuarioId, nivel: l.nivel, evidencia: conFoto(l.id),
        que: [l.fc && `FC ${l.fc}`, l.fr && `FR ${l.fr}`, l.paSist && `PA ${l.paSist}/${l.paDiast ?? "?"}`, l.glucosa && `Glucosa ${l.glucosa}`, l.dolor !== undefined && `Dolor ${l.dolor}/10`, l.conciencia, ...(l.sintomas ?? [])].filter(Boolean).join(" · ") || "Reporte sin signos",
        como: l.origen === "valoración" ? "Valoración en checklist" : l.origen === "nota de voz" ? "Nota de voz" : "Formulario de signos",
      })),
    ...evidencias.filter((e) => !e.lecturaId).map((e) => ({ id: e.id, fecha: e.fechaHora, quien: e.porUsuarioId, que: e.descripcion, como: TIPOS.find((t) => t.v === e.tipo)?.t ?? "Evidencia", evidencia: e })),
    ...db.tomas
      .filter((t) => db.medicamentos.some((m) => m.id === t.medicamentoId && m.familiaId === familia.id))
      .map((t) => ({ id: t.id, fecha: t.registradaEn, quien: t.porUsuarioId, que: `${db.medicamentos.find((m) => m.id === t.medicamentoId)?.nombre} de las ${t.horario}: ${t.estado}`, como: "Registro de toma" })),
    ...db.relevos
      .filter((r) => r.familiaId === familia.id && r.recibidoEn && r.asignadoA)
      .map((r) => ({ id: r.id, fecha: r.recibidoEn!, quien: r.asignadoA!, que: `Recibió a ${paciente.nombre} en su relevo`, como: "Entrega de relevo" })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  const total = filas.length;
  const respaldadas = filas.filter((f) => f.evidencia).length;
  const confirmadas = evidencias.filter((e) => e.confirmadaPor).length;
  const porConfirmar = evidencias.filter((e) => !e.confirmadaPor && e.porUsuarioId !== usuario.id);
  const evVer = evidencias.find((e) => e.id === ver);

  return (
    <>
      <Encabezado sub={`Lo que se registra del cuidado de ${paciente.nombre} y lo que lo respalda`} titulo="Seguimiento y evidencia" />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { t: "Registros", v: total, d: "Signos, valoraciones, tomas y relevos" },
          { t: "Con evidencia", v: respaldadas, d: "Con foto o documento adjunto" },
          { t: "Confirmadas", v: confirmadas, d: "Por otra persona de la familia" },
          { t: "Por confirmar", v: porConfirmar.length, d: "Te toca revisarlas" },
        ].map((k) => (
          <div key={k.t} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
            <span className="text-sm text-muted">{k.t}</span>
            <span className="text-[26px] font-semibold tracking-tight">{k.v}</span>
            <span className="text-xs text-muted">{k.d}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <TechTag k="evidencia">
          <Tarjeta titulo="Bitácora">
            {filas.length === 0 && <Vacio>Aún no hay registros.</Vacio>}
            <ul className="flex flex-col divide-y divide-line-soft">
              {filas.slice(0, 40).map((f) => (
                <li key={f.id} className="flex flex-wrap items-start gap-3 py-3 text-sm">
                  {f.evidencia?.foto ? (
                    <button type="button" onClick={() => setVer(f.evidencia!.id)} aria-label="Ver evidencia" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- foto local en data URL */}
                      <img src={f.evidencia.foto} alt="" className="h-12 w-16 rounded-lg border border-line object-cover" />
                    </button>
                  ) : (
                    <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-chip text-xs text-muted">{f.evidencia ? "doc" : "—"}</span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{f.que}</span>
                      {f.nivel && <NivelPill nivel={f.nivel} />}
                    </span>
                    <span className="text-muted">{f.fecha.slice(0, 10)} {f.fecha.slice(11, 16)} · {nombre(f.quien)} · {f.como}</span>
                  </span>
                  {f.evidencia &&
                    (f.evidencia.confirmadaPor ? (
                      <Pill tono="green">Confirmó {nombre(f.evidencia.confirmadaPor)}</Pill>
                    ) : f.evidencia.porUsuarioId !== usuario.id ? (
                      <button type="button" className={btnSecondary} onClick={() => confirmarEvidencia(f.evidencia!.id)}>Confirmar</button>
                    ) : (
                      <Pill tono="outline">Por confirmar</Pill>
                    ))}
                </li>
              ))}
            </ul>
          </Tarjeta>
        </TechTag>

        <div className="flex flex-col gap-4">
          {puede("registrar") && (
            <TechTag k="evidencia">
              <Tarjeta titulo="Agregar evidencia">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ev-tipo" className={label}>¿Qué respalda?</label>
                  <select id="ev-tipo" className={input} value={nueva.tipo} onChange={(e) => setNueva({ ...nueva, tipo: e.target.value as Evidencia["tipo"] })}>
                    {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ev-desc" className={label}>Descripción</label>
                  <input id="ev-desc" className={input} placeholder="Ej. curación de la herida del talón" value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {nueva.foto && (
                    // eslint-disable-next-line @next/next/no-img-element -- foto local en data URL
                    <img src={nueva.foto} alt="Foto por guardar" className="h-16 w-24 rounded-lg border border-line object-cover" />
                  )}
                  <label className={`${btnSecondary} cursor-pointer`}>
                    {nueva.foto ? "Cambiar foto" : "Tomar o subir foto"}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const a = e.target.files?.[0]; e.target.value = ""; if (a) setNueva({ ...nueva, foto: await reducirImagen(a) }); }} />
                  </label>
                </div>
                <button type="button" className="self-start text-sm font-semibold text-primario underline" onClick={() => setNueva({ tipo: "lectura", descripcion: "Glucómetro al recibirla: 124 mg/dL", foto: imagenEjemplo("124", "mg/dL") })}>
                  Llenar con ejemplo
                </button>
                <button
                  type="button"
                  className={`${btnPrimary} self-start`}
                  disabled={!nueva.descripcion.trim()}
                  onClick={() => {
                    agregarEvidencia({ tipo: nueva.tipo, descripcion: nueva.descripcion.trim(), foto: nueva.foto });
                    setNueva({ tipo: nueva.tipo, descripcion: "" });
                  }}
                >
                  Guardar evidencia
                </button>
                <p className="text-xs text-muted">Queda con tu nombre, la fecha y la hora. En la demo la foto se guarda reducida en este navegador.</p>
              </Tarjeta>
            </TechTag>
          )}

          <Tarjeta titulo="Revisión semanal de enfermería">
            {(() => {
              const hace7 = new Date(Date.parse(`${(db.lecturas.at(-1)?.fechaHora ?? "2026-01-01T00:00:00").slice(0, 10)}T00:00:00`) - 7 * 86400000).toISOString().slice(0, 10);
              const recs = db.mensajes.filter((m) => m.familiaId === familia.id && m.de === "asistente" && m.tipo === "respuesta" && m.fechaHora.slice(0, 10) >= hace7);
              return (
                <>
                  <p className="text-sm text-ink-2">En el piloto, una enfermera aliada revisa cada semana las recomendaciones del asistente y los casos dudosos.</p>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-canvas p-2.5"><p className="text-xl font-semibold">{recs.length}</p><p className="text-xs text-muted">recomendaciones esta semana</p></div>
                    <div className="rounded-xl bg-canvas p-2.5"><p className="text-xl font-semibold">{recs.filter((m) => m.nivel !== "verde").length}</p><p className="text-xs text-muted">casos para revisar</p></div>
                  </div>
                  <p className="text-xs text-muted">Simulado en la demo: la revisión y el registro de la enfermera llegan con el piloto.</p>
                </>
              );
            })()}
          </Tarjeta>

          <Tarjeta titulo="Por qué importa">
            <p className="text-sm text-ink-2">Cada registro con evidencia y confirmado por otra persona respalda las horas y habilidades de quien cuida. Es la base para certificarse y acceder a empleo formal, seguro y pensión.</p>
          </Tarjeta>
        </div>
      </div>

      {evVer?.foto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setVer(null)}>
          <figure className="flex max-w-lg flex-col gap-2 rounded-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- foto local en data URL */}
            <img src={evVer.foto} alt={evVer.descripcion} className="max-h-[60vh] w-full rounded-2xl object-contain" />
            <figcaption className="text-sm">
              <span className="font-semibold">{evVer.descripcion}</span>
              <span className="block text-muted">{evVer.fechaHora.slice(0, 10)} {evVer.fechaHora.slice(11, 16)} · {nombre(evVer.porUsuarioId)}{evVer.confirmadaPor ? ` · confirmó ${nombre(evVer.confirmadaPor)}` : ""}</span>
            </figcaption>
            <div className="flex gap-2">
              {!evVer.confirmadaPor && evVer.porUsuarioId !== usuario.id && <button type="button" className={btnPrimary} onClick={() => confirmarEvidencia(evVer.id)}>Confirmar</button>}
              <button type="button" className={btnSecondary} onClick={() => setVer(null)}>Cerrar</button>
            </div>
          </figure>
        </div>
      )}
    </>
  );
}

export default function SeguimientoPage() {
  return (
    <RequiereFamilia>
      <Seguimiento />
    </RequiereFamilia>
  );
}

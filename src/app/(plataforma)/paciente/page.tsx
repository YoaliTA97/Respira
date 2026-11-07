"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { condicionCatalogo } from "@/lib/catalogos";
import { fechaISO } from "@/lib/seed";
import type { Umbrales } from "@/lib/types";
import { CamposCondicion } from "@/components/CamposCondicion";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Encabezado, NivelPill, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

function PacienteVista() {
  const { db, ahora, paciente, familia, puede, actualizarPaciente, agregarMedicamento, quitarMedicamento, marcarToma } = useData();
  const [u, setU] = useState<Umbrales | null>(paciente?.umbrales ?? null);
  const [med, setMed] = useState({ nombre: "", dosis: "", horarios: "08:00", indicaciones: "" });
  if (!paciente || !familia || !u) return null;
  const admin = puede("administrar");
  const registra = puede("registrar");
  const hoy = fechaISO(ahora);
  const meds = db.medicamentos.filter((m) => m.familiaId === familia.id);
  const lecturas = db.lecturas.filter((l) => l.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));
  const propias = paciente.condiciones.filter((c) => !condicionCatalogo(c));
  const fila = (k: keyof Umbrales, t: string, conMin: boolean) => (
    <div className="grid grid-cols-[1fr_88px_88px] items-center gap-2 text-sm">
      <span>{t}</span>
      {conMin ? (
        <input aria-label={`${t} mínimo`} type="number" disabled={!admin} className={`${input} h-9`} value={(u[k] as { min: number }).min} onChange={(e) => setU({ ...u, [k]: { ...u[k], min: Number(e.target.value) } })} />
      ) : (
        <span className="text-center text-muted">—</span>
      )}
      <input aria-label={`${t} máximo`} type="number" disabled={!admin} className={`${input} h-9`} value={u[k].max} onChange={(e) => setU({ ...u, [k]: { ...u[k], max: Number(e.target.value) } })} />
    </div>
  );

  return (
    <>
      <Encabezado sub={`${familia.nombre} · persona cuidada`} titulo={`${paciente.nombre}, ${paciente.edad} años`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TechTag k="perfil-paciente">
          <Tarjeta titulo="Condición y lo que se vigila">
            <CamposCondicion valor={{ condiciones: paciente.condiciones, signos: paciente.signos, alergias: paciente.alergias ?? [] }} onChange={actualizarPaciente} disabled={!admin} />
            {paciente.evento && (
              <p className="rounded-xl bg-canvas p-3 text-sm">
                <span className="font-semibold">Caída el {paciente.evento.fecha}.</span> {paciente.evento.descripcion} {paciente.evento.lesion}
              </p>
            )}
            <p className="text-sm text-muted">Movilidad: {paciente.movilidad}. {paciente.notas}</p>
            <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
              <span className="text-sm font-semibold">Prevención</span>
              <ul className="list-disc pl-5 text-sm text-ink-2">
                {paciente.condiciones.flatMap((c) => condicionCatalogo(c)?.prevencion.slice(0, 2) ?? []).map((p) => <li key={p}>{p}</li>)}
                {propias.length > 0 && <li>{propias.join(", ")}: sigan las indicaciones de su médico y anoten en el chat cualquier cambio; el asistente lo toma en cuenta.</li>}
              </ul>
            </div>
            {!admin && <p className="text-xs text-muted">Solo quien coordina puede cambiar la condición, los signos y las alergias.</p>}
          </Tarjeta>
        </TechTag>

        <TechTag k="umbrales">
          <Tarjeta titulo="Umbrales de alerta">
            <p className="text-sm text-muted">La trifecta (frecuencia cardiaca, respiratoria y presión fuera de rango a la vez) dispara la alerta médica por WhatsApp. Valores de ejemplo: deben validarse con su médico.</p>
            <div className="grid grid-cols-[1fr_88px_88px] gap-2 text-xs text-muted"><span /><span className="text-center">Mínimo</span><span className="text-center">Máximo</span></div>
            {fila("fc", "Frecuencia cardiaca (lpm)", true)}
            {fila("fr", "Frecuencia respiratoria (rpm)", true)}
            {fila("paSist", "Presión sistólica (mmHg)", true)}
            {fila("glucosa", "Glucosa (mg/dL)", true)}
            {fila("temperatura", "Temperatura (°C)", false)}
            {admin && <button type="button" className={`${btnPrimary} self-start`} onClick={() => actualizarPaciente({ umbrales: u })}>Guardar umbrales</button>}
          </Tarjeta>
        </TechTag>

        <TechTag k="medicacion">
          <Tarjeta titulo="Medicación">
            {meds.length === 0 && <Vacio>Sin medicamentos.</Vacio>}
            <ul className="flex flex-col divide-y divide-line-soft">
              {meds.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex flex-col text-sm">
                      <span className="font-semibold">{m.nombre}</span>
                      <span className="text-muted">{m.dosis}{m.indicaciones ? ` · ${m.indicaciones}` : ""}</span>
                    </span>
                    {admin && <button type="button" className="text-xs text-muted underline" onClick={() => quitarMedicamento(m.id)}>Quitar</button>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.horarios.map((h) => {
                      const t = db.tomas.find((x) => x.medicamentoId === m.id && x.fecha === hoy && x.horario === h);
                      const quien = db.usuarios.find((x) => x.id === t?.porUsuarioId)?.nombre.split(" ")[0];
                      return (
                        <span key={h} className="flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-1.5 text-xs">
                          <span className="font-semibold">{h}</span>
                          {t ? (
                            <Pill tono={t.estado === "dada" ? "green" : "amber"}>{t.estado} · {quien}</Pill>
                          ) : registra ? (
                            <>
                              <button type="button" className="font-semibold underline" onClick={() => marcarToma(m.id, h, "dada")}>Dada</button>
                              <button type="button" className="text-muted underline" onClick={() => marcarToma(m.id, h, "omitida")}>Omitida</button>
                            </>
                          ) : (
                            <span className="text-muted">pendiente</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
            {admin && (
              <div className="grid gap-2 border-t border-line-soft pt-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <div className="flex flex-col gap-1.5"><label htmlFor="mn" className={label}>Medicamento</label><input id="mn" className={input} value={med.nombre} onChange={(e) => setMed({ ...med, nombre: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="md" className={label}>Dosis</label><input id="md" className={input} placeholder="Según receta" value={med.dosis} onChange={(e) => setMed({ ...med, dosis: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="mh" className={label}>Horarios</label><input id="mh" className={input} value={med.horarios} onChange={(e) => setMed({ ...med, horarios: e.target.value })} /></div>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={!med.nombre.trim()}
                  onClick={() => {
                    agregarMedicamento({ nombre: med.nombre.trim(), dosis: med.dosis || "Según receta", horarios: med.horarios.split(",").map((h) => h.trim()).filter(Boolean), indicaciones: med.indicaciones });
                    setMed({ nombre: "", dosis: "", horarios: "08:00", indicaciones: "" });
                  }}
                >
                  Agregar
                </button>
              </div>
            )}
          </Tarjeta>
        </TechTag>

        <TechTag k="historial">
          <Tarjeta titulo="Historial de signos">
            {lecturas.length === 0 && <Vacio>Sin lecturas.</Vacio>}
            <ul className="flex max-h-[420px] flex-col divide-y divide-line-soft overflow-y-auto">
              {lecturas.map((l) => (
                <li key={l.id} className="flex flex-col gap-1 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{l.fechaHora.slice(0, 10)} {l.fechaHora.slice(11, 16)} · {db.usuarios.find((x) => x.id === l.porUsuarioId)?.nombre.split(" ")[0]}</span>
                    <NivelPill nivel={l.nivel} />
                  </div>
                  <span className="text-muted">
                    {[l.fc && `FC ${l.fc}`, l.fr && `FR ${l.fr}`, l.paSist && `PA ${l.paSist}/${l.paDiast ?? "?"}`, l.glucosa && `Glucosa ${l.glucosa}`, l.dolor !== undefined && `Dolor ${l.dolor}/10`, l.conciencia].filter(Boolean).join(" · ")}
                    {l.senales.length ? ` · señales: ${l.senales.join(", ")}` : ""} · {l.origen}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </TechTag>
      </div>
    </>
  );
}

export default function PacientePage() {
  return (
    <RequiereFamilia>
      <PacienteVista />
    </RequiereFamilia>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALCALDIAS, PARENTESCOS } from "@/lib/catalogos";
import { useData, type FamiliaNueva } from "@/lib/db";
import { ROL_TEXTO } from "@/lib/types";
import { CamposCondicion } from "@/components/CamposCondicion";
import { InvitarPersona } from "@/components/InvitarPersona";
import { TechTag } from "@/components/TechTag";
import { Encabezado, Pill, Segmentado, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const PASOS = ["La persona que cuidas", "Medicación", "Tu familia", "Permisos"];

const EJEMPLO: FamiliaNueva = {
  nombre: "Familia Ramírez",
  alcaldia: "Coyoacán",
  parentesco: "Hija",
  paciente: {
    nombre: "Carmen", edad: 81, sexo: "mujer", condiciones: ["diabetes", "caida", "Osteoporosis"], signos: ["glucosa", "fc", "fr", "pa", "conciencia", "dolor"], alergias: ["Sulfas"], evento: "Se cayó al levantarse de la cama.", lesion: "Golpe en la cadera; sin fractura.", movilidad: "con apoyo",
  },
  medicamentos: [
    { nombre: "Metformina", dosis: "Según receta", horarios: ["08:00", "20:00"] },
    { nombre: "Insulina", dosis: "Según receta", horarios: ["22:00"] },
  ],
  invitaciones: [
    { nombre: "Luis Ramírez", telefono: "5520000002", parentesco: "Hijo", rol: "cuidado", principal: true, genero: "hombre" },
    { nombre: "Sofía Ramírez", telefono: "5520000003", parentesco: "Nieta", rol: "apoyo", principal: false, genero: "mujer" },
  ],
  consentimiento: { registro: true, alertasWhatsApp: true, indicadores: true },
};

export default function NuevaFamilia() {
  const { db, usuario, crearFamilia } = useData();
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState<FamiliaNueva>({
    nombre: "", alcaldia: usuario?.alcaldia || "Coyoacán", parentesco: "Hija",
    paciente: { nombre: "", edad: 75, sexo: "mujer", condiciones: [], signos: [], alergias: [], evento: "", lesion: "", movilidad: "con apoyo" },
    medicamentos: [], invitaciones: [], consentimiento: { registro: true, alertasWhatsApp: true, indicadores: true },
  });
  const [med, setMed] = useState({ nombre: "", dosis: "", horarios: "08:00" });
  if (!usuario) return null;

  const valido = [f.paciente.nombre.trim() && f.paciente.condiciones.length > 0 && f.paciente.edad >= 60, true, true, f.consentimiento.registro][paso];
  const pac = (x: Partial<FamiliaNueva["paciente"]>) => setF({ ...f, paciente: { ...f.paciente, ...x } });
  const terminar = () => {
    crearFamilia({ ...f, nombre: f.nombre.trim() || `Familia de ${f.paciente.nombre}` });
    router.push("/familia");
  };

  return (
    <>
      <Encabezado
        sub="El espacio es privado: solo entran las personas que invites"
        titulo="Crear un espacio familiar"
        acciones={<button type="button" className={btnSecondary} onClick={() => setF(EJEMPLO)}>Llenar con ejemplo (caída y diabetes)</button>}
      />
      <div className="mb-5 flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1.5">{PASOS.map((s, i) => <span key={s} className={`h-1 rounded-full ${i <= paso ? "bg-primario" : "bg-[#dfe2ee]"}`} />)}</div>
        <div className="grid grid-cols-4 gap-1.5 text-xs text-muted">{PASOS.map((s, i) => <span key={s} className={i === paso ? "font-semibold text-ink" : ""}>{s}</span>)}</div>
      </div>

      <TechTag k="registro-familia">
        <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-6 md:p-8">
          {paso === 0 && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">¿A quién cuidan?</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5"><label htmlFor="pn" className={label}>Nombre</label><input id="pn" className={input} value={f.paciente.nombre} onChange={(e) => pac({ nombre: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="pe" className={label}>Edad</label><input id="pe" type="number" min={60} className={input} value={f.paciente.edad} onChange={(e) => pac({ edad: Number(e.target.value) })} /></div>
                <div className="flex flex-col gap-1.5"><span className={label}>Sexo</span><Segmentado etiqueta="Sexo" valor={f.paciente.sexo} onChange={(v) => pac({ sexo: v })} opciones={[{ v: "mujer", t: "Mujer" }, { v: "hombre", t: "Hombre" }]} /></div>
              </div>
              <CamposCondicion valor={f.paciente} onChange={pac} />
              {f.paciente.condiciones.includes("caida") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><label htmlFor="ev" className={label}>¿Qué pasó en la caída?</label><input id="ev" className={input} value={f.paciente.evento} onChange={(e) => pac({ evento: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><label htmlFor="le" className={label}>Lesión o indicación médica</label><input id="le" className={input} value={f.paciente.lesion} onChange={(e) => pac({ lesion: e.target.value })} /></div>
                </div>
              )}
              <div className="flex flex-col gap-1.5"><span className={label}>Movilidad</span><Segmentado etiqueta="Movilidad" valor={f.paciente.movilidad} onChange={(v) => pac({ movilidad: v })} opciones={[{ v: "independiente", t: "Independiente" }, { v: "con apoyo", t: "Con apoyo" }, { v: "en cama", t: "En cama" }]} /></div>
              <div className="grid gap-4 border-t border-line-soft pt-4 md:grid-cols-3">
                <div className="flex flex-col gap-1.5"><label htmlFor="par" className={label}>Tú eres su…</label><input id="par" list="parentescos" className={input} value={f.parentesco} onChange={(e) => setF({ ...f, parentesco: e.target.value })} /><datalist id="parentescos">{PARENTESCOS.map((x) => <option key={x} value={x} />)}</datalist></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="fn" className={label}>Nombre del espacio</label><input id="fn" className={input} placeholder="Ej. Familia Ramírez" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="al" className={label}>Alcaldía del hogar</label><select id="al" className={input} value={f.alcaldia} onChange={(e) => setF({ ...f, alcaldia: e.target.value })}>{ALCALDIAS.map((a) => <option key={a}>{a}</option>)}</select></div>
              </div>
            </>
          )}

          {paso === 1 && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">Medicación indicada</h2>
              <ul className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line">
                {f.medicamentos.length === 0 && <li className="p-4 text-sm text-muted">Sin medicamentos todavía.</li>}
                {f.medicamentos.map((m, i) => (
                  <li key={`${m.nombre}-${i}`} className="flex items-center justify-between gap-3 p-4 text-sm">
                    <span><span className="font-semibold">{m.nombre}</span> · {m.dosis || "Según receta"} · {m.horarios.join(", ")}</span>
                    <button type="button" className="text-muted underline" onClick={() => setF({ ...f, medicamentos: f.medicamentos.filter((_, j) => j !== i) })}>Quitar</button>
                  </li>
                ))}
              </ul>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <div className="flex flex-col gap-1.5"><label htmlFor="mn" className={label}>Medicamento</label><input id="mn" className={input} value={med.nombre} onChange={(e) => setMed({ ...med, nombre: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="md" className={label}>Dosis</label><input id="md" className={input} placeholder="Según receta" value={med.dosis} onChange={(e) => setMed({ ...med, dosis: e.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="mh" className={label}>Horarios (coma)</label><input id="mh" className={input} value={med.horarios} onChange={(e) => setMed({ ...med, horarios: e.target.value })} /></div>
                <button type="button" className={btnSecondary} disabled={!med.nombre.trim()} onClick={() => { setF({ ...f, medicamentos: [...f.medicamentos, { nombre: med.nombre.trim(), dosis: med.dosis, horarios: med.horarios.split(",").map((h) => h.trim()).filter(Boolean) }] }); setMed({ nombre: "", dosis: "", horarios: "08:00" }); }}>Agregar</button>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Invita a tu familia</h2>
                <p className="mt-1 text-muted">Si ya usan Respira, se vincula su perfil con su teléfono; si no, se les crea uno al aceptar. Tú quedas con rol de coordinación.</p>
              </div>
              <ul className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line">
                <li className="flex items-center justify-between gap-3 p-4 text-sm"><span className="font-semibold">{usuario.nombre} (tú)</span><Pill tono="dark">Coordinación</Pill></li>
                {f.invitaciones.map((x, i) => (
                  <li key={x.telefono} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <span><span className="font-semibold">{x.nombre}</span> · {x.parentesco} · {x.telefono}{db.usuarios.some((u) => u.telefono === x.telefono) ? " · perfil vinculado" : ""}</span>
                    <span className="flex items-center gap-2">
                      <Pill tono="outline">{ROL_TEXTO[x.rol].t}</Pill>
                      {x.principal && <Pill>Recibe alertas</Pill>}
                      <button type="button" className="text-muted underline" onClick={() => setF({ ...f, invitaciones: f.invitaciones.filter((_, j) => j !== i) })}>Quitar</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-dashed border-[#c9cde0] p-4">
                <InvitarPersona
                  textoBoton="Agregar"
                  principalPorDefecto
                  excluirTelefonos={f.invitaciones.map((x) => x.telefono)}
                  onAgregar={(i) => setF({ ...f, invitaciones: [...f.invitaciones, i] })}
                />
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">Tú decides qué se comparte</h2>
              <div className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line">
                {[
                  { k: "registro" as const, t: "Guardar el estado y lo que registra la familia", d: "Necesario para usar el espacio." },
                  { k: "alertasWhatsApp" as const, t: "Enviar alertas médicas por WhatsApp a los principales", d: "Cuando se cumple la trifecta u otra señal de emergencia." },
                  { k: "indicadores" as const, t: "Sumar a indicadores sin nombres", d: "Horas de cuidado agregadas para políticas públicas." },
                ].map((o) => (
                  <label key={o.k} className="flex cursor-pointer gap-3 p-4">
                    <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primario" checked={f.consentimiento[o.k]} onChange={(e) => setF({ ...f, consentimiento: { ...f.consentimiento, [o.k]: e.target.checked } })} />
                    <span className="flex flex-col"><span className="text-[15px] font-semibold">{o.t}</span><span className="text-sm text-muted">{o.d}</span></span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-muted">Respira no da diagnósticos. Si algo es urgente, indica a dónde acudir.</p>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-5">
            {paso > 0 ? <button type="button" className={btnSecondary} onClick={() => setPaso(paso - 1)}>Atrás</button> : <Link href="/inicio" className={btnSecondary}>Cancelar</Link>}
            {paso < PASOS.length - 1 ? (
              <button type="button" className={btnPrimary} disabled={!valido} onClick={() => setPaso(paso + 1)}>Continuar</button>
            ) : (
              <button type="button" className={btnPrimary} disabled={!valido} onClick={terminar}>Crear el espacio</button>
            )}
          </div>
        </section>
      </TechTag>
    </>
  );
}

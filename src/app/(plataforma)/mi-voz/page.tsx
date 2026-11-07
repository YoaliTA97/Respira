"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/db";
import { ACTIVIDADES_APORTE, ANIMOS, METAS_SUGERIDAS, SUENOS, telefonoLimpio } from "@/lib/catalogos";
import { reducirImagen } from "@/lib/imagen";
import { fechaISO } from "@/lib/seed";
import type { VozPersona } from "@/lib/types";
import { FichaEmergencia } from "@/components/FichaEmergencia";
import { NotaVoz } from "@/components/NotaVoz";
import { enlaceUnion } from "@/components/QrFamilia";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Chip, Encabezado, Etiquetas, Modal, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const VACIA: VozPersona = { gustos: [], rutinas: [], noQuiero: [], permisos: {}, metas: [] };

async function aDataUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;
  try {
    const b = await (await fetch(url)).blob();
    if (b.size > 1_500_000) return undefined;
    return await new Promise<string>((ok) => {
      const r = new FileReader();
      r.onload = () => ok(r.result as string);
      r.readAsDataURL(b);
    });
  } catch {
    return undefined;
  }
}

function MiVoz() {
  const { db, ahora, usuario, familia, paciente, membresia, integrantes, guardarVoz, darAccesoPersona, registrarSentir, marcarMeta, registrarAporte } = useData();
  const [grabar, setGrabar] = useState(false);
  const [tel, setTel] = useState("");
  const [sentir, setSentir] = useState<{ dolor: number | null; animo: string; sueno: string; nota: string }>({ dolor: null, animo: "", sueno: "", nota: "" });
  const [nuevaMeta, setNuevaMeta] = useState("");
  const [aporte, setAporte] = useState({ actividad: ACTIVIDADES_APORTE[0], horas: 1 });
  const [dec, setDec] = useState(() => paciente?.voz?.decisiones ?? { clinica: "", acompanante: "", voluntadAnticipada: false, notas: "", fecha: "" });
  if (!usuario || !familia || !paciente || !membresia) return null;

  const voz: VozPersona = { ...VACIA, ...paciente.voz };
  const nombre = paciente.nombre;
  const esElla = paciente.usuarioId === usuario.id;
  const coordina = membresia.rol === "coordinacion";
  const edita = esElla || coordina;
  const acompanaMetas = esElla || ["coordinacion", "cuidado", "apoyo"].includes(membresia.rol);
  const hoy = fechaISO(ahora);
  const perfilElla = db.usuarios.find((u) => u.id === paciente.usuarioId);
  const sentires = db.sentires.filter((x) => x.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));
  const aportes = db.aportes.filter((x) => x.familiaId === familia.id).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const otros = integrantes.filter((i) => i.usuario.id !== paciente.usuarioId);
  const yo = esElla ? "Mi" : "Su";

  const ejemplo = () =>
    guardarVoz({
      palabras: {
        texto: `Soy ${nombre}. Me gusta levantarme temprano y desayunar con calma. Quiero seguir haciendo mis cosas aunque sea despacio. No me gusta que decidan por mí sin preguntarme ni que me apuren al bañarme.`,
        fecha: hoy, porUsuarioId: usuario.id,
      },
      gustos: ["Desayunar con calma", "Escuchar música de su época", "Platicar con sus nietos"],
      rutinas: ["Se levanta a las 7:00", "Siesta después de comer", "Cena ligera a las 19:30"],
      noQuiero: ["Que la apuren al bañarse", "Que decidan por ella sin preguntarle"],
      metas: voz.metas.length ? voz.metas : [{ id: `meta-${Date.now()}`, texto: "Caminar 10 minutos", hechas: [] }],
      decisiones: voz.decisiones ?? { clinica: "Su clínica de siempre", acompanante: "Quien coordina la familia", voluntadAnticipada: false, notas: "", fecha: hoy },
    });

  return (
    <>
      <Encabezado
        sub={esElla ? "Tu voz en tu cuidado: lo que te gusta, lo que decides y lo que aportas" : `${nombre} no es solo “paciente”: es un nodo con voz propia en la familia`}
        titulo={esElla ? "Mi voz" : `La voz de ${nombre}`}
        acciones={edita && !voz.palabras ? <button type="button" className={btnSecondary} onClick={ejemplo}>Llenar con ejemplo</button> : undefined}
      />

      {!paciente.usuarioId && coordina && (
        <TechTag k="union-qr" className="mb-4">
          <section className="flex flex-col gap-3 rounded-2xl border border-primario/30 bg-realce/50 p-5">
            <span className="text-[15px] font-semibold">Dale acceso a {nombre}</span>
            <p className="text-sm text-ink-2">Con su propia cuenta graba su perfil en sus palabras, reporta cómo se siente, decide quién ve su historial y deja sus decisiones de salud. Si no tiene teléfono, puede usar el de alguien de la familia.</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="voz-tel" className={label}>Teléfono de {nombre}</label>
                <input id="voz-tel" inputMode="tel" className={`${input} w-52`} placeholder="10 dígitos" value={tel} onChange={(e) => setTel(telefonoLimpio(e.target.value))} />
              </div>
              <button type="button" className={btnSecondary} onClick={() => setTel(`55${String(30000000 + Math.floor(Math.random() * 9999999)).padStart(8, "0")}`)}>Usar teléfono de ejemplo</button>
              <button type="button" className={btnPrimary} disabled={tel.length !== 10} onClick={() => darAccesoPersona(tel)}>Dar acceso</button>
            </div>
          </section>
        </TechTag>
      )}
      {perfilElla && !esElla && familia.codigo && (
        <p className="mb-4 text-sm text-muted">
          {nombre} entra con su teléfono ({perfilElla.telefono}).{" "}
          <a href={enlaceUnion(familia.codigo, perfilElla.id)} target="_blank" rel="noopener" className="font-semibold text-primario underline">Abrir como {nombre} en otra pestaña</a>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <TechTag k="mi-voz" className="lg:col-span-2">
          <Tarjeta titulo={`${yo} perfil, en ${esElla ? "mis" : "sus"} palabras`} accion={edita ? <button type="button" className="text-sm font-medium text-muted" onClick={() => setGrabar(true)}>{voz.palabras ? "Grabar de nuevo" : "Grabar nota de voz"}</button> : undefined}>
            {voz.palabras ? (
              <figure className="flex flex-col gap-2 rounded-2xl bg-canvas p-4">
                <blockquote className="text-[17px] leading-relaxed">“{voz.palabras.texto}”</blockquote>
                {voz.palabras.audio && <audio controls src={voz.palabras.audio} className="w-full" />}
                <figcaption className="text-xs text-muted">Grabado el {voz.palabras.fecha} · cada cuidadora lo ve al recibir su turno</figcaption>
              </figure>
            ) : (
              <Vacio>{edita ? `Graba una nota de voz con ${esElla ? "tus" : "sus"} rutinas, gustos y lo que no ${esElla ? "quieres" : "quiere"}.` : `${nombre} aún no graba su perfil.`}</Vacio>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {([
                ["gustos", "Lo que me gusta"],
                ["rutinas", "Mis rutinas"],
                ["noQuiero", "Lo que no quiero"],
              ] as const).map(([k, t]) => (
                <div key={k} className="flex flex-col gap-2">
                  <span className={label}>{t}</span>
                  <Etiquetas etiqueta={t} valor={voz[k]} onChange={(v) => guardarVoz({ [k]: v })} disabled={!edita} placeholder="Agregar" />
                </div>
              ))}
            </div>
          </Tarjeta>
        </TechTag>

        <TechTag k="mi-voz">
          <Tarjeta titulo="¿Cómo me siento hoy?">
            {esElla ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Dolor de 0 a 10</span>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button key={i} type="button" aria-pressed={sentir.dolor === i} onClick={() => setSentir({ ...sentir, dolor: i })} className={`h-10 w-10 rounded-xl border text-sm font-semibold ${sentir.dolor === i ? "border-primario bg-primario text-white" : "border-line"}`}>{i}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Ánimo</span>
                  <div className="flex flex-wrap gap-1.5">{ANIMOS.map((a) => <Chip key={a} activo={sentir.animo === a} onClick={() => setSentir({ ...sentir, animo: a })}>{a}</Chip>)}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Sueño</span>
                  <div className="flex flex-wrap gap-1.5">{SUENOS.map((a) => <Chip key={a} activo={sentir.sueno === a} onClick={() => setSentir({ ...sentir, sueno: a })}>{a}</Chip>)}</div>
                </div>
                <input aria-label="Algo más" className={input} placeholder="¿Algo más que quieras contar?" value={sentir.nota} onChange={(e) => setSentir({ ...sentir, nota: e.target.value })} />
                <button
                  type="button"
                  className={`${btnPrimary} self-start`}
                  disabled={sentir.dolor === null || !sentir.animo || !sentir.sueno}
                  onClick={() => {
                    registrarSentir({ dolor: sentir.dolor!, animo: sentir.animo, sueno: sentir.sueno, nota: sentir.nota });
                    setSentir({ dolor: null, animo: "", sueno: "", nota: "" });
                  }}
                >
                  Contarle a mi familia
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted">Lo reporta {nombre} desde su cuenta, si puede. La familia lo ve aquí y en el seguimiento.</p>
            )}
            <ul className="flex flex-col divide-y divide-line-soft border-t border-line-soft pt-2">
              {sentires.slice(0, 4).map((x) => (
                <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>{x.fechaHora.slice(0, 10) === hoy ? "Hoy" : x.fechaHora.slice(0, 10)} {x.fechaHora.slice(11, 16)}{x.nota ? ` · ${x.nota}` : ""}</span>
                  <span className="flex gap-1"><Pill tono={x.dolor >= 7 ? "red" : x.dolor >= 4 ? "amber" : "neutral"}>Dolor {x.dolor}</Pill><Pill>{x.animo}</Pill><Pill tono="outline">{x.sueno}</Pill></span>
                </li>
              ))}
              {sentires.length === 0 && <li className="py-2 text-sm text-muted">Sin reportes todavía.</li>}
            </ul>
          </Tarjeta>
        </TechTag>

        <TechTag k="mi-voz">
          <Tarjeta titulo="Yo decido sobre mis datos">
            <p className="text-sm text-muted">Quién puede ver {esElla ? "mi" : "su"} historial de signos, valoraciones y evidencias. {esElla ? "Puedes retirar el permiso cuando quieras." : `Solo ${nombre} cambia estos permisos.`}</p>
            <ul className="flex flex-col divide-y divide-line-soft">
              {otros.map(({ usuario: u, membresia: m }) => {
                const permitido = voz.permisos[u.id] !== false;
                return (
                  <li key={u.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <Avatar nombre={u.nombre} tono={u.tono} size={30} />
                    <span className="flex flex-1 flex-col"><span className="font-medium">{u.nombre}</span><span className="text-xs text-muted">{m.parentesco}</span></span>
                    {esElla ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" role="switch" className="h-5 w-9 accent-primario" checked={permitido} onChange={(e) => guardarVoz({ permisos: { ...voz.permisos, [u.id]: e.target.checked } })} />
                        {permitido ? "Puede ver" : "No puede ver"}
                      </label>
                    ) : (
                      <Pill tono={permitido ? "green" : "amber"}>{permitido ? "Puede ver" : "Sin permiso"}</Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        </TechTag>

        <TechTag k="mi-voz">
          <Tarjeta titulo="Mis decisiones de salud">
            {edita ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5"><label htmlFor="d-clin" className={label}>¿A qué clínica quiero ir?</label><input id="d-clin" className={input} value={dec.clinica} onChange={(e) => setDec({ ...dec, clinica: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5"><label htmlFor="d-acom" className={label}>¿Quién me acompaña?</label><input id="d-acom" className={input} value={dec.acompanante} onChange={(e) => setDec({ ...dec, acompanante: e.target.value })} /></div>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primario" checked={dec.voluntadAnticipada} onChange={(e) => setDec({ ...dec, voluntadAnticipada: e.target.checked })} />
                  <span>Tengo voluntad anticipada <span className="text-muted">(la Ciudad de México tiene una ley de voluntad anticipada; el documento se firma ante notario o en formato de una institución de salud)</span></span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {dec.documento && (
                    // eslint-disable-next-line @next/next/no-img-element -- foto local en data URL
                    <img src={dec.documento} alt="Documento de voluntad anticipada" className="h-16 w-24 rounded-lg border border-line object-cover" />
                  )}
                  <label className={`${btnSecondary} cursor-pointer`}>
                    {dec.documento ? "Cambiar foto del documento" : "Adjuntar foto del documento"}
                    <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const a = e.target.files?.[0]; e.target.value = ""; if (a) setDec({ ...dec, documento: await reducirImagen(a, 900) }); }} />
                  </label>
                </div>
                <input aria-label="Notas" className={input} placeholder="Notas: indicaciones o dónde está el original" value={dec.notas} onChange={(e) => setDec({ ...dec, notas: e.target.value })} />
                <button type="button" className={`${btnPrimary} self-start`} onClick={() => guardarVoz({ decisiones: { ...dec, fecha: hoy } })}>Guardar mis decisiones</button>
              </div>
            ) : (
              <p className="text-sm text-muted">Las registra {nombre} o quien coordina con ella. Aparecen en la ficha de emergencia:</p>
            )}
            <FichaEmergencia compacta />
          </Tarjeta>
        </TechTag>

        <TechTag k="mi-voz">
          <Tarjeta titulo="Metas de autonomía" accion={<Link href="/capacitacion?t=autonomia" className="text-sm font-medium text-muted">Cómo acompañar</Link>}>
            <p className="text-sm text-muted">Metas pequeñas que {esElla ? "haces" : `${nombre} hace`} por sí misma. Acompañar sin hacer por ella.</p>
            <ul className="flex flex-col divide-y divide-line-soft">
              {voz.metas.map((m) => {
                const semana = m.hechas.filter((f) => f >= fechaISO(new Date(ahora.getTime() - 6 * 86400000))).length;
                const hecha = m.hechas.includes(hoy);
                return (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <span className="flex flex-col"><span className="font-medium">{m.texto}</span><span className="text-xs text-muted">{semana} de 7 días esta semana</span></span>
                    {acompanaMetas ? (
                      <button type="button" aria-pressed={hecha} onClick={() => marcarMeta(m.id)} className={hecha ? btnPrimary : btnSecondary}>{hecha ? "Hoy lo logró ✓" : "Hoy lo logró"}</button>
                    ) : (
                      <Pill tono={hecha ? "green" : "outline"}>{hecha ? "Hoy sí" : "Pendiente hoy"}</Pill>
                    )}
                  </li>
                );
              })}
              {voz.metas.length === 0 && <li className="py-2 text-sm text-muted">Sin metas todavía.</li>}
            </ul>
            {edita && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input aria-label="Nueva meta" list="metas-sug" className={input} placeholder="Ej. caminar 10 minutos" value={nuevaMeta} onChange={(e) => setNuevaMeta(e.target.value)} />
                  <datalist id="metas-sug">{METAS_SUGERIDAS.map((m) => <option key={m} value={m} />)}</datalist>
                  <button type="button" className={btnSecondary} disabled={!nuevaMeta.trim()} onClick={() => { guardarVoz({ metas: [...voz.metas, { id: `meta-${Date.now()}`, texto: nuevaMeta.trim(), hechas: [] }] }); setNuevaMeta(""); }}>Agregar</button>
                </div>
              </div>
            )}
          </Tarjeta>
        </TechTag>

        <TechTag k="mi-voz">
          <Tarjeta titulo="Lo que yo aporto">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-semibold tracking-tight">{perfilElla?.saldoHoras ?? 0} h</span>
              <span className="text-sm text-muted">en el banco de tiempo de {esElla ? "Respira" : nombre}</span>
            </div>
            <p className="text-sm text-muted">{esElla ? "Tus" : "Sus"} horas también cuentan: acompañar a los nietos, llamadas de compañía a otras personas mayores, enseñar una receta.</p>
            <ul className="flex flex-col divide-y divide-line-soft">
              {aportes.slice(0, 4).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 py-2 text-sm"><span>{a.actividad}</span><span className="text-muted">{a.horas} h · {a.fecha}</span></li>
              ))}
            </ul>
            {edita && paciente.usuarioId && (
              <div className="flex flex-wrap items-end gap-2 border-t border-line-soft pt-3">
                <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                  <label htmlFor="ap-act" className={label}>Actividad</label>
                  <input id="ap-act" list="ap-sug" className={input} value={aporte.actividad} onChange={(e) => setAporte({ ...aporte, actividad: e.target.value })} />
                  <datalist id="ap-sug">{ACTIVIDADES_APORTE.map((a) => <option key={a} value={a} />)}</datalist>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ap-h" className={label}>Horas</label>
                  <input id="ap-h" type="number" min={0.5} step={0.5} className={`${input} w-24`} value={aporte.horas} onChange={(e) => setAporte({ ...aporte, horas: Number(e.target.value) })} />
                </div>
                <button type="button" className={btnPrimary} disabled={!aporte.actividad.trim() || aporte.horas <= 0} onClick={() => registrarAporte(aporte.actividad.trim(), aporte.horas)}>Sumar horas</button>
              </div>
            )}
            {edita && !paciente.usuarioId && <p className="text-xs text-muted">Dale acceso a {nombre} para que sus horas cuenten en su banco de tiempo.</p>}
          </Tarjeta>
        </TechTag>
      </div>

      {grabar && (
        <Modal abierto onCerrar={() => setGrabar(false)} titulo={`${yo} perfil, en ${esElla ? "mis" : "sus"} palabras`}>
          <p className="mb-3 text-sm text-muted">Cuenta rutinas, gustos y lo que no {esElla ? "quieres" : "quiere"}. Se guarda la transcripción y, si se puede, el audio.</p>
          <NotaVoz
            onCancelar={() => setGrabar(false)}
            onListo={async (texto, audioUrl) => {
              setGrabar(false);
              guardarVoz({ palabras: { texto, audio: await aDataUrl(audioUrl), fecha: hoy, porUsuarioId: usuario.id } });
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default function MiVozPage() {
  return (
    <RequiereFamilia>
      <MiVoz />
    </RequiereFamilia>
  );
}

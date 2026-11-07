"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { CATEGORIAS_GASTO } from "@/lib/catalogos";
import { resumenGastos } from "@/lib/calculos";
import { reducirImagen } from "@/lib/imagen";
import { fechaISO, imagenEjemplo } from "@/lib/seed";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";
import { Medidor, Segmentadas } from "@/components/Graficas";
import { SIDECU } from "@/lib/catalogos";

const peso = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

// Gastos del cuidado: qué se gasta (medicinas, despensa, consultas...), quién lo paga y cómo quedan
// las cuentas según el reparto que acordó la familia.
function Gastos() {
  const { db, ahora, usuario, familia, paciente, puede, agregarGasto, quitarGasto, guardarReparto, configurarGastos } = useData();
  const [editarTope, setEditarTope] = useState(false);
  const [tope, setTope] = useState(String(familia?.topeGastoMes ?? ""));
  const [periodo, setPeriodo] = useState<30 | 7>(30);
  const [nuevo, setNuevo] = useState({ categoria: CATEGORIAS_GASTO[0], concepto: "", monto: "", pagoPor: usuario?.id ?? "", comprobante: "" });
  const [editarReparto, setEditarReparto] = useState(false);
  const [reparto, setReparto] = useState<Record<string, number>>({});
  if (!familia || !usuario || !paciente) return null;
  const registra = puede("registrar");
  const desde = new Date(ahora);
  desde.setDate(desde.getDate() - periodo);
  const r = resumenGastos(db, familia.id, fechaISO(desde));
  const max = Math.max(1, ...r.porCategoria.map(([, v]) => v));
  const pagadores = [...r.filas.map((f) => f.usuario), ...(paciente.usuarioId ? db.usuarios.filter((u) => u.id === paciente.usuarioId) : [])];
  const nombre = (id: string) => (id === paciente.usuarioId ? `${paciente.nombre} (su pensión)` : db.usuarios.find((u) => u.id === id)?.nombre.split(" ")[0] ?? "—");

  return (
    <>
      <Encabezado
        sub="Medicinas, despensa, consultas, transporte y relevos pagados: quién paga y cómo quedan las cuentas"
        titulo="Gastos del cuidado"
        acciones={
          <div role="group" aria-label="Periodo" className="flex gap-1 rounded-xl bg-chip p-1">
            {([30, 7] as const).map((p) => (
              <button key={p} type="button" aria-pressed={periodo === p} onClick={() => setPeriodo(p)} className={`min-h-[36px] rounded-lg px-3 text-sm font-semibold ${periodo === p ? "bg-white shadow-sm" : "text-muted"}`}>
                {p === 30 ? "30 días" : "7 días"}
              </button>
            ))}
          </div>
        }
      />

      <TechTag k="gastos" className="mb-4">
        <section className={`flex flex-col gap-3 rounded-2xl border p-5 ${r.excedido ? "border-amber-ink/40 bg-amber-bg" : "border-line bg-white"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold">{r.excedido ? "Superaron el tope de gasto: necesitan apoyo financiero" : "Tope de gasto del mes"}</span>
            {puede("administrar") && <button type="button" className="text-sm font-medium text-muted underline" onClick={() => setEditarTope(!editarTope)}>{editarTope ? "Cerrar" : r.tope ? "Cambiar tope" : "Definir tope"}</button>}
          </div>
          {r.tope > 0 ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] font-semibold tracking-tight">{peso(r.total)}</span>
                <span className="text-sm text-muted">de {peso(r.tope)} ({Math.round((r.total / r.tope) * 100)}%)</span>
              </div>
              <Medidor valor={Math.min(r.total, r.tope)} max={r.tope} titulo="Gasto del mes contra el tope" estado={r.excedido ? "alerta" : r.total > r.tope * 0.8 ? "aviso" : "ok"} />
            </>
          ) : (
            <p className="text-sm text-muted">Definan cuánto pueden gastar al mes; si se rebasa, Respira avisa que necesitan apoyo.</p>
          )}
          {editarTope && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="g-tope" className={label}>Tope mensual (MXN)</label>
                <input id="g-tope" type="number" min={0} className={`${input} w-40`} value={tope} onChange={(e) => setTope(e.target.value)} />
              </div>
              <button type="button" className={btnPrimary} onClick={() => { configurarGastos({ topeGastoMes: Number(tope) || 0 }); setEditarTope(false); }}>Guardar tope</button>
            </div>
          )}
          {r.excedido && (
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div className="rounded-xl bg-white p-3"><span className="font-semibold">Pensión para el Bienestar de las Personas Adultas Mayores</span><span className="block text-muted">Para personas de 65 años o más. Verifiquen si {paciente.nombre} ya la recibe.</span></div>
              <div className="rounded-xl bg-white p-3"><span className="font-semibold">Programas de cuidados de la alcaldía y el DIF</span><span className="block text-muted">Apoyos, centros de día y servicios; búsquenlos en <a href={SIDECU.url} target="_blank" rel="noopener noreferrer" className="underline">SIDECU</a>.</span></div>
              <div className="rounded-xl bg-white p-3"><span className="font-semibold">Revisar el reparto en familia</span><span className="block text-muted">Ajusten porcentajes según lo que cada quien puede aportar.</span></div>
              <div className="rounded-xl bg-white p-3"><span className="font-semibold">Banco de tiempo</span><span className="block text-muted">Cambien horas por relevos pagados cuando se pueda.</span></div>
            </div>
          )}
        </section>
      </TechTag>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { t: "Total", v: peso(r.total), d: `${r.gastos.length} gastos registrados` },
          { t: `Pagó ${paciente.nombre}`, v: peso(r.deElla), d: "De su pensión; se descuenta antes de repartir" },
          { t: "A repartir en la familia", v: peso(r.aRepartir), d: "Según el reparto acordado" },
          { t: "Mayor gasto", v: r.porCategoria[0]?.[0] ?? "—", d: r.porCategoria[0] ? peso(r.porCategoria[0][1]) : "" },
        ].map((k) => (
          <div key={k.t} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
            <span className="text-sm text-muted">{k.t}</span>
            <span className="text-[24px] font-semibold tracking-tight">{k.v}</span>
            <span className="text-xs text-muted">{k.d}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <TechTag k="gastos">
          <Tarjeta titulo="Cómo quedan las cuentas" accion={puede("administrar") ? <button type="button" className="text-sm font-medium text-muted" onClick={() => { setReparto(Object.fromEntries(r.filas.map((f) => [f.usuario.id, f.pct]))); setEditarReparto(!editarReparto); }}>{editarReparto ? "Cerrar" : "Cambiar reparto"}</button> : undefined}>
            <Segmentadas
              titulo="Quién aportó a los gastos"
              filas={[{ nombre: `Quién aportó (${peso(r.total)})`, partes: [...r.filas.map((f) => ({ nombre: f.usuario.nombre.split(" ")[0], valor: f.aporto })), ...(r.deElla ? [{ nombre: `${paciente.nombre} (pensión)`, valor: r.deElla }] : [])] }]}
            />
            <ul className="flex flex-col divide-y divide-line-soft">
              {r.filas.map((f) => (
                <li key={f.usuario.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Avatar nombre={f.usuario.nombre} tono={f.usuario.tono} size={30} />
                  <span className="flex min-w-[120px] flex-1 flex-col">
                    <span className="font-semibold">{f.usuario.nombre.split(" ")[0]}</span>
                    <span className="text-xs text-muted">Le toca {f.pct}%: {peso(f.leToca)} · aportó {peso(f.aporto)}</span>
                    {(puede("administrar") || f.usuario.id === usuario.id) && (
                      <label className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                        <input type="checkbox" className="h-3.5 w-3.5 accent-primario" checked={f.voluntario} onChange={(e) => configurarGastos({ aportaDeMas: { ...(familia.aportaDeMas ?? {}), [f.usuario.id]: e.target.checked } })} />
                        Lo que pone de más es aportación voluntaria (no se le reembolsa)
                      </label>
                    )}
                  </span>
                  {editarReparto ? (
                    <span className="flex items-center gap-1">
                      <input aria-label={`Porcentaje de ${f.usuario.nombre}`} type="number" min={0} max={100} className={`${input} h-9 w-20`} value={reparto[f.usuario.id] ?? 0} onChange={(e) => setReparto({ ...reparto, [f.usuario.id]: Number(e.target.value) })} />%
                    </span>
                  ) : (
                    <Pill tono={f.saldo > 0 ? "green" : f.saldo < 0 && f.debeAjustado > 0 ? "amber" : "neutral"}>{f.saldo > 0 ? (f.voluntario ? `Aportó ${peso(f.saldo)} de más` : `Le deben ${peso(f.saldo)}`) : f.saldo < 0 ? (f.debeAjustado > 0 ? `Debe ${peso(f.debeAjustado)}` : "A mano (lo cubrió la aportación voluntaria)") : "A mano"}</Pill>
                  )}
                </li>
              ))}
            </ul>
            {editarReparto && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">Suma: {Object.values(reparto).reduce((a, b) => a + b, 0)}% (se ajusta a 100%)</span>
                <button type="button" className={btnPrimary} onClick={() => { guardarReparto(reparto); setEditarReparto(false); }}>Guardar reparto</button>
              </div>
            )}
            {r.transferencias.length > 0 && !editarReparto && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-canvas p-3 text-sm">
                <span className="font-semibold">Para quedar a mano</span>
                {r.transferencias.map((t, i) => (
                  <span key={i}>{t.de.nombre.split(" ")[0]} le pasa <span className="font-semibold">{peso(t.monto)}</span> a {t.a.nombre.split(" ")[0]}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted">El reparto lo acuerda la familia; puede ser parejo o según lo que cada quien puede aportar. El tiempo de cuidado también cuenta: está en Relevos y en el banco de horas.</p>
          </Tarjeta>
        </TechTag>

        <Tarjeta titulo="Por categoría">
          {r.porCategoria.length === 0 && <Vacio>Sin gastos en este periodo.</Vacio>}
          <div className="flex flex-col gap-2.5 text-sm">
            {r.porCategoria.map(([c, v]) => (
              <div key={c} className="grid grid-cols-[130px_minmax(0,1fr)_70px] items-center gap-2.5">
                <span className="truncate">{c}</span>
                <span className="flex h-2 rounded-full bg-chip"><span className="rounded-full bg-primario" style={{ width: `${(v / max) * 100}%` }} /></span>
                <span className="text-right font-semibold">{peso(v)}</span>
              </div>
            ))}
          </div>
        </Tarjeta>

        <TechTag k="gastos" className="lg:col-span-2">
          <Tarjeta titulo="Gastos registrados">
            {registra && (
              <div className="grid gap-2 rounded-2xl border border-dashed border-[#c9cde0] p-3 md:grid-cols-[150px_1fr_110px_150px_auto] md:items-end">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="g-cat" className={label}>Categoría</label>
                  <select id="g-cat" className={input} value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}>{CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center justify-between">
                    <label htmlFor="g-con" className={label}>Concepto</label>
                    <button type="button" className="text-xs font-semibold text-primario underline" onClick={() => setNuevo({ ...nuevo, categoria: "Medicinas", concepto: "Medicamento para la presión (receta del mes)", monto: "420", comprobante: imagenEjemplo("$420", "ticket farmacia") })}>Llenar ejemplo</button>
                  </span>
                  <input id="g-con" className={input} placeholder="Ej. despensa de la semana" value={nuevo.concepto} onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="g-mon" className={label}>Monto (MXN)</label>
                  <input id="g-mon" type="number" min={0} className={input} value={nuevo.monto} onChange={(e) => setNuevo({ ...nuevo, monto: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="g-pag" className={label}>¿Quién pagó?</label>
                  <select id="g-pag" className={input} value={nuevo.pagoPor} onChange={(e) => setNuevo({ ...nuevo, pagoPor: e.target.value })}>
                    {pagadores.map((u) => <option key={u.id} value={u.id}>{nombre(u.id)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <label className={`${btnSecondary} cursor-pointer`} title="Foto del ticket">
                    {nuevo.comprobante ? "Ticket ✓" : "Ticket"}
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const a = e.target.files?.[0]; e.target.value = ""; if (a) setNuevo({ ...nuevo, comprobante: await reducirImagen(a) }); }} />
                  </label>
                  <button
                    type="button"
                    className={btnPrimary}
                    disabled={!nuevo.concepto.trim() || !(Number(nuevo.monto) > 0) || !nuevo.pagoPor}
                    onClick={() => {
                      agregarGasto({ fecha: fechaISO(ahora), categoria: nuevo.categoria, concepto: nuevo.concepto.trim(), monto: Number(nuevo.monto), pagoPor: nuevo.pagoPor, comprobante: nuevo.comprobante || undefined });
                      setNuevo({ ...nuevo, concepto: "", monto: "", comprobante: "" });
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
            <ul className="flex flex-col divide-y divide-line-soft">
              {r.gastos.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-muted">{g.fecha.slice(5)}</span>
                  <span className="flex min-w-[160px] flex-1 flex-col">
                    <span className="font-medium">{g.concepto}</span>
                    <span className="text-xs text-muted">{g.categoria} · pagó {nombre(g.pagoPor)}{g.comprobante ? " · con ticket" : ""}</span>
                  </span>
                  <span className="font-semibold">{peso(g.monto)}</span>
                  {registra && g.registradoPor === usuario.id && <button type="button" className="text-xs text-muted underline" onClick={() => quitarGasto(g.id)}>Quitar</button>}
                </li>
              ))}
              {r.gastos.length === 0 && <li className="py-3 text-sm text-muted">Sin gastos en este periodo.</li>}
            </ul>
          </Tarjeta>
        </TechTag>
      </div>
    </>
  );
}

export default function GastosPage() {
  return (
    <RequiereFamilia>
      <Gastos />
    </RequiereFamilia>
  );
}

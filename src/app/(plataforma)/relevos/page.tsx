"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { DIAS_LARGOS, DURACIONES_RELEVO } from "@/lib/catalogos";
import { calificacion, candidatosFamilia, certificadas, cubre, estadoRelevo, fechaDe, horaTexto, perfilesRed, rangoRelevo } from "@/lib/calculos";
import { Estrellas } from "@/components/Graficas";
import { diaSemana, fechaISO } from "@/lib/seed";
import type { Relevo, SolicitudRed } from "@/lib/types";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, Modal, Pill, Segmentado, TONO_BARRA, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const H_INI = 6;
const H_FIN = 24;

function Relevos() {
  const { db, ahora, usuario, familia, integrantes, puede, asignarRelevo, crearRelevo, proponerIntercambio, solicitarRed } = useData();
  const [selId, setSelId] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [radio, setRadio] = useState(3);
  const [inter, setInter] = useState<{ a: string; tipo: "horas" | "monetario"; monto: number }>({ a: "", tipo: "horas", monto: 0 });
  const [nr, setNr] = useState({ fecha: fechaISO(ahora), inicio: 9, horas: 4, personalizado: false, asignadoA: "" });
  if (!familia || !usuario) return null;

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ahora);
    d.setDate(d.getDate() + i);
    return fechaISO(d);
  });
  const relevos = db.relevos.filter((r) => r.familiaId === familia.id && dias.includes(r.fecha));
  const sel = relevos.find((r) => r.id === selId) ?? null;
  const nombre = (id: string | null) => db.usuarios.find((u) => u.id === id)?.nombre.split(" ")[0];
  const tono = (r: Relevo) => (r.origen === "red" ? "bg-maya" : TONO_BARRA[db.usuarios.find((u) => u.id === r.asignadoA)?.tono ?? "t4"]);
  const admin = puede("administrar");
  const puedeRelevar = puede("relevos");
  const pendienteRed = (r: Relevo) => db.solicitudes.find((s) => s.relevoId === r.id && s.estado === "enviada");

  const pedirRed = (r: Relevo, uId: string) => {
    const u = db.usuarios.find((x) => x.id === uId)!;
    const pago: SolicitudRed["pago"] = u.ofreceAyuda.modalidades.includes("programa de apoyo") ? "programa de apoyo" : u.ofreceAyuda.modalidades.includes("pago") ? "pago" : "intercambio de horas";
    solicitarRed({ relevoId: r.id, usuarioId: uId, pago, monto: pago === "pago" ? u.ofreceAyuda.tarifaHora * r.horas : 0 });
  };

  return (
    <>
      <Encabezado
        sub="Relevos de 4, 6, 8 horas o los que defina la familia"
        titulo="Relevos"
        acciones={puedeRelevar && <button type="button" className={btnPrimary} onClick={() => setNuevo(true)}>Nuevo relevo</button>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <TechTag k="relevos">
          <Tarjeta titulo="Próximos 7 días">
            <div className="flex flex-col gap-2">
              <div className="ml-[92px] grid text-xs text-muted" style={{ gridTemplateColumns: `repeat(${(H_FIN - H_INI) / 3}, minmax(0, 1fr))` }}>
                {Array.from({ length: (H_FIN - H_INI) / 3 }, (_, i) => <span key={i}>{horaTexto(H_INI + i * 3)}</span>)}
              </div>
              {dias.map((f) => {
                const delDia = relevos.filter((r) => r.fecha === f).sort((a, b) => a.inicio - b.inicio);
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="w-[84px] shrink-0 text-sm">
                      <span className="font-medium">{f === fechaISO(ahora) ? "Hoy" : DIAS_LARGOS[diaSemana(fechaDe(f))].slice(0, 3)}</span> <span className="text-muted">{Number(f.slice(8))}</span>
                    </span>
                    <div className="relative h-10 flex-1 rounded-lg bg-canvas">
                      {delDia.map((r) => {
                        const left = ((Math.max(r.inicio, H_INI) - H_INI) / (H_FIN - H_INI)) * 100;
                        const width = ((Math.min(r.inicio + r.horas, H_FIN) - Math.max(r.inicio, H_INI)) / (H_FIN - H_INI)) * 100;
                        const vacio = !r.asignadoA;
                        const pend = vacio && pendienteRed(r);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelId(r.id)}
                            title={`${rangoRelevo(r)} · ${nombre(r.asignadoA) ?? "Sin cubrir"}`}
                            className={`absolute inset-y-1 truncate rounded-md px-1.5 text-left text-xs font-semibold ${
                              vacio ? `border-[1.5px] border-dashed ${pend ? "border-maya bg-realce text-maya" : "border-[#d9867b] bg-red-bg text-red-ink"}` : `${tono(r)} ${r.origen === "red" ? "text-white" : ""} ${["bg-[#9aa6d6]", "bg-[#c9cfe6]"].includes(tono(r)) ? "text-ink" : "text-white"}`
                            } ${selId === r.id ? "ring-2 ring-tech ring-offset-1" : ""}`}
                            style={{ left: `${left}%`, width: `calc(${width}% - 3px)` }}
                          >
                            {vacio ? (pend ? "En la red" : "Sin cubrir") : nombre(r.asignadoA)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-line-soft pt-3 text-xs text-muted">
              {integrantes.map((i) => (
                <span key={i.usuario.id} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${TONO_BARRA[i.usuario.tono]}`} />{i.usuario.nombre.split(" ")[0]}</span>
              ))}
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-maya" />Red de cuidado</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-[1.5px] border-dashed border-[#d9867b]" />Sin cubrir</span>
            </div>
          </Tarjeta>
        </TechTag>

        <Tarjeta titulo={sel ? `${DIAS_LARGOS[diaSemana(fechaDe(sel.fecha))]} · ${rangoRelevo(sel)}` : "Selecciona un relevo"}>
          {!sel && <Vacio>Toca un bloque de la semana para asignarlo, cambiarlo o pedir apoyo.</Vacio>}
          {sel && (
            <>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{sel.horas} horas · {sel.origen === "red" ? "relevo de la red" : "familia"}</span>
                <Pill tono={sel.asignadoA ? "green" : "red"}>{estadoRelevo(sel, ahora, db)}</Pill>
              </div>
              {sel.asignadoA && (
                <div className="flex items-center gap-2.5">
                  <Avatar nombre={nombre(sel.asignadoA) ?? "?"} tono={db.usuarios.find((u) => u.id === sel.asignadoA)?.tono} size={34} />
                  <span className="font-semibold">{db.usuarios.find((u) => u.id === sel.asignadoA)?.nombre}</span>
                  {sel.recibidoEn && <Pill>Recibió a la persona {sel.recibidoEn.slice(11, 16)}</Pill>}
                </div>
              )}

              {puedeRelevar && (admin || !sel.asignadoA) && (
                <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
                  <span className={label}>Asignar a la familia (con disponibilidad en ese horario)</span>
                  <div className="flex flex-wrap gap-2">
                    {integrantes.filter((i) => i.membresia.rol !== "avisos").map((i) => {
                      const libre = cubre(i.usuario.disponibilidad, sel.fecha, sel.inicio, sel.horas);
                      return (
                        <button
                          key={i.usuario.id}
                          type="button"
                          onClick={() => asignarRelevo(sel.id, i.usuario.id)}
                          className={`rounded-full border px-3 py-1.5 text-sm ${sel.asignadoA === i.usuario.id ? "border-primario bg-primario text-white" : libre ? "border-primario bg-white font-medium" : "border-line bg-white text-muted"}`}
                        >
                          {i.usuario.nombre.split(" ")[0]} {libre ? "· disponible" : "· sin disponibilidad"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sel.asignadoA === usuario.id && sel.origen === "familia" && (
                <TechTag k="intercambio">
                  <div className="flex flex-col gap-2 rounded-xl bg-canvas p-3">
                    <span className="text-sm font-semibold">¿No puedes cubrirlo? Propón un intercambio</span>
                    <select className={input} value={inter.a} onChange={(e) => setInter({ ...inter, a: e.target.value })} aria-label="Quién lo cubre">
                      <option value="">Elige a quién</option>
                      {candidatosFamilia(db, sel, usuario.id).map((c) => <option key={c.usuario.id} value={c.usuario.id}>{c.usuario.nombre} (disponible)</option>)}
                      {integrantes.filter((i) => i.usuario.id !== usuario.id && !candidatosFamilia(db, sel, usuario.id).some((c) => c.usuario.id === i.usuario.id) && i.membresia.rol !== "avisos").map((i) => <option key={i.usuario.id} value={i.usuario.id}>{i.usuario.nombre}</option>)}
                    </select>
                    <Segmentado etiqueta="Tipo de intercambio" valor={inter.tipo} onChange={(v) => setInter({ ...inter, tipo: v })} opciones={[{ v: "horas", t: `Le devuelvo ${sel.horas} h` }, { v: "monetario", t: "Le pago" }]} />
                    {inter.tipo === "monetario" && (
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="monto" className={label}>Monto (MXN)</label>
                        <input id="monto" type="number" min={0} className={input} value={inter.monto} onChange={(e) => setInter({ ...inter, monto: Number(e.target.value) })} />
                      </div>
                    )}
                    <button type="button" className={btnPrimary} disabled={!inter.a} onClick={() => { proponerIntercambio({ relevoId: sel.id, aUsuarioId: inter.a, tipo: inter.tipo, monto: inter.tipo === "horas" ? sel.horas : inter.monto }); setInter({ a: "", tipo: "horas", monto: 0 }); }}>
                      Enviar propuesta
                    </button>
                  </div>
                </TechTag>
              )}

              {!sel.asignadoA && puedeRelevar && (
                <TechTag k="red-externa">
                  <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">Buscar en la red de cuidado</span>
                      <label className="flex items-center gap-2 text-xs text-muted">
                        {radio} km
                        <input type="range" min={1} max={12} value={radio} onChange={(e) => setRadio(Number(e.target.value))} className="w-28 accent-primario" aria-label="Radio de búsqueda" />
                      </label>
                    </div>
                    {pendienteRed(sel) ? (
                      <p className="rounded-xl bg-realce p-3 text-sm text-ink">Solicitud enviada a {nombre(pendienteRed(sel)!.usuarioId)}. Lo ve en su cuenta y puede aceptarla desde ahí.</p>
                    ) : (
                      <>
                        {perfilesRed(db, familia.id, radio, sel).length === 0 && <p className="text-sm text-muted">Nadie disponible en ese horario dentro de {radio} km.</p>}
                        {perfilesRed(db, familia.id, radio, sel).map(({ usuario: u, distancia }) => (
                          <div key={u.id} className="flex items-center gap-2.5 rounded-xl border border-line p-2.5">
                            <Avatar nombre={u.nombre} tono={u.tono} size={32} />
                            <span className="flex flex-1 flex-col text-sm">
                              <span className="font-semibold">{u.nombre} <span className="font-normal text-muted">· {distancia.toFixed(1)} km (~{Math.max(2, Math.round(distancia * 5.5))} min){u.fuente === "sidecu" ? " · vía SIDECU" : ""}</span></span>
                              {calificacion(db, u.id).n > 0 && <Estrellas valor={calificacion(db, u.id).promedio} n={calificacion(db, u.id).n} />}
                              <span className="text-xs text-muted">
                                {certificadas(db, u.id).map((c) => c.nombre).join(", ") || "Práctica en la red"} · {u.ofreceAyuda.modalidades.includes("pago") ? `$${u.ofreceAyuda.tarifaHora}/h` : u.ofreceAyuda.modalidades[0]}
                              </span>
                            </span>
                            <button type="button" className={btnSecondary} onClick={() => pedirRed(sel, u.id)}>Pedir</button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </TechTag>
              )}
            </>
          )}
        </Tarjeta>
      </div>

      <TechTag k="intercambio" className="mt-4">
        <Tarjeta titulo="Intercambios y banco de horas">
          <div className="grid gap-4 md:grid-cols-2">
            <ul className="flex flex-col gap-2">
              {integrantes.map((i) => (
                <li key={i.usuario.id} className="flex items-center justify-between text-sm">
                  <span>{i.usuario.nombre}</span>
                  <span className={`font-semibold ${i.usuario.saldoHoras > 0 ? "text-green-ink" : i.usuario.saldoHoras < 0 ? "text-red-ink" : ""}`}>
                    {i.usuario.saldoHoras > 0 ? `Le deben ${i.usuario.saldoHoras} h` : i.usuario.saldoHoras < 0 ? `Debe ${-i.usuario.saldoHoras} h` : "Sin saldo"}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-2 text-sm">
              {db.intercambios.filter((i) => i.familiaId === familia.id).length === 0 && <li className="text-muted">Sin intercambios todavía.</li>}
              {db.intercambios.filter((i) => i.familiaId === familia.id).slice(-5).reverse().map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <span>{nombre(i.deUsuarioId)} → {nombre(i.aUsuarioId)} · {i.tipo === "horas" ? `${i.monto} h` : `$${i.monto}`}</span>
                  <Pill tono={i.estado === "aceptado" ? "green" : i.estado === "pendiente" ? "amber" : "neutral"}>{i.estado}</Pill>
                </li>
              ))}
            </ul>
          </div>
        </Tarjeta>
      </TechTag>

      <Modal abierto={nuevo} onCerrar={() => setNuevo(false)} titulo="Nuevo relevo">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nr-f" className={label}>Día</label>
              <select id="nr-f" className={input} value={nr.fecha} onChange={(e) => setNr({ ...nr, fecha: e.target.value })}>
                {dias.map((f) => <option key={f} value={f}>{DIAS_LARGOS[diaSemana(fechaDe(f))]} {Number(f.slice(8))}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nr-i" className={label}>Inicio</label>
              <select id="nr-i" className={input} value={nr.inicio} onChange={(e) => setNr({ ...nr, inicio: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{horaTexto(h)}</option>)}
              </select>
            </div>
          </div>
          <span className={label}>Duración</span>
          <div className="flex flex-wrap gap-2">
            {DURACIONES_RELEVO.map((h) => (
              <button key={h} type="button" onClick={() => setNr({ ...nr, horas: h, personalizado: false })} className={`min-h-[40px] rounded-full border px-4 text-sm ${!nr.personalizado && nr.horas === h ? "border-primario bg-primario text-white" : "border-line"}`}>{h} horas</button>
            ))}
            <button type="button" onClick={() => setNr({ ...nr, personalizado: true })} className={`min-h-[40px] rounded-full border px-4 text-sm ${nr.personalizado ? "border-primario bg-primario text-white" : "border-line"}`}>Personalizado</button>
            {nr.personalizado && <input type="number" min={1} max={24} aria-label="Horas" className={`${input} w-24`} value={nr.horas} onChange={(e) => setNr({ ...nr, horas: Number(e.target.value) })} />}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nr-a" className={label}>Quién lo cubre</label>
            <select id="nr-a" className={input} value={nr.asignadoA} onChange={(e) => setNr({ ...nr, asignadoA: e.target.value })}>
              <option value="">Sin asignar (buscar después)</option>
              {integrantes.filter((i) => i.membresia.rol !== "avisos").map((i) => (
                <option key={i.usuario.id} value={i.usuario.id}>{i.usuario.nombre}{cubre(i.usuario.disponibilidad, nr.fecha, nr.inicio, nr.horas) ? " · disponible" : ""}</option>
              ))}
            </select>
          </div>
          <button type="button" className={btnPrimary} onClick={() => { crearRelevo({ fecha: nr.fecha, inicio: nr.inicio, horas: nr.horas, asignadoA: nr.asignadoA || null }); setNuevo(false); }}>
            Crear relevo de {nr.horas} h
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function RelevosPage() {
  return (
    <RequiereFamilia>
      <Relevos />
    </RequiereFamilia>
  );
}

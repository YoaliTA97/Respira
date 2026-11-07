"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { DIAS } from "@/lib/catalogos";
import { fechaISO } from "@/lib/seed";
import { habilidades, horasCuidado, horasDisponibles, relevoActual } from "@/lib/calculos";
import { ROL_TEXTO, type RolFamilia } from "@/lib/types";
import { InvitarPersona } from "@/components/InvitarPersona";
import { MapaNodos, type Nodo } from "@/components/MapaNodos";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, Pill, Tarjeta, input, label } from "@/components/ui";

const ROLES: RolFamilia[] = ["coordinacion", "cuidado", "apoyo", "avisos"];

function Integrantes() {
  const { db, ahora, usuario, familia, puede, cambiarRol, setPrincipal, invitar } = useData();
  const [sel, setSel] = useState(usuario?.id ?? "");
  if (!familia || !usuario) return null;

  const todos = db.membresias.filter((m) => m.familiaId === familia.id).map((m) => ({ m, u: db.usuarios.find((x) => x.id === m.usuarioId)! })).filter((x) => x.u);
  const turno = relevoActual(db, familia.id, ahora);
  const d7 = new Date(ahora);
  d7.setDate(d7.getDate() - 7);
  const redIds = Array.from(new Set(db.relevos.filter((r) => r.familiaId === familia.id && r.origen === "red" && r.asignadoA).map((r) => r.asignadoA!)));
  const nodo = (u: (typeof db.usuarios)[number], detalle: string, extra: Partial<Nodo> = {}): Nodo => ({ id: u.id, nombre: u.nombre, detalle, tono: u.tono, deTurno: turno?.asignadoA === u.id, ...extra });
  const centro = nodo(usuario, "tú");
  const nodos: Nodo[] = [
    ...todos.filter((x) => x.u.id !== usuario.id).map((x) => nodo(x.u, x.m.estado === "invitada" ? "invitación pendiente" : ROL_TEXTO[x.m.rol].t, { invitado: x.m.estado === "invitada" })),
    ...redIds.map((id) => db.usuarios.find((u) => u.id === id)!).filter(Boolean).map((u) => nodo(u, "red de cuidado", { red: true })),
  ];
  const elegido = todos.find((x) => x.u.id === sel);
  const elegidoRed = !elegido ? db.usuarios.find((u) => u.id === sel) : null;
  const admin = puede("administrar");

  return (
    <>
      <Encabezado sub="Todo empieza con la familia: tú al centro y tu red alrededor" titulo="Integrantes y roles" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <TechTag k="mapa-nodos">
          <Tarjeta titulo="Mapa de la red">
            <MapaNodos centro={centro} nodos={nodos} seleccionado={sel} onSelect={setSel} />
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-green-ink" />De turno ahora</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-dashed border-[#a8a8a5]" />Invitación pendiente</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-maya" />Red de cuidado que ha cubierto relevos</span>
            </div>
          </Tarjeta>
        </TechTag>

        <TechTag k="membresias">
          <Tarjeta titulo="Detalle">
            {elegido ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar nombre={elegido.u.nombre} tono={elegido.u.tono} size={44} />
                  <div className="flex flex-col">
                    <span className="font-semibold">{elegido.u.nombre}{elegido.u.id === usuario.id ? " (tú)" : ""}</span>
                    <span className="text-sm text-muted">{elegido.m.parentesco} · {elegido.m.estado === "invitada" ? "invitación pendiente" : ROL_TEXTO[elegido.m.rol].t}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-canvas p-2.5"><p className="text-lg font-semibold">{horasDisponibles(elegido.u.disponibilidad)} h</p><p className="text-xs text-muted">disponibles por semana</p></div>
                  <div className="rounded-xl bg-canvas p-2.5"><p className="text-lg font-semibold">{horasCuidado(db, elegido.u.id, ahora, fechaISO(d7), familia.id)} h</p><p className="text-xs text-muted">cubiertas en 7 días</p></div>
                </div>
                <TechTag k="disponibilidad">
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {DIAS.map((d, i) => {
                      const r = elegido.u.disponibilidad[i]?.[0];
                      return (
                        <div key={d} className={`rounded-lg px-1 py-1.5 ${r ? "bg-primario text-white" : "bg-chip text-muted"}`}>
                          <div className="font-semibold">{d}</div>
                          <div>{r ? `${r.inicio}-${r.fin}` : "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </TechTag>
                <div className="flex flex-wrap gap-1">
                  {habilidades(db, elegido.u.id).map((h) => <Pill key={h.tutorial.id}>{h.tutorial.habilidad}</Pill>)}
                  {(elegido.u.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}
                </div>
                {admin && elegido.u.id !== usuario.id ? (
                  <div className="flex flex-col gap-3 border-t border-line-soft pt-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="rol" className={label}>Rol en este espacio</label>
                      <select id="rol" className={input} value={elegido.m.rol} onChange={(e) => cambiarRol(elegido.m.id, e.target.value as RolFamilia)}>
                        {ROLES.map((r) => <option key={r} value={r}>{ROL_TEXTO[r].t}: {ROL_TEXTO[r].d}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-primario" checked={elegido.m.principal} onChange={(e) => setPrincipal(elegido.m.id, e.target.checked)} />
                      Principal: recibe las alertas médicas por WhatsApp
                    </label>
                  </div>
                ) : (
                  <p className="border-t border-line-soft pt-3 text-xs text-muted">{ROL_TEXTO[elegido.m.rol].d}.{elegido.m.principal ? " Recibe las alertas médicas por WhatsApp." : ""}</p>
                )}
              </>
            ) : elegidoRed ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar nombre={elegidoRed.nombre} tono={elegidoRed.tono} size={44} />
                  <div className="flex flex-col">
                    <span className="font-semibold">{elegidoRed.nombre}</span>
                    <span className="text-sm text-muted">Red de cuidado · no es integrante del espacio</span>
                  </div>
                </div>
                <p className="text-sm text-ink-2">{elegidoRed.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {habilidades(db, elegidoRed.id).map((h) => <Pill key={h.tutorial.id}>{h.tutorial.habilidad}</Pill>)}
                  {(elegidoRed.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}
                </div>
                {admin && <p className="text-xs text-muted">Puedes sumarla al espacio desde “Agregar a alguien”: ya tiene perfil, solo eliges su rol.</p>}
              </>
            ) : (
              <p className="text-sm text-muted">Selecciona un nodo.</p>
            )}
          </Tarjeta>
        </TechTag>
      </div>

      {admin && (
        <TechTag k="membresias" className="mt-4">
          <Tarjeta titulo="Agregar a alguien al espacio">
            <p className="text-sm text-muted">Solo quien coordina puede agregar personas. Si ya usan Respira se vincula su perfil; nadie entra al espacio sin aceptar la invitación.</p>
            <InvitarPersona excluirIds={todos.map((x) => x.u.id)} onAgregar={invitar} />
          </Tarjeta>
        </TechTag>
      )}
    </>
  );
}

export default function IntegrantesPage() {
  return (
    <RequiereFamilia>
      <Integrantes />
    </RequiereFamilia>
  );
}

"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { DIAS } from "@/lib/catalogos";
import { fechaISO } from "@/lib/seed";
import { calificacion, habilidades, horasCuidado, horasDisponibles, km, perfilesRed, relevoActual } from "@/lib/calculos";
import { Estrellas } from "@/components/Graficas";
import { useDemoEvento } from "@/lib/demo";
import { ROL_TEXTO, type RolFamilia } from "@/lib/types";
import Link from "next/link";
import { InvitarPersona } from "@/components/InvitarPersona";
import { QrFamilia, enlaceUnion } from "@/components/QrFamilia";
import { MapaNodos, type Nodo } from "@/components/MapaNodos";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, Pill, Tarjeta, btnSecondary, input, label } from "@/components/ui";

const ROLES: RolFamilia[] = ["coordinacion", "cuidado", "apoyo", "avisos"];

function Integrantes() {
  const { db, ahora, usuario, familia, paciente, puede, cambiarRol, setPrincipal, invitar } = useData();
  const [sel, setSel] = useState(usuario?.id ?? "");
  const [proyectar, setProyectar] = useState(false);
  const [etapa, setEtapa] = useState(4);
  const crecer = () => {
    setEtapa(1);
    [2, 3, 4].forEach((n, k) => setTimeout(() => setEtapa(n), 1600 * (k + 1)));
  };
  useDemoEvento((ev) => ev === "mapa-crece" && crecer());
  if (!familia || !usuario) return null;

  const todos = db.membresias.filter((m) => m.familiaId === familia.id).map((m) => ({ m, u: db.usuarios.find((x) => x.id === m.usuarioId)! })).filter((x) => x.u);
  const turno = relevoActual(db, familia.id, ahora);
  const d7 = new Date(ahora);
  d7.setDate(d7.getDate() - 7);
  const redIds = Array.from(new Set(db.relevos.filter((r) => r.familiaId === familia.id && r.origen === "red" && r.asignadoA).map((r) => r.asignadoA!)));
  const nodo = (u: (typeof db.usuarios)[number], detalle: string, extra: Partial<Nodo> = {}): Nodo => ({ id: u.id, nombre: u.nombre, detalle, tono: u.tono, deTurno: turno?.asignadoA === u.id, ...extra });
  const centro = nodo(usuario, "tú");
  // La red se va abriendo: 1) la familia, 2) quien está cerca (vecinas, cuidadora certificada),
  // 3) a quien se conecta por el banco de tiempo, 4) la voz de la persona mayor.
  const minutos = (d: number) => Math.max(2, Math.round(d * 5.5));
  const cerca = Array.from(new Set([...redIds, ...perfilesRed(db, familia.id, 3).map((p) => p.usuario.id)]))
    .map((id) => db.usuarios.find((u) => u.id === id)!)
    .filter(Boolean);
  const banco = Array.from(new Set(db.banco.filter((b) => b.deUsuarioId === usuario.id || todos.some((x) => x.u.id === b.deUsuarioId)).map((b) => b.paraUsuarioId)))
    .filter((id) => !todos.some((x) => x.u.id === id) && !cerca.some((u) => u.id === id))
    .map((id) => db.usuarios.find((u) => u.id === id)!)
    .filter(Boolean);
  const familiaNodos = todos.filter((x) => x.u.id !== usuario.id);
  const nodos: Nodo[] = [
    ...familiaNodos.filter((x) => x.m.rol !== "persona" || etapa >= 4).map((x) => nodo(x.u, x.m.rol === "persona" ? "Mi voz" : x.m.estado === "invitada" ? "invitación pendiente" : x.m.parentesco, { invitado: x.m.estado === "invitada" })),
    ...(etapa >= 2 ? cerca.map((u) => nodo(u, `${u.verificado ? (u.seguridadSocial ? "certificada" : "vecina") : "red"} · ${minutos(km(familia.hogar, u.ubicacion))} min`, { red: true })) : []),
    ...(etapa >= 3 ? banco.map((u) => nodo(u, "banco de tiempo", { red: true })) : []),
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
            <div className="flex flex-wrap items-center gap-1.5">
              {["Familia", "Vecinas y cuidadora", "Banco de tiempo", "Mi voz"].map((t, i) => (
                <button key={t} type="button" aria-pressed={etapa === i + 1} onClick={() => setEtapa(i + 1)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${etapa === i + 1 ? "border-primario bg-primario text-white" : "border-line bg-white text-ink-2"}`}>
                  {i + 1}. {t}
                </button>
              ))}
              <button
                type="button"
                className="text-xs font-semibold text-primario underline"
                onClick={crecer}
              >
                Ver cómo crece la red
              </button>
            </div>
            <p className="text-sm">
              Red de cuidado de {paciente?.nombre ?? "la persona mayor"}: <span className="text-lg font-semibold">{nodos.filter((n) => n.id !== paciente?.usuarioId).length} personas</span>
            </p>
            <MapaNodos centro={centro} nodos={nodos} seleccionado={sel} onSelect={setSel} />
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-green-ink" />De turno ahora</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-dashed border-[#a8a8a5]" />Invitación pendiente</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-maya" />Red cercana y banco de tiempo</span>
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
                    <span className="flex flex-wrap gap-x-3 text-xs">
                      {elegido.m.rol !== "persona" && <Link href={`/cv?u=${elegido.u.id}`} className="font-semibold text-primario underline">Ver CV de cuidado</Link>}
                      {elegido.u.id !== usuario.id && familia.codigo && <a href={enlaceUnion(familia.codigo, elegido.u.id)} target="_blank" rel="noopener" className="font-semibold text-primario underline">Abrir como {elegido.u.nombre.split(" ")[0]} (simulación)</a>}
                    </span>
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
                    {calificacion(db, elegidoRed.id).n > 0 && <Estrellas valor={calificacion(db, elegidoRed.id).promedio} n={calificacion(db, elegidoRed.id).n} />}
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
            <InvitarPersona excluirIds={todos.map((x) => x.u.id)} onAgregar={invitar} simulacion />
          </Tarjeta>
        </TechTag>
      )}

      {admin && familia.codigo && (
        <TechTag k="union-qr" className="mt-4">
          <Tarjeta titulo="Unirse con QR" accion={<button type="button" className="text-sm font-medium text-muted" onClick={() => setProyectar(true)}>Proyectar en pantalla</button>}>
            <div className="flex flex-wrap items-center gap-5">
              <QrFamilia codigo={familia.codigo} tamano={168} />
              <div className="flex max-w-md flex-col gap-2 text-sm">
                <span>Código de la familia: <span className="font-mono text-lg font-semibold tracking-wider">{familia.codigo}</span></span>
                <span className="text-ink-2">Quien lo escanea elige su perfil o se registra, y entra al espacio. Para la presentación: cada integrante entra desde su teléfono.</span>
                <span className="text-xs text-muted">En la demo cada teléfono guarda su propia copia de los datos (empieza con la familia de ejemplo); con backend todos verían lo mismo en tiempo real.</span>
                <button type="button" className={`${btnSecondary} self-start`} onClick={() => navigator.clipboard?.writeText(enlaceUnion(familia.codigo!))}>Copiar enlace</button>
              </div>
            </div>
          </Tarjeta>
        </TechTag>
      )}

      {proyectar && familia.codigo && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-white p-6 text-center" onClick={() => setProyectar(false)}>
          <span className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Únete a</span>
          <h2 className="text-4xl font-semibold tracking-tight">{familia.nombre}</h2>
          <QrFamilia codigo={familia.codigo} tamano={Math.min(420, typeof window !== "undefined" ? window.innerHeight * 0.55 : 420)} />
          <p className="text-lg">Escanea con la cámara · código <span className="font-mono font-semibold">{familia.codigo}</span></p>
          <span className="text-sm text-muted">Toca para cerrar</span>
        </div>
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

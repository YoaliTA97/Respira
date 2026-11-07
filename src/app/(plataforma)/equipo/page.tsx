"use client";

import Link from "next/link";
import { useData } from "@/lib/db";
import { ALIADOS_EQUIPO, EQUIPOS, nombreEquipo } from "@/lib/catalogos";
import { prestadoresEquipo } from "@/lib/calculos";
import type { Equipo } from "@/lib/types";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Chip, Encabezado, Pill, Tarjeta, Vacio, btnSecondary } from "@/components/ui";

const ESTADOS: { v: Equipo["estado"]; t: string }[] = [
  { v: "tenemos", t: "Lo tenemos" },
  { v: "necesitamos", t: "Lo necesitamos" },
  { v: "prestado", t: "Prestado" },
  { v: "rentado", t: "Rentado" },
];

// Equipo médico: qué tiene la familia, qué le falta, quién de la red lo presta y con qué aliado se renta.
function EquipoMedico() {
  const { db, usuario, familia, paciente, puede, actualizarEquipo, pedirPrestamo, actualizarPerfil } = useData();
  if (!familia || !usuario || !paciente) return null;
  const registra = puede("registrar");
  const delEspacio = db.equipos.filter((e) => e.familiaId === familia.id);
  const estado = (tipo: string) => delEspacio.find((e) => e.tipo === tipo);
  const recomendados = new Set([
    ...EQUIPOS.filter((e) => e.signo && paciente.signos.includes(e.signo)).map((e) => e.id),
    ...(paciente.movilidad !== "independiente" ? ["andadera", "silla-ruedas"] : []),
    ...(paciente.movilidad === "en cama" ? ["cama-hospital", "colchon"] : []),
    ...delEspacio.map((e) => e.tipo),
  ]);
  const lista = EQUIPOS.filter((e) => recomendados.has(e.id));
  const otros = EQUIPOS.filter((e) => !recomendados.has(e.id));
  const faltan = delEspacio.filter((e) => e.estado === "necesitamos");
  const pedidos = db.prestamos.filter((p) => p.familiaId === familia.id).sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));
  const mio = usuario.equipo ?? [];

  return (
    <>
      <Encabezado sub={`Lo que se necesita para cuidar a ${paciente.nombre} y cómo conseguirlo`} titulo="Equipo médico" />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <TechTag k="equipo">
          <Tarjeta titulo={`Equipo para el cuidado de ${paciente.nombre}`}>
            <ul className="flex flex-col divide-y divide-line-soft">
              {lista.map((e) => {
                const s = estado(e.id);
                return (
                  <li key={e.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex flex-col">
                        <span className="font-semibold">{e.nombre}</span>
                        <span className="text-xs text-muted">{e.uso}{s?.de ? ` · ${s.estado === "rentado" ? "con" : "de"} ${s.de}` : ""}</span>
                      </span>
                      {s ? <Pill tono={s.estado === "necesitamos" ? "amber" : "green"}>{ESTADOS.find((x) => x.v === s.estado)?.t}</Pill> : <Pill tono="outline">Sin registrar</Pill>}
                    </div>
                    {registra && (
                      <div className="flex flex-wrap gap-1.5">
                        {ESTADOS.filter((x) => x.v === "tenemos" || x.v === "necesitamos").map((x) => (
                          <Chip key={x.v} activo={s?.estado === x.v} onClick={() => actualizarEquipo(e.id, s?.estado === x.v ? null : x.v)}>{x.t}</Chip>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {registra && otros.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-muted">Agregar otro equipo</summary>
                <div className="mt-2 flex flex-wrap gap-1.5">{otros.map((e) => <Chip key={e.id} onClick={() => actualizarEquipo(e.id, "necesitamos")}>{e.nombre}</Chip>)}</div>
              </details>
            )}
          </Tarjeta>
        </TechTag>

        <div className="flex flex-col gap-4">
          <TechTag k="equipo">
            <Tarjeta titulo="Pedir prestado en la red">
              {faltan.length === 0 && <Vacio>No les falta equipo. Marca “Lo necesitamos” para buscar quién lo presta cerca.</Vacio>}
              {faltan.map((f) => {
                const quienes = prestadoresEquipo(db, familia.id, f.tipo).filter((x) => x.usuario.id !== usuario.id);
                return (
                  <div key={f.id} className="flex flex-col gap-2 border-b border-line-soft pb-3 last:border-0">
                    <span className="text-sm font-semibold">{nombreEquipo(f.tipo)}</span>
                    {quienes.length === 0 && <span className="text-sm text-muted">Nadie lo presta cerca todavía; prueba con un aliado.</span>}
                    {quienes.map(({ usuario: u, distancia, deLaFamilia }) => {
                      const pendiente = pedidos.find((p) => p.tipo === f.tipo && p.aUsuarioId === u.id && p.estado === "enviada");
                      return (
                        <div key={u.id} className="flex items-center gap-2.5 text-sm">
                          <Avatar nombre={u.nombre} tono={u.tono} size={30} />
                          <span className="flex flex-1 flex-col">
                            <span className="font-medium">{u.nombre}</span>
                            <span className="text-xs text-muted">{deLaFamilia ? "De la familia" : `Red de cuidado · ${distancia.toFixed(1)} km`}{u.fuente === "sidecu" ? " · SIDECU" : ""}</span>
                          </span>
                          {pendiente ? <Pill tono="amber">Pedido</Pill> : registra && <button type="button" className={btnSecondary} onClick={() => pedirPrestamo(f.tipo, u.id)}>Pedir prestado</button>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {pedidos.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-line-soft pt-3 text-xs text-muted">
                  {pedidos.slice(0, 4).map((p) => <span key={p.id}>{nombreEquipo(p.tipo)} a {db.usuarios.find((u) => u.id === p.aUsuarioId)?.nombre.split(" ")[0]}: {p.estado}</span>)}
                  <span>La persona acepta desde su cuenta (Red de cuidado); se acuerda la entrega por el chat.</span>
                </div>
              )}
            </Tarjeta>
          </TechTag>

          <TechTag k="equipo">
            <Tarjeta titulo="Rentar o pedir a un aliado">
              {ALIADOS_EQUIPO.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{a.nombre}</span>
                    <Pill tono="outline">{a.estado}</Pill>
                  </div>
                  <span className="text-sm text-muted">{a.modalidad}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {a.equipos.map((id) => {
                      const eq = EQUIPOS.find((e) => e.id === id)!;
                      const s = estado(id);
                      const ya = s && s.estado !== "necesitamos";
                      return (
                        <button
                          key={id}
                          type="button"
                          disabled={!registra || !!ya}
                          onClick={() => actualizarEquipo(id, a.id === "aliado-renta" ? "rentado" : "prestado", a.nombre)}
                          className="rounded-xl border border-line px-2.5 py-1.5 text-left text-xs hover:border-primario disabled:opacity-50"
                        >
                          <span className="font-semibold">{eq.nombre}</span>
                          <span className="block text-muted">{ya ? "Ya lo tienen" : a.id === "aliado-renta" ? `$${eq.rentaSemana ?? "—"}/semana (ejemplo)` : "Sin costo"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted">Aliados y tarifas de ejemplo, por confirmar. Cada solicitud queda en el chat de la familia.</p>
            </Tarjeta>
          </TechTag>

          <TechTag k="equipo">
            <Tarjeta titulo="Lo que tú puedes prestar">
              <p className="text-sm text-muted">Otras familias de la red cercana lo verán y te lo podrán pedir.</p>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPOS.map((e) => (
                  <Chip key={e.id} activo={mio.includes(e.id)} onClick={() => actualizarPerfil({ equipo: mio.includes(e.id) ? mio.filter((x) => x !== e.id) : [...mio, e.id] })}>{e.nombre}</Chip>
                ))}
              </div>
              {!usuario.ofreceAyuda.activo && <p className="text-xs text-muted">Para que te lo pidan familias fuera de tu espacio, activa “Aparecer en la red de cuidado” en tu perfil.</p>}
            </Tarjeta>
          </TechTag>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted">Las guías del médico para usar cada equipo están en <Link href="/capacitacion#guias" className="underline">Capacitación</Link>.</p>
    </>
  );
}

export default function EquipoPage() {
  return (
    <RequiereFamilia>
      <EquipoMedico />
    </RequiereFamilia>
  );
}

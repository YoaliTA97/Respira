"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/db";
import { DIAS_LARGOS } from "@/lib/catalogos";
import { certificadas, fechaDe, habilidades, km, perfilesRed, rangoRelevo } from "@/lib/calculos";
import { diaSemana } from "@/lib/seed";
import { MapaDinamico } from "@/components/MapaDinamico";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary } from "@/components/ui";

export default function Red() {
  const { db, usuario, familia, responderSolicitud } = useData();
  const [radio, setRadio] = useState(5);
  const [sel, setSel] = useState<string | null>(null);
  if (!usuario) return null;

  const recibidas = db.solicitudes.filter((s) => s.usuarioId === usuario.id).sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));
  const cercanos = familia ? perfilesRed(db, familia.id, radio) : [];
  const diaTxt = (f: string) => DIAS_LARGOS[diaSemana(fechaDe(f))];

  return (
    <>
      <Encabezado sub="Personas que ya saben cuidar y se ofrecen a otras familias" titulo="Red de cuidado" />

      <div className="grid gap-4 lg:grid-cols-3">
        <TechTag k="red-perfiles">
          <Tarjeta titulo="Mi participación" accion={<Link href="/perfil" className="text-sm font-medium text-muted">Ajustar</Link>}>
            {usuario.ofreceAyuda.activo ? (
              <>
                <Pill tono="green">Disponible en la red</Pill>
                <p className="text-sm text-ink-2">
                  Recibes solicitudes de familias a {usuario.ofreceAyuda.radioKm} km o menos, por {usuario.ofreceAyuda.modalidades.join(", ")}
                  {usuario.ofreceAyuda.modalidades.includes("pago") ? ` ($${usuario.ofreceAyuda.tarifaHora} por hora)` : ""}.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-2">No apareces en la red. Actívalo en tu perfil para recibir solicitudes de relevo de otras familias y convertir tus horas en ingreso.</p>
                <Link href="/perfil" className={`${btnPrimary} self-start`}>Ofrecer ayuda</Link>
              </>
            )}
          </Tarjeta>
        </TechTag>

        <Tarjeta titulo="Solicitudes que recibiste" className="lg:col-span-2">
          {recibidas.length === 0 && <Vacio>Aún no recibes solicitudes. Cuando una familia cercana te pida un relevo, aparece aquí.</Vacio>}
          <ul className="flex flex-col divide-y divide-line-soft">
            {recibidas.map((s) => {
              const r = db.relevos.find((x) => x.id === s.relevoId);
              const fam = db.familias.find((f) => f.id === s.familiaId);
              const pac = db.pacientes.find((p) => p.familiaId === s.familiaId);
              const dist = fam ? km(fam.hogar, usuario.ubicacion).toFixed(1) : "?";
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{fam?.nombre} · {r ? `${diaTxt(r.fecha)} ${rangoRelevo(r)}` : ""}</span>
                    <span className="text-muted">
                      Cuidar a {pac?.nombre} ({pac?.edad} años) · a {dist} km · {s.pago}
                      {s.pago === "pago" ? ` $${s.monto} MXN` : ""}
                    </span>
                  </span>
                  {s.estado === "enviada" ? (
                    <span className="flex gap-2">
                      <button type="button" className={btnPrimary} onClick={() => responderSolicitud(s.id, true)}>Aceptar</button>
                      <button type="button" className={btnSecondary} onClick={() => responderSolicitud(s.id, false)}>No puedo</button>
                    </span>
                  ) : (
                    <Pill tono={s.estado === "aceptada" ? "green" : "neutral"}>{s.estado}</Pill>
                  )}
                </li>
              );
            })}
          </ul>
        </Tarjeta>
      </div>

      {familia && (
        <TechTag k="red-externa" className="mt-4">
          <Tarjeta titulo={`Personas de la red cerca de ${familia.nombre}`}>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label htmlFor="radio-red" className="font-medium">Radio: {radio} km</label>
              <input id="radio-red" type="range" min={1} max={12} value={radio} onChange={(e) => setRadio(Number(e.target.value))} className="w-48 accent-primario" />
              <span className="text-muted">{cercanos.length} perfiles</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
              <MapaDinamico
                centro={familia.hogar}
                zoom={radio > 6 ? 12 : 13}
                radioKm={radio}
                seleccionado={sel}
                onSelect={setSel}
                puntos={[
                  { id: "hogar", lat: familia.hogar.lat, lng: familia.hogar.lng, titulo: `Hogar de ${familia.nombre}`, tipo: "hogar" },
                  ...cercanos.map((c) => ({ id: c.usuario.id, lat: c.usuario.ubicacion.lat, lng: c.usuario.ubicacion.lng, titulo: c.usuario.nombre, detalle: `${c.distancia.toFixed(1)} km`, tipo: "persona" as const })),
                ]}
              />
              <ul className="flex flex-col gap-2">
                {cercanos.length === 0 && <Vacio>Nadie de la red en este radio.</Vacio>}
                {cercanos.map(({ usuario: u, distancia }) => {
                  const certs = certificadas(db, u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => setSel(u.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${sel === u.id ? "border-primario ring-1 ring-primario" : "border-line hover:border-[#c9cde0]"}`}
                      >
                        <Avatar nombre={u.nombre} tono={u.tono} size={36} />
                        <span className="flex flex-1 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                            {u.nombre} <span className="font-normal text-muted">· {distancia.toFixed(1)} km</span>
                            {certs.map((c) => <Pill key={c.id} tono="dark">{c.nombre}</Pill>)}
                          </span>
                          <span className="text-xs text-muted">{u.bio}</span>
                          <span className="flex flex-wrap gap-1">
                            {habilidades(db, u.id).map((h) => <Pill key={h.tutorial.id}>{h.tutorial.habilidad}</Pill>)}
                            {(u.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="text-xs text-muted">Para pedirle un relevo a alguien, ve a Relevos y elige un horario sin cubrir.</p>
          </Tarjeta>
        </TechTag>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import centrosData from "@/data/centros-cdmx.json";
import { km } from "@/lib/calculos";
import { MapaDinamico } from "./MapaDinamico";
import { Pill } from "./ui";

export type Centro = (typeof centrosData.centros)[number];
const TIPOS = Array.from(new Set(centrosData.centros.map((c) => c.tipo)));

// Centros cercanos al hogar con datos del DENUE (INEGI). En el MVP: SIDECU cuando se integre.
export function Centros({ hogar, onElegir, elegido }: { hogar: { lat: number; lng: number }; onElegir?: (c: Centro) => void; elegido?: string }) {
  const [tipo, setTipo] = useState<string>("Hospital");
  const [sel, setSel] = useState<string | null>(null);
  const lista = centrosData.centros
    .filter((c) => tipo === "Todos" || c.tipo === tipo)
    .map((c) => ({ ...c, d: km(hogar, c) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 12);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {["Todos", ...TIPOS].map((t) => (
          <button key={t} type="button" aria-pressed={tipo === t} onClick={() => setTipo(t)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tipo === t ? "border-primario bg-primario text-white" : "border-line bg-white"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <MapaDinamico
          centro={hogar}
          zoom={13}
          alto={380}
          seleccionado={sel}
          onSelect={setSel}
          puntos={[
            { id: "hogar", lat: hogar.lat, lng: hogar.lng, titulo: "Hogar", tipo: "hogar" },
            ...lista.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, titulo: c.nombre, detalle: `${c.tipo} · ${c.d.toFixed(1)} km`, tipo: c.tipo === "Hospital" || c.tipo === "Ambulancias" ? ("urgencia" as const) : ("centro" as const) })),
          ]}
        />
        <ul className="flex max-h-[380px] flex-col gap-2 overflow-y-auto">
          {lista.map((c) => (
            <li key={c.id}>
              <div
                className={`flex flex-col gap-1 rounded-xl border p-3 text-sm ${sel === c.id || elegido === c.nombre ? "border-primario ring-1 ring-primario" : "border-line"}`}
                onMouseEnter={() => setSel(c.id)}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="shrink-0 text-xs text-muted">{c.d.toFixed(1)} km</span>
                </span>
                <span className="text-xs text-muted">{c.tipo} · {c.sector} · {c.direccion}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  {c.telefono && <a href={`tel:${c.telefono}`} className="text-xs font-semibold underline">Llamar {c.telefono}</a>}
                  {onElegir && (elegido === c.nombre ? <Pill tono="green">Elegido</Pill> : <button type="button" onClick={() => onElegir(c)} className="rounded-lg border border-line px-2 py-1 text-xs font-semibold hover:bg-chip">Llevarla aquí</button>)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted">Fuente: {centrosData.fuente}. La integración con SIDECU está pendiente de definir.</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AVISOS } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import { btnPrimary } from "./ui";

export const PUNTOS_TERMINOS = [
  { k: "datos", t: "Uso de datos", d: AVISOS.datos },
  { k: "noReemplaza", t: "No reemplaza a los expertos", d: AVISOS.noReemplaza },
  { k: "noRemuneracion", t: "Habilidades y remuneración", d: AVISOS.noRemuneracion },
] as const;

// Casillas de aceptación: se usan en el registro y en el aviso al entrar.
export function CasillasTerminos({ valor, onChange }: { valor: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <div className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line">
      {PUNTOS_TERMINOS.map((p) => (
        <label key={p.k} className="flex cursor-pointer gap-3 p-3.5">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primario" checked={!!valor[p.k]} onChange={(e) => onChange({ ...valor, [p.k]: e.target.checked })} />
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{p.t}</span>
            <span className="text-sm text-muted">{p.d}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

// Si la persona no ha aceptado (por ejemplo, entró por un QR o una invitación), se le pide al entrar.
export function AvisoTerminos() {
  const { usuario, actualizarPerfil } = useData();
  const [v, setV] = useState<Record<string, boolean>>({});
  if (!usuario || usuario.aceptoTerminos) return null;
  const todo = PUNTOS_TERMINOS.every((p) => v[p.k]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-[2px] md:items-center md:p-6">
      <div role="dialog" aria-modal="true" aria-label="Antes de empezar" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl md:max-w-lg md:rounded-3xl">
        <h2 className="text-xl font-semibold">Antes de empezar, {usuario.nombre.split(" ")[0]}</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Para usar Respira necesitamos que aceptes estos tres puntos.</p>
        <CasillasTerminos valor={v} onChange={setV} />
        <button type="button" className={`${btnPrimary} mt-4 w-full`} disabled={!todo} onClick={() => actualizarPerfil({ aceptoTerminos: new Date().toISOString().slice(0, 19) })}>
          Acepto y continúo
        </button>
      </div>
    </div>
  );
}

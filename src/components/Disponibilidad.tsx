"use client";

import { DIAS } from "@/lib/catalogos";
import { horaTexto } from "@/lib/calculos";
import type { Disponibilidad } from "@/lib/types";

const HORAS = Array.from({ length: 25 }, (_, i) => i);

// Editor simple: por cada día, un rango de horas en que la persona puede cuidar.
export function DisponibilidadEditor({ valor, onChange }: { valor: Disponibilidad; onChange: (d: Disponibilidad) => void }) {
  const set = (dia: number, rango: { inicio: number; fin: number } | null) => {
    const next: Disponibilidad = { ...valor, [dia]: rango ? [rango] : [] };
    onChange(next);
  };
  return (
    <div className="flex flex-col divide-y divide-line-soft overflow-hidden rounded-xl border border-line bg-white">
      {DIAS.map((d, i) => {
        const r = valor[i]?.[0];
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 px-3 py-2">
            <label className="flex w-20 cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-primario" checked={!!r} onChange={(e) => set(i, e.target.checked ? { inicio: 8, fin: 14 } : null)} />
              {d}
            </label>
            {r ? (
              <div className="flex items-center gap-2 text-sm">
                <label className="sr-only-text" htmlFor={`ini-${i}`}>Desde</label>
                <select id={`ini-${i}`} className="h-9 rounded-lg border border-line bg-white px-2" value={r.inicio} onChange={(e) => set(i, { inicio: Number(e.target.value), fin: Math.max(Number(e.target.value) + 1, r.fin) })}>
                  {HORAS.slice(0, 24).map((h) => <option key={h} value={h}>{horaTexto(h)}</option>)}
                </select>
                <span className="text-muted">a</span>
                <label className="sr-only-text" htmlFor={`fin-${i}`}>Hasta</label>
                <select id={`fin-${i}`} className="h-9 rounded-lg border border-line bg-white px-2" value={r.fin} onChange={(e) => set(i, { inicio: r.inicio, fin: Number(e.target.value) })}>
                  {HORAS.filter((h) => h > r.inicio).map((h) => <option key={h} value={h}>{h === 24 ? "24:00" : horaTexto(h)}</option>)}
                </select>
              </div>
            ) : (
              <span className="text-sm text-muted">No disponible</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function resumenDisponibilidad(d: Disponibilidad) {
  const partes = DIAS.map((dia, i) => (d[i]?.[0] ? `${dia} ${d[i][0].inicio}-${d[i][0].fin}` : null)).filter(Boolean);
  return partes.length ? partes.join(" · ") : "Sin disponibilidad registrada";
}

"use client";

import { useState } from "react";
import { useDemo } from "@/lib/store";
import { TECH, type TechKey } from "@/lib/tech";

const MVP_STYLE: Record<string, string> = {
  Real: "bg-green-bg text-green-ink",
  "Real con datos sembrados": "bg-green-bg text-green-ink",
  Simulado: "bg-amber-bg text-amber-ink",
  "Fase posterior": "bg-chip text-ink-2",
};

// Envuelve un elemento de la interfaz. Con la capa técnica activa, lo marca y muestra
// qué módulo, datos, servicio e integración lo respaldan.
export function TechTag({ k, children, className = "" }: { k: TechKey; children: React.ReactNode; className?: string }) {
  const { state } = useDemo();
  const [open, setOpen] = useState(false);
  const item = TECH[k];
  if (!state.techMode) return <div className={className}>{children}</div>;
  return (
    <div className={`relative rounded-[20px] outline-1 outline-dashed outline-offset-4 outline-tech ${className}`}>
      {children}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="absolute -top-3 right-2 z-20 flex h-6 items-center gap-1 rounded-full bg-tech px-2 text-[11px] font-semibold text-white shadow-sm"
      >
        {item.modulos.split(" ")[0]} · {item.titulo.length > 22 ? item.titulo.slice(0, 21) + "…" : item.titulo}
      </button>
      {open && (
        <div className="glass absolute right-0 top-5 z-30 w-[300px] max-w-[85vw] rounded-2xl p-4 text-left shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="text-sm font-semibold">{item.titulo}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${MVP_STYLE[item.mvp]}`}>{item.mvp}</span>
          </div>
          <dl className="grid grid-cols-[84px_1fr] gap-x-2 gap-y-1.5 text-xs leading-snug">
            <dt className="text-muted">Módulo</dt>
            <dd>{item.modulos}</dd>
            <dt className="text-muted">Datos</dt>
            <dd>{item.datos}</dd>
            <dt className="text-muted">Servicio</dt>
            <dd className="break-words">{item.servicio}</dd>
            <dt className="text-muted">Integración</dt>
            <dd>{item.integracion}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

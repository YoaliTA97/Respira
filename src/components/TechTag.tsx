"use client";

import { useState } from "react";
import { useData } from "@/lib/db";
import { TECH, type EstadoAhora, type TechKey } from "@/lib/tech";

export const ESTADO_ESTILO: Record<EstadoAhora, string> = {
  Operando: "bg-green-bg text-green-ink",
  "Operando si se configura": "bg-amber-bg text-amber-ink",
  Simulado: "bg-chip text-ink-2",
};

// Con la capa técnica activa, marca el elemento y muestra qué lo respalda y cómo opera hoy.
export function TechTag({ k, children, className = "" }: { k: TechKey; children: React.ReactNode; className?: string }) {
  const { capaTecnica } = useData();
  const [open, setOpen] = useState(false);
  if (!capaTecnica) return <div className={className}>{children}</div>;
  const item = TECH[k];
  return (
    <div className={`relative rounded-2xl outline-1 outline-dashed outline-offset-4 outline-tech ${className}`}>
      {children}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="absolute -top-3 right-3 z-20 flex h-6 max-w-[80%] items-center gap-1 truncate rounded-full bg-tech px-2.5 text-xs font-semibold text-white shadow-sm"
      >
        {item.modulos.split(" ")[0]} · {item.titulo}
      </button>
      {open && (
        <div className="glass absolute right-0 top-5 z-30 w-[320px] max-w-[85vw] rounded-2xl p-4 text-left shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="text-sm font-semibold">{item.titulo}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[item.ahora]}`}>{item.ahora}</span>
          </div>
          <p className="mb-2 text-xs leading-snug text-ink-2">{item.detalleAhora}</p>
          <dl className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1.5 text-xs leading-snug">
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

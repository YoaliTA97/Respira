"use client";

import { useId, useState } from "react";
import { useData } from "@/lib/db";
import type { Nivel, Tono } from "@/lib/types";

export const btnPrimary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primario px-4 text-sm font-semibold text-white transition hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:opacity-40";
export const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-chip disabled:cursor-not-allowed disabled:opacity-40";
export const btnDanger =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-ink px-4 text-sm font-semibold text-white transition hover:brightness-95";
export const card = "rounded-2xl border border-line bg-white";
export const label = "text-xs font-medium text-muted";
export const input = "h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-primario";

const TONO: Record<Tono, string> = {
  t1: "bg-[#2e3f8f] text-white",
  t2: "bg-[#2f7fa8] text-white",
  t3: "bg-[#e3e7f6] text-ink",
  t4: "bg-[#c9cfe6] text-ink",
  t5: "bg-[#1b1e33] text-white",
};
export const TONO_BARRA: Record<Tono, string> = { t1: "bg-[#2e3f8f]", t2: "bg-[#2f7fa8]", t3: "bg-[#9aa6d6]", t4: "bg-[#c9cfe6]", t5: "bg-[#1b1e33]" };

export function Avatar({ nombre, tono = "t1", size = 32 }: { nombre: string; tono?: Tono; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${TONO[tono]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

const NIVEL: Record<Nivel, { t: string; cls: string }> = {
  verde: { t: "Todo en orden", cls: "bg-green-bg text-green-ink" },
  amarillo: { t: "Vuelve a revisar", cls: "bg-amber-bg text-amber-ink" },
  rojo: { t: "Alerta grave", cls: "bg-red-bg text-red-ink" },
};

export function NivelPill({ nivel, texto }: { nivel: Nivel; texto?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${NIVEL[nivel].cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {texto ?? NIVEL[nivel].t}
    </span>
  );
}

export function Pill({ children, tono = "neutral" }: { children: React.ReactNode; tono?: "neutral" | "green" | "amber" | "red" | "outline" | "dark" }) {
  const s = {
    neutral: "bg-chip text-ink-2",
    green: "bg-green-bg text-green-ink",
    amber: "bg-amber-bg text-amber-ink",
    red: "bg-red-bg text-red-ink",
    outline: "border border-line text-ink-2",
    dark: "bg-primario text-white",
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s[tono]}`}>{children}</span>;
}

export function Chip({ activo, onClick, children }: { activo?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-3.5 text-sm font-medium transition ${activo ? "border-primario bg-primario text-white" : "border-line bg-white text-ink hover:bg-chip"}`}
    >
      {children}
    </button>
  );
}

// Etiquetas: opciones sugeridas que se prenden/apagan y cualquier otra que la persona escriba
// (Enter, coma o el botón Agregar). Las sugerencias del autocompletado no limitan lo que se escribe.
export function Etiquetas({
  valor,
  onChange,
  opciones = [],
  sugerencias = [],
  nombre = (v) => v,
  normalizar = (t) => t.trim(),
  placeholder = "Escribe otra y presiona Enter",
  etiqueta,
  disabled,
}: {
  valor: string[];
  onChange: (v: string[]) => void;
  opciones?: string[];
  sugerencias?: string[];
  nombre?: (v: string) => string;
  normalizar?: (t: string) => string;
  placeholder?: string;
  etiqueta: string;
  disabled?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const listaId = useId();
  const igual = (a: string, b: string) => a.localeCompare(b, "es", { sensitivity: "base" }) === 0;
  const tiene = (v: string) => valor.some((x) => igual(x, v));
  const alternar = (v: string) => onChange(tiene(v) ? valor.filter((x) => !igual(x, v)) : [...valor, v]);
  const agregar = () => {
    const nuevos = texto.split(",").map(normalizar).filter((t) => t && !tiene(t));
    if (nuevos.length) onChange([...valor, ...Array.from(new Set(nuevos))]);
    setTexto("");
  };
  const propias = valor.filter((v) => !opciones.some((o) => igual(o, v)));
  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1.5" aria-label={etiqueta}>
        {valor.length === 0 ? <span className="text-sm text-muted">Sin registrar</span> : valor.map((v) => <Pill key={v} tono="outline">{nombre(v)}</Pill>)}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={etiqueta}>
        {opciones.map((o) => <Chip key={o} activo={tiene(o)} onClick={() => alternar(o)}>{nombre(o)}</Chip>)}
        {propias.map((v) => (
          <span key={v} className="inline-flex min-h-[40px] items-center gap-0.5 rounded-full border border-primario bg-primario pl-3.5 pr-1 text-sm font-medium text-white">
            {nombre(v)}
            <button type="button" aria-label={`Quitar ${nombre(v)}`} onClick={() => alternar(v)} className="grid h-8 w-8 place-items-center rounded-full text-base leading-none hover:bg-white/15">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={`${input} flex-1`}
          aria-label={`Agregar a ${etiqueta.toLowerCase()}`}
          list={sugerencias.length ? listaId : undefined}
          placeholder={placeholder}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              agregar();
            }
          }}
        />
        <button type="button" className={btnSecondary} disabled={!texto.trim()} onClick={agregar}>Agregar</button>
      </div>
      {sugerencias.length > 0 && (
        <datalist id={listaId}>
          {sugerencias.filter((s) => !tiene(s)).map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
    </div>
  );
}

export function Segmentado<T extends string | number>({ opciones, valor, onChange, etiqueta }: { opciones: { v: T; t: string }[]; valor: T; onChange: (v: T) => void; etiqueta: string }) {
  return (
    <div role="group" aria-label={etiqueta} className="flex gap-1 rounded-xl bg-chip p-1">
      {opciones.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          aria-pressed={valor === o.v}
          onClick={() => onChange(o.v)}
          className={`min-h-[38px] flex-1 rounded-lg px-3 text-sm ${valor === o.v ? "border border-line bg-white font-semibold" : "font-medium text-muted"}`}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

export function Encabezado({ titulo, sub, acciones }: { titulo: string; sub?: string; acciones?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        {sub && <p className="text-sm text-muted">{sub}</p>}
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{titulo}</h1>
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Tarjeta({ titulo, accion, children, className = "" }: { titulo?: string; accion?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${card} flex flex-col gap-3 p-5 ${className}`}>
      {(titulo || accion) && (
        <div className="flex items-center justify-between gap-3">
          {titulo && <h2 className="text-[15px] font-semibold">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Aviso() {
  const { aviso } = useData();
  if (!aviso) return null;
  return (
    <div role="status" className="glass fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg md:bottom-6">
      {aviso}
    </div>
  );
}

export function Modal({ abierto, onCerrar, titulo, children }: { abierto: boolean; onCerrar: () => void; titulo: string; children: React.ReactNode }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-[2px] md:items-center md:p-6" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl md:max-w-lg md:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-chip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

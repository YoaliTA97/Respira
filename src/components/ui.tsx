"use client";

import Link from "next/link";
import type { Nivel, Tone } from "@/lib/types";
import { NIVEL_UI } from "@/lib/rules";
import { useDemo } from "@/lib/store";

export const btnPrimary =
  "inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-ink px-5 text-[15px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40";
export const btnSecondary =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-chip";
export const card = "rounded-[18px] border border-line bg-white p-4";
export const label = "text-xs font-medium text-muted";
export const input =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-ink";

const TONE: Record<Tone, string> = {
  dark: "bg-tone-dark text-white",
  mid: "bg-tone-mid text-white",
  light: "bg-tone-light text-ink",
};

export function Avatar({ nombre, tone = "dark", size = 32 }: { nombre: string; tone?: Tone; size?: number }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${TONE[tone]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {nombre.slice(0, 1)}
    </span>
  );
}

export function StatusPill({ nivel }: { nivel: Nivel }) {
  const ui = NIVEL_UI[nivel];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ui.bg} ${ui.ink}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {ui.etiqueta}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "outline" }) {
  const styles = {
    neutral: "bg-chip text-ink-2",
    green: "bg-green-bg text-green-ink",
    amber: "bg-amber-bg text-amber-ink",
    red: "bg-red-bg text-red-ink",
    outline: "border border-line text-ink-2",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-[40px] rounded-full border px-3.5 text-sm font-medium transition ${
        selected ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-chip"
      }`}
    >
      {children}
    </button>
  );
}

export function WizardHeader({
  titulo,
  paso,
  pasos,
  volver,
  onVolver,
  salir = "/app",
}: {
  titulo: string;
  paso: number;
  pasos: string[];
  volver?: string;
  onVolver?: () => void;
  salir?: string;
}) {
  const BackIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {onVolver ? (
          <button type="button" onClick={onVolver} aria-label="Paso anterior" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white">
            {BackIcon}
          </button>
        ) : (
          <Link href={volver ?? salir} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white">
            {BackIcon}
          </Link>
        )}
        <span className="text-[13px] font-medium text-muted">
          {titulo} · paso {paso} de {pasos.length}
        </span>
        <Link href={salir} className="flex min-h-[44px] items-center text-sm font-medium text-muted">
          Salir
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
          {pasos.map((p, i) => (
            <span key={p} className={`h-1 rounded-full ${i < paso ? "bg-ink" : "bg-[#e0e0dd]"}`} />
          ))}
        </div>
        <div className="grid gap-1.5 text-xs text-muted" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
          {pasos.map((p, i) => (
            <span key={p} className={i === paso - 1 ? "font-semibold text-ink" : ""}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass sticky bottom-3 z-10 mx-0 mt-auto flex flex-col gap-2 rounded-[22px] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {children}
    </div>
  );
}

export function ToastView() {
  const { toast } = useDemo();
  if (!toast) return null;
  return (
    <div role="status" className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg">
      {toast.texto}
    </div>
  );
}

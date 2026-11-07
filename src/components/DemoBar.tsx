"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Guion" },
  { href: "/app", label: "App familia" },
  { href: "/app/whatsapp", label: "WhatsApp" },
  { href: "/panel", label: "Paneles" },
  { href: "/tecnico", label: "Mapa técnico" },
];

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#171717" />
      <path d="M9 22c3.5-7 7.5-7 11 0s7.5 7 11 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function DemoBar() {
  const pathname = usePathname();
  const { state, setTech, reset } = useDemo();
  const activo = (href: string) =>
    href === "/" ? pathname === "/" : href === "/app" ? pathname === "/app" || (pathname.startsWith("/app/") && !pathname.startsWith("/app/whatsapp")) : pathname.startsWith(href);

  return (
    <header className="glass-canvas sticky top-0 z-40 border-b border-black/5">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-[17px] font-semibold tracking-tight">Respira</span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">Demo</span>
        </Link>
        <nav aria-label="Secciones de la demo" className="flex flex-wrap gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={activo(l.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activo(l.href) ? "bg-black/[0.06] text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <span className={state.techMode ? "text-tech" : "text-muted"}>Capa técnica</span>
            <button
              type="button"
              role="switch"
              aria-checked={state.techMode}
              onClick={() => setTech(!state.techMode)}
              className={`relative h-6 w-11 rounded-full transition ${state.techMode ? "bg-tech" : "bg-[#d4d4d2]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${state.techMode ? "left-[22px]" : "left-0.5"}`} />
              <span className="sr-only-text">Mostrar capa técnica</span>
            </button>
          </label>
          <button type="button" onClick={reset} className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:text-ink">
            Reiniciar
          </button>
        </div>
      </div>
    </header>
  );
}

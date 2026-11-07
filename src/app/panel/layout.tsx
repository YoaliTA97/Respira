"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/panel", label: "Promotora", sub: "Alertas y prácticas" },
  { href: "/panel/cooperativa", label: "Cooperativa", sub: "Relevos y bolsa de horas" },
  { href: "/panel/indicadores", label: "Indicadores", sub: "DIF y municipio" },
];

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-wrap gap-6 px-4 py-6">
      <aside className="flex-[1_1_220px] md:max-w-[240px]">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Paneles web</p>
        <nav aria-label="Paneles" className="flex flex-row flex-wrap gap-1 md:flex-col">
          {NAV.map((n) => {
            const activo = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={activo ? "page" : undefined}
                className={`flex flex-col rounded-xl px-3 py-2 transition ${activo ? "bg-black/[0.06]" : "hover:bg-black/[0.03]"}`}
              >
                <span className="text-sm font-semibold">{n.label}</span>
                <span className="text-xs text-muted">{n.sub}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-[999_1_560px]">{children}</main>
    </div>
  );
}

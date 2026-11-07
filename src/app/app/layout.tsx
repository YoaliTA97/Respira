"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GuionLista } from "@/components/Guion";

const TABS = [
  { href: "/app", label: "Inicio", icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> },
  { href: "/app/registrar", label: "Registrar", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></> },
  { href: "/app/turnos", label: "Turnos", icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
  { href: "/app/relevo", label: "Red", icon: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /></> },
  { href: "/app/pasaporte", label: "Pasaporte", icon: <><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 17h8" /></> },
];

const SIN_TABS = ["/app/crear-red", "/app/registrar", "/app/relevo", "/app/whatsapp"];

function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Secciones de la app" className="glass sticky bottom-3 z-20 mt-4 flex h-[68px] gap-0.5 rounded-3xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {TABS.map((t) => {
        const activo = t.href === "/app" ? pathname === "/app" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={activo ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] text-[11px] ${
              activo ? "bg-black/[0.06] font-semibold text-ink" : "font-medium text-muted"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {t.icon}
            </svg>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  const pathname = usePathname();
  const conTabs = !SIN_TABS.some((r) => pathname.startsWith(r));
  return (
    <div className="flex flex-1 justify-center gap-10 md:px-6 md:py-8">
      <aside className="hidden w-[300px] shrink-0 lg:block">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Guion de la demo</p>
        <GuionLista />
      </aside>
      <div className="relative w-full bg-canvas md:h-[844px] md:w-[390px] md:shrink-0 md:overflow-hidden md:rounded-[44px] md:border md:border-line md:shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
        <div className="md:h-full md:overflow-y-auto">
          <div className="flex min-h-full flex-col px-4 pb-4">
            <div className="flex flex-1 flex-col">{children}</div>
            {conTabs && <TabBar pathname={pathname} />}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/lib/db";
import { relevoActual } from "@/lib/calculos";
import { SECCION_DE_RUTA, acceso } from "@/lib/acceso";
import { ROL_TEXTO } from "@/lib/types";
import { AlertaGrave } from "./AlertaGrave";
import { BotonPanico } from "./BotonPanico";
import { Campana } from "./Notificaciones";
import { AvisoTerminos } from "./Terminos";
import { Logo } from "./Logo";
import { Avatar } from "./ui";

type Item = { href: string; t: string; icon: React.ReactNode; badge?: number };

const I = {
  inicio: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  red: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    </>
  ),
  capacitacion: (
    <>
      <path d="M3 8l9-4 9 4-9 4z" />
      <path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5" />
    </>
  ),
  resumen: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  integrantes: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="4.5" cy="6" r="2" />
      <circle cx="19.5" cy="6" r="2" />
      <circle cx="12" cy="20.5" r="2" />
      <path d="M6.2 7.2l3.8 3M17.8 7.2l-3.8 3M12 14.5v4" />
    </>
  ),
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  relevos: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  paciente: <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />,
  alertas: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  valoracion: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v3H9zM9 13l2 2 4-4" />
    </>
  ),
  seguimiento: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  equipo: (
    <>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v3a4 4 0 0 0 8 0v-2" />
      <circle cx="18" cy="12" r="2" />
    </>
  ),
  cv: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 12h7M9 16h7M9 8h3" />
    </>
  ),
  gastos: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  voz: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
};

function Icono({ d }: { d: React.ReactNode }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { db, ahora, usuario, familia, membresia, paciente, misFamilias, invitaciones, capaTecnica, setCapaTecnica, cerrarSesion, cambiarFamilia } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [espacios, setEspacios] = useState(false);

  useEffect(() => {
    if (!usuario) router.replace("/login");
  }, [usuario, router]);
  if (!usuario) return null;

  const alertasActivas = familia ? db.alertas.filter((a) => a.familiaId === familia.id && a.estado === "activa").length : 0;
  const intercambiosPend = db.intercambios.filter((i) => i.aUsuarioId === usuario.id && i.estado === "pendiente").length;
  const solicitudesPend =
    db.solicitudes.filter((s) => s.usuarioId === usuario.id && s.estado === "enviada").length + db.prestamos.filter((p) => p.aUsuarioId === usuario.id && p.estado === "enviada").length;
  const porConfirmar = familia ? db.evidencias.filter((e) => e.familiaId === familia.id && !e.confirmadaPor && e.porUsuarioId !== usuario.id).length : 0;
  const turno = familia ? relevoActual(db, familia.id, ahora) : null;
  const deTurno = turno ? db.usuarios.find((u) => u.id === turno.asignadoA)?.nombre.split(" ")[0] : null;

  const personal: Item[] = [
    { href: "/inicio", t: "Inicio", icon: I.inicio, badge: invitaciones.length + intercambiosPend },
    { href: "/perfil", t: "Mi perfil", icon: I.perfil },
    { href: "/pasaporte", t: "Pasaporte de Cuidado", icon: I.capacitacion },
    { href: "/cv", t: "Mi CV de cuidado", icon: I.cv },
    { href: "/red", t: "Red de cuidado", icon: I.red, badge: solicitudesPend },
    { href: "/capacitacion", t: "Capacitación", icon: I.capacitacion },
  ];
  const esPersona = membresia?.rol === "persona";
  const itemVoz: Item = { href: "/mi-voz", t: esPersona ? "Mi voz" : `Voz de ${paciente?.nombre ?? "la persona"}`, icon: I.voz };
  const espacio: Item[] = familia
    ? [
        ...(esPersona ? [itemVoz] : []),
        { href: "/familia", t: "Resumen", icon: I.resumen },
        ...(esPersona ? [] : [itemVoz]),
        { href: "/integrantes", t: "Integrantes y roles", icon: I.integrantes },
        { href: "/chat", t: "Chat y reportes", icon: I.chat },
        { href: "/valoracion", t: "Valoración", icon: I.valoracion },
        { href: "/seguimiento", t: "Seguimiento y evidencia", icon: I.seguimiento, badge: porConfirmar },
        { href: "/relevos", t: "Relevos", icon: I.relevos },
        { href: "/paciente", t: paciente?.nombre ?? "Persona mayor", icon: I.paciente },
        { href: "/equipo", t: "Equipo médico", icon: I.equipo },
        { href: "/gastos", t: "Gastos del cuidado", icon: I.gastos },
        { href: "/alertas", t: "Alertas y centros", icon: I.alertas, badge: alertasActivas },
      ]
    : [];
  const movil: Item[] = familia
    ? [
        { href: "/inicio", t: "Inicio", icon: I.inicio, badge: invitaciones.length + intercambiosPend },
        { href: "/chat", t: "Chat", icon: I.chat },
        esPersona ? { href: "/mi-voz", t: "Mi voz", icon: I.voz } : { href: "/valoracion", t: "Valorar", icon: I.valoracion },
        { href: "/alertas", t: "Alertas", icon: I.alertas, badge: alertasActivas },
      ]
    : [
        { href: "/inicio", t: "Inicio", icon: I.inicio, badge: invitaciones.length },
        { href: "/perfil", t: "Perfil", icon: I.perfil },
        { href: "/red", t: "Red", icon: I.red, badge: solicitudesPend },
        { href: "/capacitacion", t: "Cursos", icon: I.capacitacion },
      ];
  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  // Solo se muestran las secciones que corresponden a los roles del perfil y del espacio.
  const visible = (it: Item) => {
    const sec = SECCION_DE_RUTA[it.href];
    return !sec || acceso(sec, usuario, membresia).ok;
  };
  const seccionActual = SECCION_DE_RUTA[pathname];
  const permiso = seccionActual ? acceso(seccionActual, usuario, membresia) : { ok: true, motivo: "" };
  const salir = () => {
    cerrarSesion();
    router.replace("/login");
  };

  const enlace = (it: Item) => (
    <Link
      key={it.href}
      href={it.href}
      onClick={() => setMenu(false)}
      aria-current={activo(it.href) ? "page" : undefined}
      className={`flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 text-sm transition ${activo(it.href) ? "bg-black/[0.06] font-semibold" : "font-medium text-ink-2 hover:bg-primario-oscuro/[0.03]"}`}
    >
      <Icono d={it.icon} />
      <span className="flex-1 truncate">{it.t}</span>
      {!!it.badge && <span className="rounded-full bg-red-ink px-1.5 text-xs font-semibold text-white">{it.badge}</span>}
    </Link>
  );

  const selector = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEspacios((v) => !v)}
        aria-expanded={espacios}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white px-2.5 py-2 text-left hover:border-[#c9cde0]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primario text-sm font-semibold text-white">{familia ? familia.nombre.replace("Familia ", "").slice(0, 1) : "+"}</span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{familia?.nombre ?? "Sin espacio familiar"}</span>
          <span className="truncate text-xs text-muted">{membresia ? ROL_TEXTO[membresia.rol].t : "Crea uno o acepta una invitación"}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M7 10l5 5 5-5" />
        </svg>
      </button>
      {espacios && (
        <div className="glass absolute inset-x-0 top-full z-50 mt-1.5 flex flex-col gap-0.5 rounded-xl p-1.5 shadow-xl">
          <p className="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Tus espacios familiares</p>
          {misFamilias.map(({ familia: f, membresia: m }) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                cambiarFamilia(f.id);
                setEspacios(false);
                router.push("/familia");
              }}
              className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-primario-oscuro/[0.04] ${f.id === familia?.id ? "font-semibold" : ""}`}
            >
              <span className="truncate">{f.nombre}</span>
              <span className="text-xs text-muted">{ROL_TEXTO[m.rol].t}</span>
            </button>
          ))}
          <Link href="/nueva-familia" onClick={() => setEspacios(false)} className="rounded-lg px-2.5 py-2 text-sm font-medium text-ink-2 hover:bg-primario-oscuro/[0.04]">
            + Crear un espacio familiar
          </Link>
        </div>
      )}
    </div>
  );

  const navLateral = (
    <nav aria-label="Secciones" className="flex flex-col gap-5">
      {selector}
      <div className="flex flex-col gap-0.5">
        <p className="mb-1 px-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Personal</p>
        {personal.filter(visible).map(enlace)}
      </div>
      {familia && (
        <div className="flex flex-col gap-0.5">
          <p className="mb-1 px-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Espacio: {familia.nombre}</p>
          {espacio.filter(visible).map(enlace)}
        </div>
      )}
    </nav>
  );

  const pie = (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <div className="flex items-center gap-2.5 px-1">
        <Avatar nombre={usuario.nombre} tono={usuario.tono} size={32} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{usuario.nombre}</span>
          <span className="truncate text-xs text-muted">{usuario.telefono}</span>
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-2 px-1 text-sm">
        <span className={capaTecnica ? "font-medium text-tech" : "text-muted"}>Capa técnica</span>
        <input type="checkbox" role="switch" checked={capaTecnica} onChange={(e) => setCapaTecnica(e.target.checked)} className="h-5 w-9 accent-[#9c2f77]" />
      </label>
      <div className="flex gap-2 px-1 text-sm">
        <Link href="/tecnico" className="text-muted hover:text-ink">Mapa técnico</Link>
        <span className="text-line">·</span>
        <button type="button" onClick={salir} className="text-muted hover:text-ink">Cerrar sesión</button>
        <span className="text-line">·</span>
        <Link href="/guion" className="text-muted hover:text-ink">Guion</Link>
        <span className="text-line">·</span>
        <Link href="/respaldo" className="text-muted hover:text-ink">Límites</Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen print:hidden w-[264px] shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-[#f3f1ea] p-3.5 md:flex">
        <div className="flex flex-col gap-5">
          <Link href="/inicio" className="flex items-center gap-2 px-2 pt-1">
            <Logo />
            <span className="font-display text-xl font-bold tracking-tight">respira</span>
          </Link>
          {navLateral}
        </div>
        {pie}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-canvas sticky top-0 z-30 print:hidden flex min-h-[56px] items-center justify-between gap-3 border-b border-black/5 px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Logo size={24} />
            <span className="font-display text-xl font-bold tracking-tight">respira</span>
          </div>
          <p className="hidden truncate text-sm text-muted md:block">
            {familia && paciente ? (
              <>
                {familia.nombre} · cuidado de <span className="font-semibold text-ink">{paciente.nombre}</span>
              </>
            ) : (
              "Tu espacio personal"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Campana />
            {familia && (
              <span className="hidden rounded-full border border-line bg-white px-3 py-1 text-xs font-medium sm:inline-flex">
                {deTurno ? `De turno: ${deTurno}` : "Sin turno ahora"}
              </span>
            )}
            <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menú" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-chip md:hidden">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12">
          {permiso.ok ? (
            children
          ) : (
            <section className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-3xl border border-line bg-white p-8 text-center">
              <h1 className="text-xl font-semibold">Esta sección no está activa para ti</h1>
              <p className="text-sm text-muted">{permiso.motivo}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/inicio" className="inline-flex min-h-[44px] items-center rounded-xl bg-primario px-4 text-sm font-semibold text-white">Ir a mi inicio</Link>
                <Link href="/perfil" className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-sm font-semibold">Revisar mis roles</Link>
              </div>
            </section>
          )}
        </main>
      </div>

      <div className="print:hidden">
        <BotonPanico />
      </div>
      <AvisoTerminos />
      <AlertaGrave />

      <nav aria-label="Navegación principal" className="glass print:hidden fixed inset-x-3 bottom-3 z-40 flex h-[64px] gap-0.5 rounded-3xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] md:hidden">
        {movil.filter(visible).map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={activo(it.href) ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] text-xs ${activo(it.href) ? "bg-black/[0.06] font-semibold" : "font-medium text-muted"}`}
          >
            <Icono d={it.icon} />
            {it.t}
            {!!it.badge && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-red-ink" />}
          </Link>
        ))}
        <button type="button" onClick={() => setMenu(true)} className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[18px] text-xs font-medium text-muted">
          <Icono d={<path d="M5 12h.01M12 12h.01M19 12h.01" />} />
          Más
        </button>
      </nav>

      {menu && (
        <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setMenu(false)}>
          <div className="absolute inset-y-0 right-0 flex w-[296px] flex-col justify-between overflow-y-auto bg-[#f3f1ea] p-4" onClick={(e) => e.stopPropagation()}>
            {navLateral}
            {pie}
          </div>
        </div>
      )}
    </div>
  );
}

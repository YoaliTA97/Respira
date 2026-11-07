"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { acceso } from "@/lib/acceso";
import { useData } from "@/lib/db";
import { ROL_TEXTO } from "@/lib/types";
import { Icono, type NombreIcono } from "./Iconos";
import { Avatar } from "./ui";

// Acciones de la cuenta, agrupadas como en una app: cuenta, espacios, presentación y salida.
// Se usa como menú desplegable (avatar) y como lista dentro del menú móvil.
export function AccionesCuenta({ alElegir }: { alElegir?: () => void }) {
  const { usuario, membresia, familia, misFamilias, capaTecnica, setCapaTecnica, cerrarSesion, cambiarFamilia } = useData();
  const router = useRouter();
  if (!usuario) return null;
  const ir = (href: string) => {
    alElegir?.();
    router.push(href);
  };
  const salir = (destino: string) => {
    alElegir?.();
    cerrarSesion();
    router.replace(destino);
  };
  const item = (icono: NombreIcono, t: string, onClick: () => void, opciones: { tono?: "normal" | "peligro"; detalle?: string; activo?: boolean } = {}) => (
    <button
      key={t}
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm transition ${opciones.tono === "peligro" ? "text-red-ink hover:bg-red-bg" : "text-ink hover:bg-primario-oscuro/[0.05]"}`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${opciones.tono === "peligro" ? "bg-red-bg text-red-ink" : opciones.activo ? "bg-primario text-white" : "bg-realce text-primario"}`}>
        <Icono n={icono} size={17} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{t}</span>
        {opciones.detalle && <span className="truncate text-xs text-muted">{opciones.detalle}</span>}
      </span>
      {opciones.activo && <Icono n="check" size={16} className="text-primario" />}
    </button>
  );
  const titulo = (t: string) => <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t}</p>;
  const verPasaporte = acceso("cv", usuario, membresia).ok;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
        <Avatar nombre={usuario.nombre} tono={usuario.tono} size={42} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{usuario.nombre}</span>
          <span className="truncate text-xs text-muted">{membresia && familia ? `${ROL_TEXTO[membresia.rol].t} · ${familia.nombre}` : "Sin espacio familiar"}</span>
          <span className="truncate text-xs text-muted">{usuario.telefono}</span>
        </span>
      </div>

      {titulo("Mi cuenta")}
      {item("perfil", "Mi perfil", () => ir("/perfil"), { detalle: "Datos, roles y disponibilidad" })}
      {verPasaporte && item("pasaporte", "Pasaporte de Cuidado", () => ir("/pasaporte"), { detalle: "Horas y certificación" })}
      {item("candado", "Seguridad y contraseña", () => ir("/perfil#seguridad"))}

      {titulo("Espacios familiares")}
      {misFamilias.map(({ familia: f, membresia: m }) =>
        item("casa", f.nombre, () => { cambiarFamilia(f.id); ir("/familia"); }, { detalle: ROL_TEXTO[m.rol].t, activo: f.id === familia?.id }),
      )}
      {item("mas", "Crear un espacio familiar", () => ir("/nueva-familia"))}

      {titulo("Presentación")}
      {item("guion", "Guion de presentación", () => ir("/guion"))}
      {item("escudo", "Límites y alcances", () => ir("/respaldo"))}
      {item("grafica", "Quién paga y el impacto", () => ir("/impacto"))}
      {item("capas", "Mapa técnico", () => ir("/tecnico"))}
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2.5 text-sm hover:bg-primario-oscuro/[0.05]">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${capaTecnica ? "bg-tech text-white" : "bg-tech-bg text-tech"}`}>
          <Icono n="capas" size={17} />
        </span>
        <span className="flex-1 font-medium">Capa técnica</span>
        <input type="checkbox" role="switch" aria-label="Capa técnica" checked={capaTecnica} onChange={(e) => setCapaTecnica(e.target.checked)} className="h-5 w-9 accent-[#9c2f77]" />
      </label>

      <div className="my-2 border-t border-line" />
      {item("cambiar", "Cambiar de cuenta", () => salir("/login"))}
      {item("salir", "Cerrar sesión", () => salir("/login"), { tono: "peligro" })}
    </div>
  );
}

// Botón con avatar que abre las acciones como menú desplegable.
export function MenuCuenta({ arriba = false, completo = false }: { arriba?: boolean; completo?: boolean }) {
  const { usuario } = useData();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => caja.current && !caja.current.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);
  if (!usuario) return null;
  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de la cuenta"
        onClick={() => setAbierto((v) => !v)}
        className={completo ? "flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left hover:bg-black/[0.04]" : "flex items-center gap-1 rounded-full border border-line bg-white py-0.5 pl-0.5 pr-1.5 hover:bg-chip"}
      >
        <Avatar nombre={usuario.nombre} tono={usuario.tono} size={completo ? 34 : 32} />
        {completo && (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{usuario.nombre}</span>
            <span className="truncate text-xs text-muted">Cuenta y ajustes</span>
          </span>
        )}
        <Icono n="chevron" size={16} className={`text-muted transition ${abierto ? "rotate-180" : ""}`} />
      </button>
      {abierto && (
        <div role="menu" className={`absolute z-50 border border-line bg-white max-h-[80vh] w-[300px] overflow-y-auto rounded-2xl p-2 shadow-xl ${arriba ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"}`}>
          <AccionesCuenta alElegir={() => setAbierto(false)} />
        </div>
      )}
    </div>
  );
}


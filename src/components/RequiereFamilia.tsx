"use client";

import Link from "next/link";
import { useData } from "@/lib/db";
import { btnPrimary, btnSecondary } from "./ui";

// El espacio familiar es privado: solo se ve con una membresía activa.
export function RequiereFamilia({ children }: { children: React.ReactNode }) {
  const { familia, paciente, invitaciones } = useData();
  if (familia && paciente) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 rounded-3xl border border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Esta sección es de un espacio familiar</h1>
      <p className="text-muted">Los espacios familiares son privados: solo entran sus integrantes. Crea uno para la persona que cuidas o acepta una invitación.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/nueva-familia" className={btnPrimary}>Crear un espacio familiar</Link>
        <Link href="/inicio" className={btnSecondary}>{invitaciones.length ? `Ver ${invitaciones.length} invitación${invitaciones.length > 1 ? "es" : ""}` : "Ir al inicio"}</Link>
      </div>
    </div>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Centros } from "@/components/Centros";
import { Logo } from "@/components/Logo";
import { SIDECU } from "@/lib/catalogos";
import { btnDanger, btnPrimary } from "@/components/ui";

// Página pública que abre el enlace del WhatsApp de alerta: no requiere sesión.
function Contenido() {
  const q = useSearchParams();
  const lat = Number(q.get("lat")) || 19.3135;
  const lng = Number(q.get("lng")) || -99.146;
  const persona = q.get("p") ?? "la persona cuidada";
  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-4 py-6">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-line bg-red-bg p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-red-ink">Alerta médica</span>
          <h1 className="text-2xl font-semibold tracking-tight">{persona} necesita atención fuera de casa</h1>
          <p className="text-sm text-ink-2">Elijan entre la familia el centro más adecuado. Si no responde o le cuesta respirar, llamen al 911.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={SIDECU.url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>Ubicar centro en {SIDECU.nombre}</a>
          <a href="tel:911" className={btnDanger}>Llamar al 911</a>
        </div>
      </section>
      <p className="text-sm text-muted">Vista previa de los centros más cercanos al hogar (datos del DENUE). El mapa oficial de centros de cuidado es el de {SIDECU.nombre}.</p>
      <Centros hogar={{ lat, lng }} />
    </div>
  );
}

export default function CentrosPublico() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Cargando centros…</p>}>
      <Contenido />
    </Suspense>
  );
}

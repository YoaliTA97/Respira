"use client";

import dynamic from "next/dynamic";

// Leaflet usa window: se carga solo en el navegador.
export const MapaDinamico = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => <div className="flex h-[320px] items-center justify-center rounded-2xl border border-line bg-white text-sm text-muted">Cargando mapa…</div>,
});
export type { PuntoMapa } from "./Mapa";

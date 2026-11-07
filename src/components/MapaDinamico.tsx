"use client";

import dynamic from "next/dynamic";
import { useState, type ComponentProps } from "react";
import MapaLocal from "./MapaLocal";

// Por defecto, el mapa esquemático local (no necesita internet ni API). Las calles reales (Leaflet
// con teselas de OpenStreetMap/CARTO) se cargan solo si se piden y hay conexión.
const MapaCalles = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => <div className="flex h-[320px] items-center justify-center rounded-2xl border border-line bg-white text-sm text-muted">Cargando mapa…</div>,
});

export function MapaDinamico(props: ComponentProps<typeof MapaLocal>) {
  const [calles, setCalles] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {calles ? <MapaCalles {...props} /> : <MapaLocal {...props} />}
      <button type="button" className="self-end text-xs text-muted underline" onClick={() => setCalles(!calles)}>
        {calles ? "Ver mapa sin conexión" : "Ver calles reales (requiere internet)"}
      </button>
    </div>
  );
}
export type { PuntoMapa } from "./Mapa";

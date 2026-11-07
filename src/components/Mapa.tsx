"use client";

import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

export type PuntoMapa = { id: string; lat: number; lng: number; titulo: string; detalle?: string; tipo: "hogar" | "persona" | "centro" | "urgencia" };

const ESTILO: Record<PuntoMapa["tipo"], { color: string; fill: string; r: number }> = {
  hogar: { color: "#ffffff", fill: "#2e3f8f", r: 9 },
  persona: { color: "#ffffff", fill: "#2f7fa8", r: 7 },
  centro: { color: "#ffffff", fill: "#565c75", r: 6 },
  urgencia: { color: "#ffffff", fill: "#b3261e", r: 7 },
};

export default function Mapa({
  centro,
  zoom = 14,
  radioKm,
  puntos,
  seleccionado,
  onSelect,
  alto = 320,
}: {
  centro: { lat: number; lng: number };
  zoom?: number;
  radioKm?: number;
  puntos: PuntoMapa[];
  seleccionado?: string | null;
  onSelect?: (id: string) => void;
  alto?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line" style={{ height: alto }}>
      <MapContainer center={[centro.lat, centro.lng]} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {radioKm !== undefined && (
          <Circle center={[centro.lat, centro.lng]} radius={radioKm * 1000} pathOptions={{ color: "#2e3f8f", weight: 1.2, dashArray: "4 4", fillColor: "#2e3f8f", fillOpacity: 0.05 }} />
        )}
        {puntos.map((p) => {
          const e = ESTILO[p.tipo];
          const sel = seleccionado === p.id;
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={sel ? e.r + 3 : e.r}
              pathOptions={{ color: sel ? "#1b1e33" : e.color, weight: sel ? 3 : 2, fillColor: e.fill, fillOpacity: 1 }}
              eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <strong>{p.titulo}</strong>
                {p.detalle ? <><br />{p.detalle}</> : null}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

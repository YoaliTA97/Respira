"use client";

import { useState } from "react";
import type { PuntoMapa } from "./Mapa";
import { useAncho } from "./Graficas";

// Mapa esquemático local (SVG): no necesita internet ni API. Ubica el hogar al centro y a cada
// persona o centro por su distancia aproximada, con el radio de búsqueda y una escala en km.
const ESTILO: Record<PuntoMapa["tipo"], { fill: string; r: number }> = {
  hogar: { fill: "#2e3f8f", r: 9 },
  persona: { fill: "#2f7fa8", r: 7 },
  centro: { fill: "#565c75", r: 5.5 },
  urgencia: { fill: "#b3261e", r: 7 },
};

export default function MapaLocal({
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
  const [ref, W] = useAncho<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const vistaKm = radioKm ? radioKm * 1.15 : Math.max(0.8, 2 ** (15 - zoom) * 1.2);
  const escala = W ? (Math.min(W, alto) / 2 - 18) / vistaKm : 1; // px por km
  const pos = (p: { lat: number; lng: number }) => ({
    x: W / 2 + (p.lng - centro.lng) * Math.cos((centro.lat * Math.PI) / 180) * 111.32 * escala,
    y: alto / 2 - (p.lat - centro.lat) * 110.57 * escala,
  });
  const paso = Math.max(28, escala * 0.3); // cuadras de ~300 m
  const barraKm = vistaKm > 4 ? 2 : vistaKm > 1.5 ? 1 : 0.5;
  const visibles = puntos.filter((p) => {
    const q = pos(p);
    return q.x > 4 && q.x < W - 4 && q.y > 4 && q.y < alto - 4;
  });
  const etiqueta = (p: PuntoMapa) => p.tipo === "hogar" || p.tipo === "persona" || p.id === seleccionado || p.id === hover;

  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl border border-line" style={{ height: alto }}>
      {W > 0 && (
        <svg width={W} height={alto} role="img" aria-label="Mapa esquemático de la zona">
          <rect width={W} height={alto} fill="#f3f1ea" />
          <g transform={`rotate(-14 ${W / 2} ${alto / 2})`} opacity={0.9}>
            {Array.from({ length: Math.ceil((W + alto) / paso) + 2 }, (_, i) => -alto + i * paso).map((v) => (
              <g key={v}>
                <line x1={v} x2={v} y1={-alto} y2={alto * 2} stroke="#ffffff" strokeWidth={4} />
                <line x1={-W} x2={W * 2} y1={v} y2={v} stroke="#ffffff" strokeWidth={4} />
              </g>
            ))}
            <line x1={-W} x2={W * 2} y1={alto * 0.32} y2={alto * 0.32} stroke="#ffffff" strokeWidth={10} />
            <line x1={W * 0.62} x2={W * 0.62} y1={-alto} y2={alto * 2} stroke="#ffffff" strokeWidth={10} />
          </g>
          {radioKm !== undefined && (
            <g>
              <circle cx={W / 2} cy={alto / 2} r={radioKm * escala} fill="#2e3f8f" fillOpacity={0.06} stroke="#2e3f8f" strokeWidth={1.2} />
              <text x={W / 2} y={alto / 2 - radioKm * escala + 14} textAnchor="middle" fontSize={11} fill="#34384f">{radioKm} km</text>
            </g>
          )}
          {visibles
            .slice()
            .sort((a, b) => (a.tipo === "centro" ? -1 : 0) - (b.tipo === "centro" ? -1 : 0))
            .map((p) => {
              const q = pos(p);
              const e = ESTILO[p.tipo];
              const sel = seleccionado === p.id;
              return (
                <g
                  key={p.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.titulo}${p.detalle ? `, ${p.detalle}` : ""}`}
                  onClick={() => onSelect?.(p.id)}
                  onKeyDown={(ev) => ev.key === "Enter" && onSelect?.(p.id)}
                  onPointerEnter={() => setHover(p.id)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(p.id)}
                  onBlur={() => setHover(null)}
                  style={{ cursor: onSelect ? "pointer" : "default", outline: "none" }}
                >
                  <circle cx={q.x} cy={q.y} r={14} fill="transparent" />
                  <circle cx={q.x} cy={q.y} r={sel ? e.r + 3 : e.r} fill={e.fill} stroke={sel ? "#1b1e33" : "#ffffff"} strokeWidth={sel ? 3 : 2} />
                  {etiqueta(p) && (
                    <text x={p.tipo === "hogar" ? q.x : q.x + e.r + 5} y={p.tipo === "hogar" ? q.y + e.r + 15 : q.y + 4} textAnchor={p.tipo === "hogar" ? "middle" : "start"} fontSize={11.5} fontWeight={600} fill="#1b1e33" stroke="#f3f1ea" strokeWidth={3} paintOrder="stroke">
                      {p.tipo === "hogar" ? "Hogar" : p.titulo.split(" ")[0]}
                      {(p.id === hover || sel) && p.detalle ? ` · ${p.detalle}` : ""}
                    </text>
                  )}
                </g>
              );
            })}
          <g transform={`translate(12 ${alto - 16})`}>
            <line x1={0} x2={barraKm * escala} y1={0} y2={0} stroke="#1b1e33" strokeWidth={2} />
            <line x1={0} x2={0} y1={-4} y2={4} stroke="#1b1e33" strokeWidth={2} />
            <line x1={barraKm * escala} x2={barraKm * escala} y1={-4} y2={4} stroke="#1b1e33" strokeWidth={2} />
            <text x={barraKm * escala + 6} y={4} fontSize={11} fill="#34384f">{barraKm} km</text>
          </g>
        </svg>
      )}
      <span className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-muted">Mapa esquemático · sin conexión</span>
    </div>
  );
}

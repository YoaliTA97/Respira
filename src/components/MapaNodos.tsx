"use client";

import type { Tono } from "@/lib/types";

export type Nodo = { id: string; nombre: string; detalle: string; tono: Tono; deTurno?: boolean; red?: boolean; invitado?: boolean };

const RELLENO: Record<Tono, { f: string; t: string }> = {
  t1: { f: "#2e3f8f", t: "#fff" },
  t2: { f: "#2f7fa8", t: "#fff" },
  t3: { f: "#e3e7f6", t: "#1b1e33" },
  t4: { f: "#c9cfe6", t: "#1b1e33" },
  t5: { f: "#1b1e33", t: "#fff" },
};

// La usuaria al centro, la familia alrededor y la red de apoyo en el anillo exterior.
export function MapaNodos({ centro, nodos, seleccionado, onSelect }: { centro: Nodo; nodos: Nodo[]; seleccionado: string; onSelect: (id: string) => void }) {
  const W = 640;
  const H = 440;
  const cx = W / 2;
  const cy = H / 2;
  const familia = nodos.filter((n) => !n.red);
  const red = nodos.filter((n) => n.red);
  const pos = (i: number, total: number, r: number, offset: number) => {
    const a = offset + (i / Math.max(total, 1)) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 };
  };
  const dibujar = (n: Nodo, x: number, y: number, r: number) => {
    const c = RELLENO[n.tono];
    const sel = seleccionado === n.id;
    return (
      <g key={n.id} role="button" tabIndex={0} aria-label={`${n.nombre}, ${n.detalle}`} onClick={() => onSelect(n.id)} onKeyDown={(e) => e.key === "Enter" && onSelect(n.id)} style={{ cursor: "pointer" }}>
        {n.deTurno && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="#1b6b3a" strokeWidth="2.5" />}
        <circle cx={x} cy={y} r={r} fill={n.invitado ? "#fff" : c.f} stroke={sel ? "#9c2f77" : n.invitado ? "#a8a8a5" : "#fff"} strokeWidth={sel ? 3 : 2} strokeDasharray={n.invitado ? "4 3" : undefined} />
        <text x={x} y={y + r * 0.16} textAnchor="middle" fontSize={r * 0.62} fontWeight="600" fill={n.invitado ? "#565c75" : c.t}>
          {n.nombre.slice(0, 1)}
        </text>
        <text x={x} y={y + r + 16} textAnchor="middle" fontSize="13" fontWeight="600" fill="#1b1e33">{n.nombre.split(" ")[0]}</text>
        <text x={x} y={y + r + 31} textAnchor="middle" fontSize="11.5" fill="#565c75">{n.detalle}</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa de nodos de la red de cuidado">
      <ellipse cx={cx} cy={cy} rx={150} ry={150 * 0.82} fill="none" stroke="#e1e3ec" />
      {red.length > 0 && <ellipse cx={cx} cy={cy} rx={250} ry={250 * 0.82} fill="none" stroke="#e1e3ec" strokeDasharray="4 5" />}
      {familia.map((n, i) => {
        const p = pos(i, familia.length, 150, -Math.PI / 2);
        return <line key={`l-${n.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#c9cde0" strokeWidth="1.5" strokeDasharray={n.invitado ? "4 4" : undefined} />;
      })}
      {red.map((n, i) => {
        const p = pos(i, red.length, 250, -Math.PI / 4);
        return <line key={`l-${n.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2f7fa8" strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="3 4" />;
      })}
      {dibujar(centro, cx, cy, 34)}
      {familia.map((n, i) => {
        const p = pos(i, familia.length, 150, -Math.PI / 2);
        return dibujar(n, p.x, p.y, 26);
      })}
      {red.map((n, i) => {
        const p = pos(i, red.length, 250, -Math.PI / 4);
        return dibujar(n, p.x, p.y, 20);
      })}
    </svg>
  );
}

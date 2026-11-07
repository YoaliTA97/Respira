"use client";

import { useEffect, useRef, useState } from "react";

// Gráficas en SVG, sin librerías. Specs: barras ≤ 24px con remate redondeado de 4px y base
// recta; líneas de 2px; marcadores ≥ 8px con anillo de 2px del color de superficie; rejilla
// fina y sólida; el texto usa tinta, nunca el color de la serie; tooltip al pasar o enfocar;
// tabla oculta para lectores de pantalla.
// Paleta categórica validada (validate_palette.js, modo claro): pasa banda, croma, CVD y visión
// normal; aqua y magenta < 3:1 de contraste → siempre llevan leyenda y etiqueta visible.
export const SERIES = ["#3b62c4", "#eb6834", "#1baf7a", "#6250d6", "#e87ba4"];
const PRIMARIO = "#2e3f8f";
const RIEL = "#e3e7f6"; // paso claro de la misma rampa (track de medidores)
const REJILLA = "#e1e3ec";
const TINTA = "#1b1e33";
const TENUE = "#565c75";
const SUPERFICIE = "#ffffff";
const ALERTA = "#b3261e";

export function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

type Tip = { x: number; y: number; valor: string; nombre: string } | null;
function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-md" style={{ left: tip.x, top: tip.y - 8 }}>
      <div className="font-semibold text-ink">{tip.valor}</div>
      <div className="text-muted">{tip.nombre}</div>
    </div>
  );
}

const redondo = (v: number) => {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

// Columna con base recta y remate redondeado de 4px
const columna = (x: number, y: number, w: number, h: number) => {
  const r = Math.min(4, h, w / 2);
  return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
};

export function Columnas({
  datos,
  unidad = "",
  meta,
  alto = 150,
  titulo,
}: {
  datos: { etiqueta: string; valor: number; resaltar?: boolean }[];
  unidad?: string;
  meta?: { valor: number; etiqueta: string };
  alto?: number;
  titulo: string;
}) {
  const [ref, W] = useAncho<HTMLDivElement>();
  const [tip, setTip] = useState<Tip>(null);
  const izq = 28;
  const abajo = 22;
  const arriba = 14;
  const max = redondo(Math.max(1, ...datos.map((d) => d.valor), meta?.valor ?? 0));
  const ancho = Math.max(0, W - izq - 4);
  const banda = datos.length ? ancho / datos.length : 0;
  const bw = Math.min(24, banda * 0.6);
  const y = (v: number) => arriba + (alto - arriba - abajo) * (1 - v / max);
  const maxIdx = datos.reduce((m, d, i) => (d.valor > datos[m].valor ? i : m), 0);
  return (
    <div ref={ref} className="relative w-full">
      {W > 0 && (
        <svg width={W} height={alto} role="img" aria-label={titulo}>
          {[0, max / 2, max].map((t) => (
            <g key={t}>
              <line x1={izq} x2={W - 4} y1={y(t)} y2={y(t)} stroke={REJILLA} strokeWidth={1} />
              <text x={izq - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={TENUE}>{Math.round(t)}</text>
            </g>
          ))}
          {meta && (
            <g>
              <line x1={izq} x2={W - 4} y1={y(meta.valor)} y2={y(meta.valor)} stroke={TINTA} strokeWidth={1.5} />
              <text x={izq + 4} y={y(meta.valor) - 5} fontSize={11} fontWeight={600} fill={TINTA} stroke={SUPERFICIE} strokeWidth={3} paintOrder="stroke">{meta.etiqueta}</text>
            </g>
          )}
          {datos.map((d, i) => {
            const x = izq + banda * i + (banda - bw) / 2;
            const h = Math.max(0, y(0) - y(d.valor));
            const mostrar = i === maxIdx || i === datos.length - 1 || d.resaltar;
            return (
              <g
                key={d.etiqueta + i}
                tabIndex={0}
                onPointerEnter={() => setTip({ x: x + bw / 2, y: y(d.valor), valor: `${d.valor}${unidad}`, nombre: d.etiqueta })}
                onPointerLeave={() => setTip(null)}
                onFocus={() => setTip({ x: x + bw / 2, y: y(d.valor), valor: `${d.valor}${unidad}`, nombre: d.etiqueta })}
                onBlur={() => setTip(null)}
                style={{ outline: "none" }}
              >
                <rect x={izq + banda * i} y={arriba} width={banda} height={alto - arriba - abajo} fill="transparent" />
                {h > 0 && <path d={columna(x, y(d.valor), bw, h)} fill={d.resaltar === false ? "#c9cde0" : PRIMARIO} opacity={tip && tip.nombre !== d.etiqueta ? 0.75 : 1} />}
                {mostrar && <text x={x + bw / 2} y={y(d.valor) - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill={TINTA}>{d.valor}</text>}
                <text x={x + bw / 2} y={alto - 6} textAnchor="middle" fontSize={11} fill={TENUE}>{d.etiqueta}</text>
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} />
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>{datos.map((d, i) => <tr key={i}><th>{d.etiqueta}</th><td>{d.valor}{unidad}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function Linea({
  series,
  unidad = "",
  banda,
  corte,
  alto = 160,
  titulo,
}: {
  series: { nombre: string; color?: string; puntos: { etiqueta: string; valor: number }[] }[];
  unidad?: string;
  banda?: { min: number; max: number; etiqueta: string };
  corte?: { valor: number; etiqueta: string };
  alto?: number;
  titulo: string;
}) {
  const [ref, W] = useAncho<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const izq = 34;
  const der = 44;
  const arriba = 12;
  const abajo = 22;
  const etiquetas = series[0]?.puntos.map((p) => p.etiqueta) ?? [];
  const vals = series.flatMap((s) => s.puntos.map((p) => p.valor));
  const lo = Math.min(...vals, banda?.min ?? Infinity, corte?.valor ?? Infinity);
  const hi = Math.max(...vals, banda?.max ?? -Infinity, corte?.valor ?? -Infinity);
  const pad = (hi - lo) * 0.12 || 5;
  const y0 = Math.floor(lo - pad);
  const y1 = Math.ceil(hi + pad);
  const n = Math.max(1, etiquetas.length - 1);
  const x = (i: number) => izq + ((W - izq - der) * i) / n;
  const y = (v: number) => arriba + (alto - arriba - abajo) * (1 - (v - y0) / (y1 - y0 || 1));
  const fuera = (v: number) => !!banda && (v < banda.min || v > banda.max);
  return (
    <div ref={ref} className="relative w-full">
      {W > 0 && etiquetas.length > 0 && (
        <svg width={W} height={alto} role="img" aria-label={titulo} onPointerLeave={() => setHover(null)}>
          {banda && (
            <g>
              <rect x={izq} width={W - izq - der} y={y(banda.max)} height={Math.max(0, y(banda.min) - y(banda.max))} fill="#eef0f7" />
              <text x={izq + 4} y={y(banda.max) + 12} fontSize={10.5} fill={TENUE}>{banda.etiqueta}</text>
            </g>
          )}
          {[y0, Math.round((y0 + y1) / 2), y1].map((t) => (
            <g key={t}>
              <line x1={izq} x2={W - der} y1={y(t)} y2={y(t)} stroke={REJILLA} strokeWidth={1} />
              <text x={izq - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={TENUE}>{t}</text>
            </g>
          ))}
          {corte && (
            <g>
              <line x1={izq} x2={W - der} y1={y(corte.valor)} y2={y(corte.valor)} stroke={TINTA} strokeWidth={1.5} />
              <text x={W - der + 4} y={y(corte.valor) + 4} fontSize={10.5} fontWeight={600} fill={TINTA}>{corte.etiqueta}</text>
            </g>
          )}
          {etiquetas.map((e, i) => (i === 0 || i === etiquetas.length - 1 || etiquetas.length <= 6 ? <text key={e + i} x={x(i)} y={alto - 6} textAnchor="middle" fontSize={11} fill={TENUE}>{e}</text> : null))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={arriba} y2={alto - abajo} stroke={TENUE} strokeWidth={1} />}
          {series.map((s, si) => {
            const c = s.color ?? (series.length === 1 ? PRIMARIO : SERIES[si % SERIES.length]);
            const d = s.puntos.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.valor)}`).join(" ");
            const ult = s.puntos.at(-1);
            return (
              <g key={s.nombre}>
                <path d={d} fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {s.puntos.map((p, i) => (
                  <circle key={i} cx={x(i)} cy={y(p.valor)} r={hover === i || fuera(p.valor) || i === s.puntos.length - 1 ? 5 : 3.5} fill={fuera(p.valor) ? ALERTA : c} stroke={SUPERFICIE} strokeWidth={2} />
                ))}
                {ult && <text x={x(s.puntos.length - 1) + 8} y={y(ult.valor) + 4} fontSize={11} fontWeight={600} fill={TINTA}>{ult.valor}</text>}
              </g>
            );
          })}
          {etiquetas.map((e, i) => (
            <rect
              key={`h-${i}`}
              x={x(i) - (W - izq - der) / n / 2}
              width={(W - izq - der) / n}
              y={arriba}
              height={alto - arriba - abajo}
              fill="transparent"
              tabIndex={0}
              aria-label={`${e}: ${series.map((s) => `${s.nombre} ${s.puntos[i]?.valor}${unidad}`).join(", ")}`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{ outline: "none" }}
            />
          ))}
        </svg>
      )}
      {hover !== null && W > 0 && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs shadow-md" style={{ left: x(hover), top: 0 }}>
          <div className="mb-0.5 text-muted">{etiquetas[hover]}</div>
          {series.map((s, si) => (
            <div key={s.nombre} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3" style={{ background: s.color ?? (series.length === 1 ? PRIMARIO : SERIES[si % SERIES.length]) }} />
              <span className="font-semibold text-ink">{s.puntos[hover]?.valor}{unidad}</span>
              {series.length > 1 && <span className="text-muted">{s.nombre}</span>}
            </div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-2">
          {series.map((s, si) => (
            <span key={s.nombre} className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4" style={{ background: s.color ?? SERIES[si % SERIES.length] }} />{s.nombre}</span>
          ))}
        </div>
      )}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>{etiquetas.map((e, i) => <tr key={i}><th>{e}</th>{series.map((s) => <td key={s.nombre}>{s.puntos[i]?.valor}{unidad}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

// Medidor: un valor contra su límite. El relleno lleva el estado; el riel es un paso claro de la misma rampa.
export function Medidor({ valor, max, titulo, estado = "ok" }: { valor: number; max: number; titulo: string; estado?: "ok" | "aviso" | "alerta" }) {
  const pct = Math.max(0, Math.min(100, (valor / (max || 1)) * 100));
  const color = estado === "alerta" ? ALERTA : estado === "aviso" ? "#8a5300" : PRIMARIO;
  return (
    <div role="meter" aria-label={titulo} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={max} className="h-2 w-full rounded-full" style={{ background: RIEL }} title={`${titulo}: ${valor} de ${max}`}>
      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// Barras segmentadas (100%): cómo se reparte un total, para comparar varios totales (antes / ahora).
export function Segmentadas({ filas, titulo }: { filas: { nombre: string; partes: { nombre: string; valor: number }[] }[]; titulo: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; texto: string } | null>(null);
  const nombres = Array.from(new Set(filas.flatMap((f) => f.partes.map((p) => p.nombre))));
  const color = (n: string) => SERIES[nombres.indexOf(n) % SERIES.length];
  return (
    <div className="relative flex flex-col gap-2.5" role="img" aria-label={titulo}>
      {filas.map((f) => {
        const total = f.partes.reduce((a, p) => a + p.valor, 0) || 1;
        return (
          <div key={f.nombre} className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-2">{f.nombre}</span>
            <div className="flex h-7 w-full gap-[2px]">
              {f.partes.filter((p) => p.valor > 0).map((p) => {
                const pct = Math.round((p.valor / total) * 100);
                const oscuro = ["#3b62c4", "#6250d6", "#eb6834"].includes(color(p.nombre));
                return (
                  <div
                    key={p.nombre}
                    tabIndex={0}
                    className="flex items-center overflow-visible rounded px-1.5 text-xs font-semibold outline-none"
                    style={{ width: `${(p.valor / total) * 100}%`, background: color(p.nombre), color: oscuro ? "#fff" : TINTA }}
                    onPointerEnter={(e) => setTip({ x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop, texto: `${p.nombre}: ${pct}% (${p.valor} h)` })}
                    onPointerLeave={() => setTip(null)}
                    onFocus={(e) => setTip({ x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop, texto: `${p.nombre}: ${pct}% (${p.valor} h)` })}
                    onBlur={() => setTip(null)}
                  >
                    {pct >= 12 ? `${pct}%` : ""}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-3 text-xs text-ink-2">
        {nombres.map((n) => <span key={n} className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color(n) }} />{n}</span>)}
      </div>
      {tip && <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink shadow-md" style={{ left: tip.x, top: tip.y - 6 }}>{tip.texto}</div>}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>{filas.flatMap((f) => f.partes.map((p) => <tr key={f.nombre + p.nombre}><th>{f.nombre} · {p.nombre}</th><td>{p.valor}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

export function Estrellas({ valor, n }: { valor: number; n?: number }) {
  const llenas = Math.round(valor);
  return (
    <span className="inline-flex items-center gap-1 text-xs" aria-label={`${valor.toFixed(1)} de 5${n !== undefined ? `, ${n} reseñas` : ""}`}>
      <span aria-hidden="true" className="tracking-tight text-primario">{"★".repeat(llenas)}<span className="text-line">{"★".repeat(5 - llenas)}</span></span>
      <span className="font-semibold text-ink">{valor.toFixed(1)}</span>
      {n !== undefined && <span className="text-muted">({n})</span>}
    </span>
  );
}

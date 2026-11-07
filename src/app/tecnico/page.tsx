"use client";

import Link from "next/link";
import { TECH, type EstadoAhora } from "@/lib/tech";
import { ESTADO_ESTILO } from "@/components/TechTag";
import { Logo } from "@/components/Logo";

const CAPAS = [
  { t: "Canales", d: "Web app (PWA) por perfil y espacio familiar · WhatsApp como canal de alertas · página pública de centros" },
  { t: "Acceso", d: "Perfil individual con OTP · espacios familiares privados con roles (políticas por membresía)" },
  { t: "Servicios", d: "Red familiar, relevos e intercambios, red de cuidado por radio, paciente y medicación, alertas, capacitación y certificación" },
  { t: "Agentes", d: "Reglas deterministas (trifecta y alarmas) antes del LLM · Claude con salida estructurada · dictado por voz" },
  { t: "Datos", d: "PostgreSQL con PostGIS (radio) · tablas por familia · en esta versión, almacenamiento del navegador" },
  { t: "Integraciones", d: "Twilio para WhatsApp · OpenStreetMap y CARTO · DENUE (INEGI) · SIDECU y CONOCER por integrar" },
];

const ORDEN: EstadoAhora[] = ["Operando", "Operando si se configura", "Simulado"];

export default function Tecnico() {
  const items = Object.values(TECH).sort((a, b) => ORDEN.indexOf(a.ahora) - ORDEN.indexOf(b.ahora));
  const n = (e: EstadoAhora) => items.filter((i) => i.ahora === e).length;
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-8">
      <Link href="/" className="flex items-center gap-2"><Logo /><span className="font-display text-xl font-bold tracking-tight">respira</span></Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] font-semibold tracking-tight">Mapa técnico</h1>
        <p className="max-w-[780px] text-[15px] leading-relaxed text-muted">
          Qué está conectado y qué no en esta versión, y qué lo respalda en el MVP. Dentro de la app, activa la <strong className="text-tech">capa técnica</strong> para verlo sobre cada pantalla.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {ORDEN.map((e) => <span key={e} className={`rounded-full px-3 py-1 font-semibold ${ESTADO_ESTILO[e]}`}>{n(e)} · {e}</span>)}
        </div>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPAS.map((c) => (
          <div key={c.t} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{c.t}</p>
            <p className="mt-1.5 text-sm leading-relaxed">{c.d}</p>
          </div>
        ))}
      </section>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-2">
              {["Elemento", "Sección", "Hoy", "Cómo opera hoy", "Módulo", "Datos", "Servicio en el MVP", "Integración"].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.titulo} className="border-b border-line-soft align-top last:border-0">
                <td className="px-3 py-3 font-semibold">{i.titulo}</td>
                <td className="px-3 py-3 text-ink-2">{i.seccion}</td>
                <td className="px-3 py-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[i.ahora]}`}>{i.ahora}</span></td>
                <td className="px-3 py-3 text-ink-2">{i.detalleAhora}</td>
                <td className="px-3 py-3">{i.modulos}</td>
                <td className="px-3 py-3">{i.datos}</td>
                <td className="px-3 py-3 font-mono text-xs">{i.servicio}</td>
                <td className="px-3 py-3">{i.integracion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

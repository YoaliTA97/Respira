"use client";

import Link from "next/link";
import { useState } from "react";
import { SIDECU } from "@/lib/catalogos";
import { calificacion, cubre, km, perfilesRed } from "@/lib/calculos";
import { Estrellas } from "./Graficas";
import { useData } from "@/lib/db";
import { fechaISO } from "@/lib/seed";
import { FichaEmergencia } from "./FichaEmergencia";
import { useDemoEvento } from "@/lib/demo";
import { Icono } from "./Iconos";
import { Avatar, btnDanger, btnSecondary } from "./ui";

const LS_VISTAS = "respira-graves-vistas";
const minutosA = (distanciaKm: number) => Math.max(5, Math.round(distanciaKm * 5.5)); // en auto, ciudad

// Alerta grave a pantalla completa: 911, WhatsApp a la familia, ficha para paramédicos y quién puede
// llegar pronto (familia o red con disponibilidad ahora, por distancia aproximada).
export function AlertaGrave() {
  const { db, ahora, usuario, familia, paciente, integrantes } = useData();
  const [vistas, setVistas] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(LS_VISTAS) ?? "[]");
    } catch {
      return [];
    }
  });
  useDemoEvento((ev) => {
    if (ev !== "cerrar-alerta" || !familia) return;
    const ids = db.alertas.filter((x) => x.familiaId === familia.id && x.estado === "activa" && x.nivel === "rojo").map((x) => x.id);
    const v = Array.from(new Set([...vistas, ...ids]));
    setVistas(v);
    try {
      sessionStorage.setItem(LS_VISTAS, JSON.stringify(v));
    } catch {
      /* ignorar */
    }
  });
  if (!usuario || !familia || !paciente) return null;
  const a = db.alertas
    .filter((x) => x.familiaId === familia.id && x.estado === "activa" && x.nivel === "rojo" && !vistas.includes(x.id))
    .sort((x, y) => (x.fechaHora < y.fechaHora ? 1 : -1))[0];
  if (!a || (ahora.getTime() - new Date(a.fechaHora).getTime()) / 60000 > 30) return null;

  const cerrar = () => {
    const v = [...vistas, a.id];
    setVistas(v);
    try {
      sessionStorage.setItem(LS_VISTAS, JSON.stringify(v));
    } catch {
      /* ignorar */
    }
  };
  const hoy = fechaISO(ahora);
  const hora = ahora.getHours();
  const noche = db.relevos.find((r) => r.familiaId === familia.id && r.fecha === hoy && !r.asignadoA && r.inicio + r.horas > hora);
  const familiaCerca = integrantes
    .filter((i) => i.usuario.id !== usuario.id && i.membresia.rol !== "persona" && cubre(i.usuario.disponibilidad, hoy, Math.min(hora, 23), 1))
    .map((i) => ({ u: i.usuario, detalle: i.membresia.parentesco, d: km(familia.hogar, i.usuario.ubicacion) }));
  const redCerca = perfilesRed(db, familia.id, 6, noche).map((p) => ({ u: p.usuario, detalle: noche ? "libre para cubrir el turno sin cubrir de hoy" : "red de cuidado", d: p.distancia }));
  const cercanos = [...redCerca, ...familiaCerca].sort((x, y) => x.d - y.d).slice(0, 3);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-red-ink text-white" role="alertdialog" aria-modal="true" aria-label="Alerta grave">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 p-5 md:p-8">
        <span className="text-sm font-semibold uppercase tracking-[0.1em] text-white/80">Alerta grave · {a.fechaHora.slice(11, 16)}</span>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{a.titulo}</h1>
        <p className="text-lg text-white/90">{a.motivo}</p>
        <a href="tel:911" className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-white text-xl font-bold text-red-ink shadow-lg"><Icono n="telefono" size={24} />Llamar al 911</a>
        <div className="grid gap-2 md:grid-cols-2">
          <span className="rounded-2xl bg-white/10 p-3 text-sm">
            {a.whatsapp ? `WhatsApp ${a.whatsapp.modo === "real" ? "enviado" : "enviado (simulado)"} a ${a.whatsapp.enviadoA.join(", ")}` : "Avisando a la familia por WhatsApp…"}
          </span>
          <a href={SIDECU.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-white/10 p-3 text-sm font-semibold underline">Centros de cuidado en {SIDECU.nombre}</a>
        </div>
        {cercanos.length > 0 && (
          <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-ink">
            <span className="text-sm font-semibold">Pueden llegar pronto</span>
            {cercanos.map((c) => (
              <div key={c.u.id} className="flex items-center gap-3 text-sm">
                <Avatar nombre={c.u.nombre} tono={c.u.tono} size={34} />
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{c.u.nombre}</span>
                  <span className="text-muted">{c.detalle} · a {c.d.toFixed(1)} km (~{minutosA(c.d)} min)</span>
                  {calificacion(db, c.u.id).n > 0 && <Estrellas valor={calificacion(db, c.u.id).promedio} n={calificacion(db, c.u.id).n} />}
                </span>
                <a href={`https://wa.me/52${c.u.telefono}?text=${encodeURIComponent(`${a.titulo}. ¿Puedes venir con ${paciente.nombre}?`)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-bg px-3 py-1.5 text-xs font-semibold text-green-ink">WhatsApp</a>
              </div>
            ))}
            {noche && <Link href="/relevos" onClick={cerrar} className="text-sm font-semibold text-primario underline">Pedir que cubra el turno sin cubrir de hoy</Link>}
          </section>
        )}
        <div className="text-ink">
          <FichaEmergencia />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/alertas" onClick={cerrar} className={`${btnSecondary} border-white/40 bg-white/10 text-white hover:bg-white/20`}>Responder a la familia</Link>
          <button type="button" onClick={cerrar} className={`${btnDanger} border border-white/40`}>Cerrar esta pantalla</button>
        </div>
        <p className="text-xs text-white/70">Respira no diagnostica: ante la duda, llama al 911. La ficha es para los paramédicos.</p>
      </div>
    </div>
  );
}

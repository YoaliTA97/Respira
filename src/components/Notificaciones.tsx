"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { notificaciones, type Notificacion } from "@/lib/calculos";
import { useData } from "@/lib/db";

const PUNTO = { rojo: "bg-red-ink", amarillo: "bg-amber-ink", info: "bg-primario" };

export function useNotificaciones(): Notificacion[] {
  const { db, ahora, usuario, familia, membresia } = useData();
  if (!usuario) return [];
  return notificaciones(db, usuario, familia?.id ?? null, membresia?.rol ?? null, ahora);
}

// Lista de avisos para el inicio y el panel de la campana.
export function ListaNotificaciones({ lista, max, onIr }: { lista: Notificacion[]; max?: number; onIr?: (n: Notificacion) => void }) {
  const { db, usuario } = useData();
  const vistas = new Set(usuario ? db.notifVistas?.[usuario.id] ?? [] : []);
  if (lista.length === 0) return <p className="px-1 py-3 text-sm text-muted">Sin pendientes. Aquí aparecen horarios sin cubrir, relevos aceptados, alertas sin respuesta, signos y medicación por registrar.</p>;
  return (
    <ul className="flex flex-col divide-y divide-line-soft">
      {lista.slice(0, max ?? lista.length).map((n) => (
        <li key={n.id}>
          <Link href={n.href} onClick={() => onIr?.(n)} className={`flex items-start gap-2.5 px-1 py-2.5 text-sm hover:bg-black/[0.02] ${vistas.has(n.id) ? "opacity-60" : ""}`}>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PUNTO[n.nivel]}`} aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{n.titulo}</span>
              <span className="text-muted">{n.detalle}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Campana() {
  const { db, usuario, marcarNotificaciones } = useData();
  const lista = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const [sistema, setSistema] = useState(false);
  const avisadas = useRef(new Set<string>());
  const vistas = new Set(usuario ? db.notifVistas?.[usuario.id] ?? [] : []);
  const nuevas = lista.filter((n) => !vistas.has(n.id));

  // Avisos del sistema operativo (si se activan): solo lo urgente y una vez por notificación.
  useEffect(() => {
    if (!sistema || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    nuevas
      .filter((n) => n.nivel !== "info" && !avisadas.current.has(n.id))
      .forEach((n) => {
        avisadas.current.add(n.id);
        try {
          new Notification(`Respira · ${n.titulo}`, { body: n.detalle, tag: n.id });
        } catch {
          /* el navegador no lo permite */
        }
      });
  }, [nuevas, sistema]);

  if (!usuario) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Notificaciones: ${nuevas.length} nuevas`}
        aria-expanded={abierto}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-chip"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {nuevas.length > 0 && <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-ink px-1 text-center text-xs font-semibold leading-5 text-white">{nuevas.length}</span>}
      </button>
      {abierto && (
        <div className="glass absolute right-0 top-full z-50 mt-2 flex max-h-[70vh] w-[min(380px,calc(100vw-24px))] flex-col overflow-y-auto rounded-2xl p-3 shadow-xl">
          <div className="mb-1 flex items-center justify-between gap-2 px-1">
            <span className="text-sm font-semibold">Notificaciones</span>
            {nuevas.length > 0 && <button type="button" className="text-xs text-muted underline" onClick={() => marcarNotificaciones(lista.map((n) => n.id))}>Marcar como vistas</button>}
          </div>
          <ListaNotificaciones lista={lista} onIr={(n) => { marcarNotificaciones([n.id]); setAbierto(false); }} />
          {typeof Notification !== "undefined" && (
            <label className="mt-2 flex items-center gap-2 border-t border-line-soft px-1 pt-2 text-xs text-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primario"
                checked={sistema}
                onChange={async (e) => {
                  const on = e.target.checked;
                  if (on && Notification.permission !== "granted") {
                    try {
                      await Notification.requestPermission();
                    } catch {
                      /* sin permiso */
                    }
                  }
                  setSistema(on);
                }}
              />
              Avisarme también en este dispositivo (alertas y pendientes)
            </label>
          )}
        </div>
      )}
    </div>
  );
}

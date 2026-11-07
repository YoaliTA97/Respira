"use client";

import { useState } from "react";
import { SIDECU } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import type { Alerta } from "@/lib/types";
import { Chip, btnPrimary, input } from "./ui";

// Mensajes de una alerta: respuestas rápidas a la familia dentro de la app y envío por WhatsApp
// desde el teléfono de quien responde (enlace wa.me), que funciona sin depender de una API.
export function MensajesAlerta({ alerta }: { alerta: Alerta }) {
  const { db, usuario, paciente, integrantes, responderAlerta } = useData();
  const [texto, setTexto] = useState("");
  if (!usuario || !paciente) return null;
  const clinica = paciente.voz?.decisiones?.clinica?.split("(")[0].trim();
  const rapidas = ["Voy en camino", "Ya llamé al 911", "Estoy con ella", clinica ? `La llevamos a ${clinica.replace(/^Su /, "su ")}` : "La llevamos a su clínica", "¿Alguien puede ir?"];
  const nombre = (id: string) => db.usuarios.find((u) => u.id === id)?.nombre.split(" ")[0] ?? "—";
  const contactos = integrantes.filter((i) => i.usuario.id !== usuario.id && i.usuario.telefono);
  const mensajeWa = `${alerta.titulo}. ${alerta.motivo}${texto.trim() ? ` ${usuario.nombre.split(" ")[0]}: ${texto.trim()}` : ""} Centros de cuidado: ${SIDECU.url}`;
  const enviar = (t: string) => {
    responderAlerta(alerta.id, t);
    setTexto("");
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
      {(alerta.respuestas ?? []).length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {alerta.respuestas!.map((r, i) => (
            <li key={i} className="rounded-xl bg-canvas px-3 py-1.5 text-sm">
              <span className="font-semibold">{nombre(r.porUsuarioId)}</span> <span className="text-xs text-muted">{r.fechaHora.slice(11, 16)}</span> · {r.texto}
            </li>
          ))}
        </ul>
      )}
      {alerta.estado === "activa" && (
        <>
          <div className="flex flex-wrap gap-1.5">{rapidas.map((r) => <Chip key={r} onClick={() => enviar(r)}>{r}</Chip>)}</div>
          <div className="flex gap-2">
            <input
              aria-label="Mensaje a la familia sobre la alerta"
              className={input}
              placeholder="Escribe a la familia…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && texto.trim() && enviar(texto)}
            />
            <button type="button" className={btnPrimary} disabled={!texto.trim()} onClick={() => enviar(texto)}>Enviar</button>
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted">Por WhatsApp desde tu teléfono:</span>
        {contactos.map(({ usuario: u }) => (
          <a
            key={u.id}
            href={`https://wa.me/52${u.telefono}?text=${encodeURIComponent(mensajeWa)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[#1b6b3a]/30 bg-green-bg px-2.5 py-1 font-semibold text-green-ink hover:brightness-95"
          >
            {u.nombre.split(" ")[0]}
          </a>
        ))}
      </div>
    </div>
  );
}

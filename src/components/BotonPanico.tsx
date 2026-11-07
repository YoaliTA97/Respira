"use client";

import Link from "next/link";
import { useState } from "react";
import { SIDECU } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import { FichaEmergencia } from "./FichaEmergencia";
import { Chip, Modal, btnDanger, btnSecondary } from "./ui";

const MOTIVOS = ["Necesito ayuda ya", "Se cayó", "No responde", "Le falta el aire", "Dolor de pecho", "Sangrado", "Está muy confundida"];

// Botón de pánico: siempre a la vista dentro del espacio familiar. Un toque abre el aviso y otro
// lo envía a toda la familia (app y WhatsApp), con el enlace a SIDECU y el 911 a la mano.
export function BotonPanico() {
  const { familia, paciente, usuario, integrantes, panico, procesando } = useData();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [detalle, setDetalle] = useState("");
  const [enviada, setEnviada] = useState(false);
  if (!familia || !paciente || !usuario) return null;
  const otros = integrantes.filter((i) => i.usuario.id !== usuario.id).map((i) => i.usuario.nombre.split(" ")[0]);

  const cerrar = () => {
    setAbierto(false);
    setEnviada(false);
    setMotivo(MOTIVOS[0]);
    setDetalle("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Botón de pánico: avisar a toda la familia"
        className="fixed bottom-[92px] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-red-ink pl-4 pr-5 font-semibold text-white shadow-[0_8px_24px_rgba(179,38,30,0.35)] transition hover:brightness-95 md:bottom-6 md:right-6"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 3l9 16H3z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
        Pánico
      </button>

      <Modal abierto={abierto} onCerrar={cerrar} titulo={enviada ? "Alerta enviada a la familia" : "Avisar a toda la familia ahora"}>
        {!enviada ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">¿Qué está pasando con {paciente.nombre}?</span>
              <div className="flex flex-wrap gap-2">{MOTIVOS.map((m) => <Chip key={m} activo={motivo === m} onClick={() => setMotivo(m)}>{m}</Chip>)}</div>
            </div>
            <textarea
              rows={2}
              aria-label="Detalle opcional"
              placeholder="Detalle opcional: dónde estás, qué hiciste…"
              className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario"
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
            />
            <p className="text-sm text-muted">Se avisa en la app y por WhatsApp a {otros.length ? otros.join(", ") : "la familia"}, con el enlace a {SIDECU.nombre} para ubicar el centro de cuidados más cercano.</p>
            <button
              type="button"
              className={`${btnDanger} min-h-[56px] text-base`}
              disabled={procesando}
              onClick={async () => {
                await panico(motivo, detalle);
                setEnviada(true);
              }}
            >
              Enviar alerta a la familia
            </button>
            <a href="tel:911" className={btnSecondary}>Llamar al 911</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-2">Avisamos a {otros.join(", ") || "la familia"}. Mientras llegan:</p>
            <a href="tel:911" className={`${btnDanger} min-h-[52px]`}>Llamar al 911</a>
            <a href={SIDECU.url} target="_blank" rel="noopener noreferrer" className={btnSecondary}>Abrir {SIDECU.nombre}: centros de cuidado</a>
            <Link href="/alertas" onClick={cerrar} className={btnSecondary}>Ver la alerta y los centros cercanos</Link>
            <FichaEmergencia />
          </div>
        )}
      </Modal>
    </>
  );
}

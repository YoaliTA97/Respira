"use client";

import { useState } from "react";
import { ZARIT_CORTE, ZARIT_OPCIONES, ZARIT_PREGUNTAS, nivelZarit } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import { Modal, btnPrimary } from "./ui";

// Escala de sobrecarga de Zarit abreviada: la responde cada persona que cuida, desde su cuenta.
export function ZaritModal({ onCerrar }: { onCerrar: () => void }) {
  const { responderZarit } = useData();
  const [r, setR] = useState<(number | null)[]>(ZARIT_PREGUNTAS.map(() => null));
  const completa = r.every((x) => x !== null);
  const puntaje = r.reduce<number>((a, x) => a + (x ?? 0), 0);
  return (
    <Modal abierto onCerrar={onCerrar} titulo="¿Cómo estás tú? · Escala de sobrecarga">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">7 preguntas, menos de 2 minutos. Tu familia ve el resultado para repartir mejor los relevos.</p>
          <button type="button" className="text-sm font-semibold text-primario underline" onClick={() => setR([4, 4, 3, 4, 3, 3, 4])}>Llenar con ejemplo</button>
        </div>
        {ZARIT_PREGUNTAS.map((p, i) => (
          <fieldset key={p} className="flex flex-col gap-1.5">
            <legend className="mb-1 text-sm font-medium">{i + 1}. {p}</legend>
            <div className="flex flex-wrap gap-1.5">
              {ZARIT_OPCIONES.map((o, j) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={r[i] === j + 1}
                  onClick={() => setR(r.map((x, k) => (k === i ? j + 1 : x)))}
                  className={`min-h-[38px] rounded-full border px-3 text-sm ${r[i] === j + 1 ? "border-primario bg-primario text-white" : "border-line bg-white"}`}
                >
                  {o}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        {completa && (
          <p className={`rounded-xl p-3 text-sm ${puntaje >= ZARIT_CORTE ? "bg-amber-bg text-amber-ink" : "bg-green-bg text-green-ink"}`}>
            {puntaje} puntos: {nivelZarit(puntaje).toLowerCase()}.{puntaje >= ZARIT_CORTE ? " Pide relevos a tu familia o a la red; no tienes que hacerlo sola." : ""}
          </p>
        )}
        <button type="button" className={btnPrimary} disabled={!completa} onClick={() => { responderZarit(r as number[]); onCerrar(); }}>Guardar mi escala</button>
        <p className="text-xs text-muted">Versión abreviada de 7 preguntas; 17 puntos o más indica sobrecarga intensa. Por validar con el equipo de salud aliado.</p>
      </div>
    </Modal>
  );
}

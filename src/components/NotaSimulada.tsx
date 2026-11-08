"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "./Iconos";
import { Modal, btnPrimary, btnSecondary } from "./ui";

// Nota de voz simulada: no necesita micrófono, dictado ni API. Muestra la grabación, lee el texto
// en voz alta con la voz del navegador (si existe), escribe la transcripción y pide confirmarla.
// En la demo automática ("auto") se confirma sola.
export function NotaSimulada({ texto, auto = false, onConfirmar, onCancelar }: { texto: string; auto?: boolean; onConfirmar: (t: string) => void; onCancelar: () => void }) {
  const [fase, setFase] = useState<"grabando" | "transcribiendo" | "listo">("grabando");
  const [seg, setSeg] = useState(0);
  const [escrito, setEscrito] = useState("");
  const duracion = Math.min(9, Math.max(4, Math.round(texto.length / 14)));
  const confirmarRef = useRef(onConfirmar);
  useEffect(() => {
    confirmarRef.current = onConfirmar;
  });

  useEffect(() => {
    let voz: SpeechSynthesisUtterance | null = null;
    try {
      if ("speechSynthesis" in window) {
        voz = new SpeechSynthesisUtterance(texto);
        voz.lang = "es-MX";
        voz.rate = 1.02;
        const mx = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
        if (mx) voz.voice = mx;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(voz);
      }
    } catch {
      /* sin voz del navegador: solo se ve la animación */
    }
    const reloj = setInterval(() => setSeg((s) => s + 1), 1000);
    const fin = setTimeout(() => {
      clearInterval(reloj);
      setFase("transcribiendo");
    }, duracion * 1000);
    return () => {
      clearInterval(reloj);
      clearTimeout(fin);
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignorar */
      }
    };
  }, [texto, duracion]);

  useEffect(() => {
    if (fase !== "transcribiendo") return;
    let n = 0;
    const t = setInterval(() => {
      n += 3;
      setEscrito(texto.slice(0, n));
      if (n >= texto.length) {
        clearInterval(t);
        setFase("listo");
      }
    }, 30);
    return () => clearInterval(t);
  }, [fase, texto]);

  useEffect(() => {
    if (!auto || fase !== "listo") return;
    const t = setTimeout(() => confirmarRef.current(texto), 1800);
    return () => clearTimeout(t);
  }, [auto, fase, texto]);

  return (
    <Modal abierto onCerrar={onCancelar} titulo="Nota de voz">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-canvas p-4">
          <span className={`grid h-12 w-12 place-items-center rounded-full ${fase === "grabando" ? "bg-red-ink" : "bg-primario"} text-white`}>
            <Icono n="microfono" size={22} />
          </span>
          <div className="flex flex-1 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-primario"
                style={{ height: fase === "grabando" ? `${8 + ((i * 37) % 22)}px` : "6px", animation: fase === "grabando" ? `onda .9s ease-in-out ${(i % 7) * 0.08}s infinite alternate` : "none", opacity: fase === "grabando" ? 1 : 0.4 }}
              />
            ))}
          </div>
          <span className="w-12 text-right font-mono text-sm text-muted">0:{String(fase === "grabando" ? seg : duracion).padStart(2, "0")}</span>
        </div>

        {fase === "grabando" ? (
          <p className="text-sm text-muted">Grabando… (simulado: no usa micrófono ni internet)</p>
        ) : (
          <>
            <label htmlFor="nota-sim" className="text-xs font-medium text-muted">Respira transcribió. Una persona revisa y confirma cada registro:</label>
            <textarea id="nota-sim" rows={3} readOnly={fase !== "listo"} className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario" value={fase === "listo" ? escrito : `${escrito}▍`} onChange={(e) => setEscrito(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className={btnPrimary} disabled={fase !== "listo" || !escrito.trim()} onClick={() => onConfirmar(escrito)}><Icono n="enviar" />Confirmar y enviar</button>
              <button type="button" className={btnSecondary} onClick={onCancelar}>Cancelar</button>
            </div>
            {auto && fase === "listo" && <p className="text-xs text-muted">Demo automática: se confirma en un momento…</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

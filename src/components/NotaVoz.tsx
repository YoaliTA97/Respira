"use client";

import { useEffect, useRef, useState } from "react";
import { btnPrimary, btnSecondary } from "./ui";

// Graba audio con MediaRecorder y, si el navegador lo permite (Chrome, Edge), transcribe con
// la Web Speech API en es-MX. En el MVP el audio se transcribe en el servidor (faster-whisper).

type Reconocimiento = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const MAX_SEG = 90;

// "ejemplo": transcripción de respaldo para la presentación, por si el dictado del navegador no está disponible o no entiende.
export function NotaVoz({ onListo, onCancelar, ejemplo }: { onListo: (texto: string, audioUrl?: string) => void; onCancelar: () => void; ejemplo?: string }) {
  const [estado, setEstado] = useState<"listo" | "grabando" | "revisar" | "error">("listo");
  const [texto, setTexto] = useState("");
  const [parcial, setParcial] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [dictado] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));
  const rec = useRef<MediaRecorder | null>(null);
  const voz = useRef<Reconocimiento | null>(null);
  const trozos = useRef<Blob[]>([]);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (reloj.current) clearInterval(reloj.current);
    rec.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const iniciar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      trozos.current = [];
      mr.ondataavailable = (e) => e.data.size && trozos.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(trozos.current, { type: mr.mimeType || "audio/webm" });
        const fr = new FileReader();
        fr.onload = () => setAudioUrl(typeof fr.result === "string" ? fr.result : undefined);
        fr.readAsDataURL(blob);
      };
      mr.start();
      rec.current = mr;
      const W = window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento };
      const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.lang = "es-MX";
        r.continuous = true;
        r.interimResults = true;
        r.onresult = (e) => {
          let final = "";
          let interino = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) final += res[0].transcript;
            else interino += res[0].transcript;
          }
          if (final) setTexto((t) => `${t} ${final}`.trim());
          setParcial(interino);
        };
        r.onerror = () => undefined;
        r.start();
        voz.current = r;
      }
      setSegundos(0);
      let s = 0;
      reloj.current = setInterval(() => {
        s += 1;
        setSegundos(s);
        if (s >= MAX_SEG) detener();
      }, 1000);
      setEstado("grabando");
    } catch {
      setEstado("error");
    }
  };

  const detener = () => {
    if (reloj.current) clearInterval(reloj.current);
    voz.current?.stop();
    if (rec.current?.state === "recording") rec.current.stop();
    setParcial("");
    setEstado("revisar");
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      {estado === "listo" && (
        <>
          <p className="text-sm text-ink-2">Graba al recibir a la persona: di sus signos y cualquier señal de alerta. {dictado ? "Se transcribe mientras hablas." : "Tu navegador no transcribe; podrás escribir lo que dijiste."}</p>
          <div className="flex gap-2">
            <button type="button" className={btnPrimary} onClick={iniciar}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
              Empezar a grabar
            </button>
            <button type="button" className={btnSecondary} onClick={onCancelar}>Cancelar</button>
          </div>
        </>
      )}
      {estado === "grabando" && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-ink" aria-hidden="true" />
            <span className="text-sm font-semibold">Grabando · {segundos}s</span>
          </div>
          <p className="min-h-[48px] rounded-xl bg-canvas p-3 text-sm text-ink-2">{texto} <span className="text-muted">{parcial}</span></p>
          <button type="button" className={`${btnPrimary} self-start`} onClick={detener}>Terminar</button>
        </>
      )}
      {estado === "revisar" && (
        <>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          <label htmlFor="transcripcion" className="text-xs font-medium text-muted">Revisa lo que se entendió (puedes corregirlo)</label>
          {ejemplo && texto.trim() !== ejemplo && (
            <button type="button" className="self-start text-xs font-semibold text-primario underline" onClick={() => setTexto(ejemplo)}>
              {texto.trim() ? "Reemplazar con la nota de ejemplo" : "No se entendió: usar la nota de ejemplo"}
            </button>
          )}
          <textarea id="transcripcion" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Recibo a mi mamá, pulso 80, respira 18, presión 130 sobre 80…" className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario" />
          <div className="flex gap-2">
            <button type="button" className={btnPrimary} disabled={!texto.trim()} onClick={() => onListo(texto.trim(), audioUrl)}>Enviar al asistente</button>
            <button type="button" className={btnSecondary} onClick={onCancelar}>Descartar</button>
          </div>
        </>
      )}
      {estado === "error" && (
        <>
          <p className="text-sm text-red-ink">No se pudo usar el micrófono. Revisa el permiso del navegador o escribe el reporte.</p>
          <div className="flex flex-wrap gap-2">
            {ejemplo && <button type="button" className={btnPrimary} onClick={() => { setTexto(ejemplo); setEstado("revisar"); }}>Usar la nota de ejemplo</button>}
            <button type="button" className={btnSecondary} onClick={onCancelar}>Cerrar</button>
          </div>
        </>
      )}
    </div>
  );
}

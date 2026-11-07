"use client";

import Link from "next/link";
import { useDemo } from "@/lib/store";
import type { ChatMsg } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { StatusPill } from "@/components/ui";

const ONDA = [10, 18, 24, 14, 20, 8, 22, 26, 12, 18, 24, 10, 16, 22, 12, 20, 8, 16, 10, 6];

function Burbuja({ de, children, ancho }: { de: ChatMsg["de"]; children: React.ReactNode; ancho?: boolean }) {
  return (
    <div
      className={`${ancho ? "w-[86%]" : "max-w-[82%]"} rounded-[14px] px-3 py-2 text-[15px] leading-snug ${
        de === "yo" ? "self-end rounded-br-[4px] bg-[#e4e4e1]" : "self-start rounded-bl-[4px] border border-line bg-white"
      }`}
    >
      {children}
    </div>
  );
}

const Hora = ({ h }: { h: string }) => <span className="mt-0.5 block text-right text-[11px] text-muted">{h}</span>;

export default function WhatsAppPage() {
  const { state, chatEnviarAudio, chatResponder } = useDemo();
  const ultimo = state.chat[state.chat.length - 1];
  const msgSemaforo = state.chat.find((m) => m.tipo === "semaforo");
  const alerta = state.alerts.find((a) => a.id === msgSemaforo?.alertaId);

  return (
    <div className="-mx-4 -mb-4 flex flex-1 flex-col bg-[#efefed]">
      <TechTag k="whatsapp-canal" className="sticky top-0 z-10">
        <header className="glass flex h-16 items-center gap-3 border-x-0 border-t-0 px-3">
          <Link href="/app" aria-label="Volver a la app" className="flex h-11 w-11 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink">
            <svg width="24" height="24" viewBox="0 0 40 40" aria-hidden="true">
              <path d="M7 22c4-8 9-8 13 0s9 8 13 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className="flex flex-col">
            <span className="text-base font-semibold">Respira</span>
            <span className="text-xs text-muted">WhatsApp · canal de entrada y salida</span>
          </span>
        </header>
      </TechTag>

      <div className="flex flex-1 flex-col justify-end gap-2 px-3 py-4">
        {state.chat.map((m) => {
          if (m.tipo === "audio")
            return (
              <TechTag key={m.id} k="stt" className="self-end">
                <div className="flex w-[250px] items-center gap-2.5 rounded-[14px] rounded-br-[4px] bg-[#e4e4e1] px-3 py-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <path d="M3 1.5v11l9-5.5z" fill="#fff" />
                    </svg>
                  </span>
                  <svg width="120" height="28" viewBox="0 0 120 28" aria-label="Nota de voz de 42 segundos" role="img">
                    {ONDA.map((h, i) => (
                      <rect key={i} x={i * 6} y={(28 - h) / 2} width="3" height={h} rx="1.5" fill="#171717" />
                    ))}
                  </svg>
                  <span className="text-xs text-ink-2">{m.texto}</span>
                </div>
              </TechTag>
            );
          if (m.tipo === "resumen")
            return (
              <TechTag key={m.id} k="llm-extraccion" className="self-start">
                <Burbuja de="bot" ancho>
                  <p>Esto entendí:</p>
                  <ul className="my-1 list-disc pl-5">
                    {m.texto?.split("|").map((x) => <li key={x}>{x}</li>)}
                  </ul>
                  <p>¿Es correcto?</p>
                  <Hora h={m.hora} />
                </Burbuja>
                {state.chatFase === "audio" && ultimo.id === m.id && (
                  <div className="mt-1.5 flex gap-1.5">
                    {m.opciones?.map((o, i) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => chatResponder(i === 0)}
                        className="min-h-[44px] flex-1 rounded-xl border border-line bg-white text-[15px] font-semibold"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
              </TechTag>
            );
          if (m.tipo === "semaforo")
            return (
              <TechTag key={m.id} k="estado-semaforo" className="self-start">
                <div className={`w-[300px] max-w-full rounded-[14px] rounded-bl-[4px] border-2 bg-white p-3 ${alerta?.nivel === "rojo" ? "border-red-ink" : "border-amber-ink"}`}>
                  <StatusPill nivel={alerta?.nivel ?? "rojo"} />
                  <p className="mt-2 text-[15px] leading-snug">
                    <strong>Por qué:</strong> {m.texto}
                  </p>
                  <p className="mt-1.5 text-sm text-ink-2">Una promotora de salud está revisando tu alerta.</p>
                  <Hora h={m.hora} />
                </div>
              </TechTag>
            );
          return (
            <Burbuja key={m.id} de={m.de}>
              <p>{m.texto}</p>
              <Hora h={m.hora} />
            </Burbuja>
          );
        })}

        {alerta?.estado === "confirmada" && (
          <TechTag k="revision-humana" className="self-start">
            <Burbuja de="bot" ancho>
              <p>
                Ana, promotora de salud, confirmó tu alerta. Ve hoy a: <strong>{alerta.destino}</strong>.
              </p>
              <p className="mt-1.5">Mientras llegas, no la dejes sola. Si le cuesta respirar o no responde, llama al 911.</p>
            </Burbuja>
          </TechTag>
        )}
        {alerta?.estado === "reclasificada" && (
          <Burbuja de="bot" ancho>
            <p>La promotora revisó tu reporte y lo bajó a vigilar. Ofrécele líquidos y cuéntame cómo sigue en la tarde.</p>
          </Burbuja>
        )}
        {alerta?.estado === "pendiente" && (
          <p className="mt-1 self-center rounded-full bg-white/70 px-3 py-1 text-xs text-muted">Abre el panel de la promotora para confirmar la alerta</p>
        )}
      </div>

      <div className="glass sticky bottom-0 flex flex-col gap-2 border-x-0 border-b-0 px-3 pb-3 pt-2">
        {state.chatFase === "inicio" && (
          <span className="self-center text-xs text-muted">Toca el micrófono para enviar el audio de ejemplo de Rosa</span>
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="msg" className="sr-only-text">
            Mensaje
          </label>
          <input id="msg" placeholder="Mensaje" disabled className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[15px]" />
          <button
            type="button"
            onClick={chatEnviarAudio}
            disabled={state.chatFase !== "inicio"}
            aria-label="Enviar nota de voz de ejemplo"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition disabled:opacity-30 ${state.chatFase === "inicio" ? "ring-4 ring-black/10" : ""}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

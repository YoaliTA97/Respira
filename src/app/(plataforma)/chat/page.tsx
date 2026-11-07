"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/db";
import { SIGNOS } from "@/lib/catalogos";
import type { Medicion } from "@/lib/reglas";
import type { Mensaje } from "@/lib/types";
import { NotaVoz } from "@/components/NotaVoz";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Modal, NivelPill, Segmentado, btnDanger, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const EJEMPLOS = [
  { t: "Recepción normal", v: "Recibo a mi mamá. Pulso 78, respira 17 por minuto, presión 128 sobre 78, glucosa 140. Dolor 3 de 10, está platicando." },
  { t: "Trifecta de alerta", v: "La recibo muy decaída. Pulso 132, respira 28 por minuto, presión 84 sobre 50. Está confundida." },
  { t: "Caída con golpe", v: "Se cayó en el baño, se pegó en la cabeza y no se puede levantar." },
  { t: "Glucosa baja", v: "Está sudando y con temblor, glucosa 58." },
];

function Burbuja({ m }: { m: Mensaje }) {
  const { db, usuario } = useData();
  if (m.de === "asistente") {
    return (
      <div className="flex max-w-[640px] gap-2.5 self-start">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primario" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 40 40"><path d="M7 22c4-8 9-8 13 0s9 8 13 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" /></svg>
        </span>
        <div className={`flex flex-col gap-2 rounded-2xl rounded-tl-md border bg-white p-3.5 ${m.nivel === "rojo" ? "border-red-ink" : m.nivel === "amarillo" ? "border-[#e3c98d]" : "border-line"}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold text-ink">Asistente</span>
            {m.nivel && <NivelPill nivel={m.nivel} />}
            {m.fuente && <span>· {m.fuente}</span>}
            <span>· {m.fechaHora.slice(11, 16)}</span>
          </div>
          <p className={`text-[15px] leading-relaxed ${m.nivel === "rojo" ? "font-medium" : ""}`}>{m.texto}</p>
          {m.hallazgos && m.hallazgos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {m.hallazgos.map((h) => (
                <span key={h.etiqueta} className={`rounded-full px-2 py-0.5 text-xs font-medium ${h.estado === "normal" ? "bg-chip text-ink-2" : "bg-red-bg text-red-ink"}`}>
                  {h.etiqueta}: {h.valor}
                </span>
              ))}
            </div>
          )}
          {m.acciones && m.acciones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {m.acciones.includes("911") && <a href="tel:911" className={btnDanger}>Llamar al 911</a>}
              {m.acciones.includes("centros") && <Link href="/alertas" className={btnSecondary}>Ver centros cercanos</Link>}
              {m.acciones.includes("tutorial") && <Link href={`/capacitacion?t=${m.tutorialId ?? "movilizacion"}`} className={btnSecondary}>Ver tutorial</Link>}
            </div>
          )}
        </div>
      </div>
    );
  }
  const autor = db.usuarios.find((u) => u.id === m.de);
  const mio = m.de === usuario?.id;
  return (
    <div className={`flex max-w-[640px] gap-2.5 ${mio ? "flex-row-reverse self-end" : "self-start"}`}>
      <Avatar nombre={autor?.nombre ?? "?"} tono={autor?.tono} size={32} />
      <div className={`flex flex-col gap-1.5 rounded-2xl p-3.5 ${mio ? "rounded-tr-md bg-realce" : "rounded-tl-md border border-line bg-white"}`}>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-ink">{mio ? "Tú" : autor?.nombre.split(" ")[0]}</span>
          {m.tipo === "nota de voz" && <span>· nota de voz</span>}
          <span>· {m.fechaHora.slice(0, 10) === new Date().toISOString().slice(0, 10) ? "" : `${m.fechaHora.slice(5, 10)} `}{m.fechaHora.slice(11, 16)}</span>
        </div>
        {m.audioUrl && <audio controls src={m.audioUrl} className="h-9 w-64 max-w-full" />}
        <p className="text-[15px] leading-relaxed">{m.texto}</p>
      </div>
    </div>
  );
}

function Chat() {
  const { db, familia, paciente, puede, procesando, reportar, enviarMensaje, registrarSignos } = useData();
  const [modo, setModo] = useState<"reporte" | "familia">("reporte");
  const [texto, setTexto] = useState("");
  const [grabando, setGrabando] = useState(false);
  const [form, setForm] = useState(false);
  const [m, setM] = useState<Record<string, string>>({});
  const fin = useRef<HTMLDivElement | null>(null);
  const mensajes = db.mensajes.filter((x) => x.familiaId === familia?.id);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes.length, procesando]);

  if (!familia || !paciente) return null;
  const puedeRegistrar = puede("registrar");

  const enviar = () => {
    if (!texto.trim()) return;
    if (modo === "reporte") void reportar(texto);
    else enviarMensaje(texto);
    setTexto("");
  };
  const num = (k: string) => (m[k] ? Number(m[k]) : undefined);
  const guardarForm = () => {
    const med: Medicion = {
      fc: num("fc"), fr: num("fr"), paSist: num("paSist"), paDiast: num("paDiast"), glucosa: num("glucosa"), temperatura: num("temperatura"), spo2: num("spo2"), dolor: num("dolor"),
      conciencia: (m.conciencia as Medicion["conciencia"]) || undefined,
    };
    void registrarSignos(med, m.nota);
    setForm(false);
    setM({});
  };

  return (
    <div className="flex h-[calc(100vh-56px-24px-112px)] min-h-[520px] flex-col md:h-[calc(100vh-56px-24px-48px)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Red de cuidado de {paciente.nombre}</p>
          <h1 className="text-[28px] font-semibold tracking-tight">Chat y reportes</h1>
        </div>
        <TechTag k="perfil-paciente">
          <div className="flex max-w-[460px] flex-wrap gap-1.5 rounded-xl border border-line bg-white p-2.5 text-xs">
            <span className="font-semibold">Al recibirla, reporta:</span>
            {paciente.signos.map((s) => <span key={s} className="rounded-full bg-chip px-2 py-0.5">{SIGNOS[s].nombre}</span>)}
          </div>
        </TechTag>
      </div>

      <TechTag k="chat" className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-[#f3f1ea] p-4">
          {mensajes.map((x) => <Burbuja key={x.id} m={x} />)}
          {procesando && <p className="self-start rounded-full bg-white px-3 py-1.5 text-sm text-muted">El asistente está revisando el reporte…</p>}
          <div ref={fin} />
        </div>
      </TechTag>

      <div className="mt-3 flex flex-col gap-2">
        {!puedeRegistrar ? (
          <p className="rounded-xl border border-line bg-white p-3 text-sm text-muted">Tu rol en este espacio es solo avisos: puedes ver el estado, pero no registrar.</p>
        ) : grabando ? (
          <TechTag k="nota-voz">
            <NotaVoz
              onCancelar={() => setGrabando(false)}
              onListo={(t, audio) => {
                setGrabando(false);
                void reportar(t, { notaVoz: true, audioUrl: audio });
              }}
            />
          </TechTag>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-full max-w-[340px]">
                <Segmentado etiqueta="Destino" valor={modo} onChange={setModo} opciones={[{ v: "reporte", t: "Reporte al asistente" }, { v: "familia", t: "Mensaje a la familia" }]} />
              </div>
              {modo === "reporte" && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted">Ejemplos:</span>
                  {EJEMPLOS.map((e) => (
                    <button key={e.t} type="button" onClick={() => setTexto(e.v)} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs hover:border-primario">{e.t}</button>
                  ))}
                </div>
              )}
            </div>
            <TechTag k="asistente">
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2">
                <label htmlFor="msg" className="sr-only-text">Mensaje</label>
                <textarea
                  id="msg"
                  rows={2}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  placeholder={modo === "reporte" ? `Cómo recibes a ${paciente.nombre}: signos y cualquier señal de alerta` : "Escribe a tu familia"}
                  className="min-h-[48px] flex-1 resize-none bg-transparent p-2 text-[15px] outline-none"
                />
                <button type="button" onClick={() => setForm(true)} className={btnSecondary} title="Registrar signos con formulario">Signos</button>
                <button type="button" onClick={() => setGrabando(true)} aria-label="Grabar nota de voz" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primario text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
                </button>
                <button type="button" onClick={enviar} disabled={!texto.trim() || procesando} className={btnPrimary}>Enviar</button>
              </div>
            </TechTag>
          </>
        )}
      </div>

      <Modal abierto={form} onCerrar={() => setForm(false)} titulo={`Signos de ${paciente.nombre}`}>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["fc", "Frecuencia cardiaca (lpm)"],
            ["fr", "Frecuencia respiratoria (rpm)"],
            ["paSist", "Presión sistólica"],
            ["paDiast", "Presión diastólica"],
            ["glucosa", "Glucosa (mg/dL)"],
            ["temperatura", "Temperatura (°C)"],
            ["spo2", "Oxigenación (%)"],
            ["dolor", "Dolor (0 a 10)"],
          ].map(([k, t]) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label htmlFor={`f-${k}`} className={label}>{t}</label>
              <input id={`f-${k}`} type="number" inputMode="decimal" className={input} value={m[k] ?? ""} onChange={(e) => setM({ ...m, [k]: e.target.value })} />
            </div>
          ))}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label htmlFor="f-con" className={label}>Estado de alerta</label>
            <select id="f-con" className={input} value={m.conciencia ?? ""} onChange={(e) => setM({ ...m, conciencia: e.target.value })}>
              <option value="">Sin registrar</option>
              <option value="alerta">Alerta</option>
              <option value="confundida">Confundida</option>
              <option value="no responde">No responde</option>
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label htmlFor="f-nota" className={label}>Nota (señales de alerta, contexto)</label>
            <input id="f-nota" className={input} value={m.nota ?? ""} onChange={(e) => setM({ ...m, nota: e.target.value })} />
          </div>
        </div>
        <button type="button" className={`${btnPrimary} mt-4 w-full`} onClick={guardarForm}>Registrar y evaluar</button>
      </Modal>
    </div>
  );
}

export default function ChatPage() {
  return (
    <RequiereFamilia>
      <Chat />
    </RequiereFamilia>
  );
}

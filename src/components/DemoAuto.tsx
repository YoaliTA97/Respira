"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useData } from "@/lib/db";
import { emitirDemo, useDemoEvento } from "@/lib/demo";
import { CLAVE_DEMO } from "@/lib/seed";
import { Icono } from "./Iconos";
import { Logo } from "./Logo";

// Demo automática basada en el speech (bloques 3 a 6): cambia de persona y de pantalla sola,
// ejecuta las acciones (nota de voz simulada, alerta, mapa por etapas, seis meses después) y muestra
// en subtítulos lo que se dice. Sirve también como respaldo si la demo en vivo falla.
type Paso = { bloque: string; t: string; dice: string; quien?: string; ruta: string; seg: number; antes?: string[]; accion?: string; seisMeses?: boolean };

const SARA = "5510000001";
const DOREEN = "5510000005";

export const PASOS_DEMO: Paso[] = [
  { bloque: "De la familia a la comunidad", t: "Sara graba una nota de voz", quien: SARA, ruta: "/chat", seg: 22, accion: "nota-1", dice: "Sara graba: «Mi mamá amaneció pálida y la presión salió en 90 sobre 60». Respira transcribe, compara con los umbrales de su médico y responde: vuelve a medir en 15 minutos." },
  { bloque: "De la familia a la comunidad", t: "Si empeora: 911 y WhatsApp a toda la familia", quien: SARA, ruta: "/chat", seg: 24, accion: "nota-2", dice: "Si empeora, pide llamar al 911 y avisa por WhatsApp a toda la familia. Pero alertar es solo el principio." },
  { bloque: "De la familia a la comunidad", t: "El corazón es la red", quien: SARA, ruta: "/integrantes", seg: 14, antes: ["cerrar-alerta"], accion: "mapa-crece", dice: "Primero, la familia se reparte los turnos. Después, Respira suma a quien está cerca: la vecina de enfrente, una cuidadora certificada a diez minutos." },
  { bloque: "De la familia a la comunidad", t: "Los turnos de la familia", quien: SARA, ruta: "/relevos", seg: 8, dice: "Karla, Mariana y Diego se reparten los relevos; hoy en la noche, Respira sugiere a quien está libre cerca." },
  { bloque: "De la familia a la comunidad", t: "Banco de tiempo", quien: SARA, ruta: "/perfil", seg: 9, dice: "Y con el banco de tiempo, Sara también cuida: un sábado acompaña a don Luis, el vecino de al lado, y esas horas regresan a ella cuando necesita descansar." },
  { bloque: "De la familia a la comunidad", t: "Mi voz de Doreen", quien: DOREEN, ruta: "/mi-voz", seg: 12, dice: "Y Doreen no es una paciente: en «Mi voz» decide cómo quiere que la cuiden, y también aporta: les enseña a tejer a las nietas de la red." },
  { bloque: "Lo que nadie más hace", t: "Pasaporte de Cuidado", quien: SARA, ruta: "/pasaporte", seg: 22, seisMeses: true, accion: "pasaporte-llenar", dice: "Cada hora que Sara cuida suma a su Pasaporte de Cuidado, que la lleva a una certificación oficial del CONOCER y a un ingreso con seguridad social. La IA escucha, resume y alerta, pero no diagnostica." },
  { bloque: "Quién paga y el impacto", t: "Quién paga", ruta: "/impacto", seg: 30, dice: "¿Quién paga? Nunca la familia ni la cuidadora. Empresas, aseguradoras y gobiernos. En cinco años: 30 mil familias, casi 6 millones de horas de descanso y 374 millones de pesos para cuidadoras certificadas." },
  { bloque: "Cierre", t: "La red de Doreen: de 3 a 14", quien: SARA, ruta: "/integrantes", seg: 15, accion: "mapa-crece", dice: "Seis meses después, Doreen camina diez minutos al día. Sara está certificada, cotiza en el IMSS y cuida a dos vecinas. La red de Doreen empezó con tres personas. Hoy son catorce." },
];

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DemoAuto() {
  const { usuario, iniciarSesion, reiniciarDemo, simularSeisMeses } = useData();
  const router = useRouter();
  const [activo, setActivo] = useState(false);
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [fin, setFin] = useState(false);
  const [guion, setGuion] = useState(false); // en la presentación el guion lo dicen ustedes: oculto por defecto
  const acciones = useRef({ usuario, iniciarSesion, reiniciarDemo, simularSeisMeses, router });
  useEffect(() => {
    acciones.current = { usuario, iniciarSesion, reiniciarDemo, simularSeisMeses, router };
  });

  useDemoEvento((a) => {
    if (a === "iniciar") {
      setFin(false);
      setPausa(false);
      setI(0);
      setActivo(true);
    }
  });

  // Al entrar a cada paso: cerrar lo anterior, cambiar de persona y de pantalla, y ejecutar la acción
  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    const p = PASOS_DEMO[i];
    (async () => {
      const x = acciones.current;
      p.antes?.forEach(emitirDemo);
      if (i === 0) {
        x.reiniciarDemo();
        await esperar(300);
      }
      if (p.quien && x.usuario?.telefono !== p.quien) await x.iniciarSesion(p.quien, CLAVE_DEMO, true);
      if (p.seisMeses) x.simularSeisMeses();
      x.router.push(p.ruta);
      await esperar(1500);
      if (!cancelado && p.accion) emitirDemo(p.accion);
    })();
    return () => {
      cancelado = true;
    };
  }, [activo, i]);

  // Avance automático
  useEffect(() => {
    if (!activo || pausa) return;
    const t = setTimeout(() => {
      if (i < PASOS_DEMO.length - 1) setI(i + 1);
      else {
        emitirDemo("cerrar-alerta");
        setActivo(false);
        setFin(true);
      }
    }, PASOS_DEMO[i].seg * 1000);
    return () => clearTimeout(t);
  }, [activo, pausa, i]);

  // Teclado: espacio pausa, flechas avanzan o regresan, Esc sale
  useEffect(() => {
    if (!activo) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        setPausa((v) => !v);
      } else if (e.key === "ArrowRight") setI((v) => Math.min(PASOS_DEMO.length - 1, v + 1));
      else if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
      else if (e.key === "Escape") setActivo(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [activo]);

  if (fin) {
    return (
      <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-5 bg-primario p-6 text-center text-white" role="dialog" aria-label="Fin de la demo">
        <Logo size={64} />
        <p className="font-display text-4xl font-bold">respira</p>
        <p className="max-w-xl text-2xl font-semibold">Empieza en tu familia, crece en tu comunidad.</p>
        <p className="text-lg text-white/85">Porque nadie debería cuidar sola.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primario" onClick={() => emitirDemo("iniciar")}>Repetir demo</button>
          <button type="button" className="rounded-xl border border-white/50 px-4 py-2.5 text-sm font-semibold" onClick={() => setFin(false)}>Cerrar</button>
        </div>
      </div>
    );
  }
  if (!activo) return null;
  const p = PASOS_DEMO[i];

  return (
    <div className={`pointer-events-none fixed bottom-[84px] z-[90] flex px-3 md:bottom-4 ${guion ? "inset-x-0 justify-center" : "left-0 md:left-[272px]"}`} aria-live="polite">
      <div className={`pointer-events-auto overflow-hidden rounded-2xl text-white shadow-2xl backdrop-blur ${guion ? "w-full max-w-[760px]" : "max-w-[440px]"}`} style={{ background: "rgba(27,30,51,0.92)" }}>
        <div className="h-1 w-full bg-white/15">
          <div key={`${i}-${activo}`} className="h-1 bg-white" style={{ animation: `avance ${p.seg}s linear forwards`, animationPlayState: pausa ? "paused" : "running" }} />
        </div>
        <div className={`flex items-start gap-3 ${guion ? "p-3.5" : "px-3 py-2"}`}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">Demo · {i + 1}/{PASOS_DEMO.length}{guion ? ` · ${p.bloque}` : ""}</span>
            <span className="truncate text-sm font-semibold">{p.t}</span>
            {guion && <span className="text-sm leading-snug text-white/85">{p.dice}</span>}
          </div>
          <button type="button" aria-pressed={guion} aria-label="Mostrar el guion" title="Mostrar u ocultar el guion" className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${guion ? "bg-white/20" : "hover:bg-white/10"}`} onClick={() => setGuion(!guion)}>CC</button>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" aria-label="Paso anterior" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" onClick={() => setI(Math.max(0, i - 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>
            </button>
            <button type="button" aria-label={pausa ? "Reanudar" : "Pausar"} className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink" onClick={() => setPausa(!pausa)}>
              {pausa ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
              )}
            </button>
            <button type="button" aria-label="Paso siguiente" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" onClick={() => setI(Math.min(PASOS_DEMO.length - 1, i + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>
            </button>
            <button type="button" aria-label="Salir de la demo" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" onClick={() => { emitirDemo("cerrar-alerta"); setActivo(false); }}>
              <Icono n="salir" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

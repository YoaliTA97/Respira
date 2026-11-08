"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useData } from "@/lib/db";
import { TUTORIALES } from "@/lib/catalogos";
import { cvCuidado, estadoCertificaciones, ingresoCuidado } from "@/lib/calculos";
import { TechTag } from "@/components/TechTag";
import { useDemoEvento } from "@/lib/demo";
import { Avatar, btnPrimary, btnSecondary } from "@/components/ui";

// Pasaporte de Cuidado: cada hora que se cuida suma hasta la certificación oficial del CONOCER.
export default function Pasaporte() {
  const { db, ahora, usuario, simularSeisMeses } = useData();
  const [lleno, setLleno] = useState(0); // 0 → 1: animación de llenado
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let frame = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / 1800);
      setLleno(1 - Math.pow(1 - p, 3));
      if (p < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame((t) => {
      setLleno(0);
      paso(t);
    });
    return () => cancelAnimationFrame(frame);
  }, [vuelta]);
  useDemoEvento((ev) => ev === "pasaporte-llenar" && setVuelta((v) => v + 1));
  if (!usuario) return null;

  const cert = estadoCertificaciones(db, usuario.id, ahora).find((c) => c.def.id === "ec0669")!;
  const cv = cvCuidado(db, usuario.id, ahora);
  const meta = cert.def.horasMinimas;
  const horas = cert.horas;
  const pct = Math.min(1, horas / meta);
  const requisitos = cert.def.requiere.map((id) => ({ t: TUTORIALES.find((x) => x.id === id)!, ok: !cert.faltan.includes(id) }));
  const certificada = cert.estado === "certificada";
  const sello = certificada && lleno >= 0.98;
  const ingreso = ingresoCuidado(db, usuario.id);

  return (
    <TechTag k="trayectoria">
      <div className="mx-auto flex max-w-[760px] flex-col gap-5">
        <section className="relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-line bg-white p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Avatar nombre={usuario.nombre} tono={usuario.tono} size={52} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Pasaporte de Cuidado</span>
              <h1 className="text-2xl font-semibold tracking-tight">{usuario.nombre}</h1>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">Horas de cuidado registradas</span>
              <span className="text-3xl font-semibold tracking-tight">{Math.round(horas * lleno)} <span className="text-base font-medium text-muted">/ {meta} h</span></span>
            </div>
            <div className="h-5 w-full overflow-hidden rounded-full bg-realce" role="meter" aria-label="Horas para la certificación" aria-valuenow={horas} aria-valuemin={0} aria-valuemax={meta}>
              <div className="h-5 rounded-full bg-primario" style={{ width: `${pct * lleno * 100}%` }} />
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {requisitos.map(({ t, ok }) => (
              <li key={t.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${ok ? "border-primario/30 bg-realce/40" : "border-line text-muted"}`}>
                <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${ok ? "bg-primario text-white" : "border border-line"}`}>{ok ? "✓" : ""}</span>
                {t.habilidad}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">{cv.confirmadas} registros confirmados por otra persona · {cv.relevos} relevos cubiertos{ingreso ? ` · $${ingreso.toLocaleString("es-MX")} de ingreso por cuidar` : ""}</p>

          <div className="flex min-h-[150px] items-center justify-center">
            {sello ? (
              <div className="flex h-40 w-40 rotate-[-8deg] flex-col items-center justify-center rounded-full border-[5px] border-double border-primario text-center text-primario" style={{ animation: "sello .45s ease-out" }}>
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">Certificada</span>
                <span className="font-display text-2xl font-bold">CONOCER</span>
                <span className="text-xs font-semibold">EC0669</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center text-sm text-muted">
                <span className="grid h-32 w-32 place-items-center rounded-full border-2 border-dashed border-line font-display text-lg text-line">EC0669</span>
                {cert.estado === "disponible" ? "Ya cubres lo que pide el EC0669: agenda tu evaluación." : cert.estado === "agendada" ? `Evaluación agendada: ${cert.cita}` : `Faltan ${Math.max(0, meta - horas)} h y ${cert.faltan.length} habilidad(es).`}
              </div>
            )}
          </div>
          {sello && usuario.seguridadSocial && <p className="text-center text-sm font-semibold text-primario">Cotiza en el IMSS como trabajadora independiente · apartado automático de {usuario.seguridadSocial.apartadoPct}%</p>}
        </section>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          {[
            { d: "M16 11a4 4 0 1 0-8 0M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6M15 7l2 2 4-4", t: "Una persona confirma cada registro" },
            { d: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3", t: "Datos mínimos y voluntarios" },
            { d: "M9 3h6v11H9zM5 11a7 7 0 0 0 14 0M12 18v3", t: "La IA escucha, resume y alerta; no diagnostica" },
          ].map((x) => (
            <div key={x.t} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2e3f8f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={x.d} /></svg>
              <span className="text-ink-2">{x.t}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 print:hidden">
          <button type="button" className={btnSecondary} onClick={() => setVuelta(vuelta + 1)}>Ver cómo se llena</button>
          {!certificada && <button type="button" className={btnPrimary} onClick={() => { simularSeisMeses(); setVuelta(vuelta + 1); }}>Seis meses después (demo)</button>}
          <Link href="/capacitacion" className={btnSecondary}>Capacitación</Link>
          <Link href="/cv" className={btnSecondary}>CV de cuidado</Link>
        </div>
      </div>
    </TechTag>
  );
}

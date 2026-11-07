"use client";

import Link from "next/link";
import { GuionLista } from "@/components/Guion";
import { Logo } from "@/components/DemoBar";
import { btnPrimary, btnSecondary } from "@/components/ui";

const CICLO = [
  { t: "Registro familiar", d: "Estado de la persona cuidada y quién hizo qué" },
  { t: "Evidencia verificada", d: "Lo que confirma otra persona o la promotora" },
  { t: "Certificación", d: "Por experiencia, de C1 a C3 con CONOCER" },
  { t: "Financiamiento", d: "Apoyos y respiro pagados por terceros" },
  { t: "Red de respiro", d: "Quien ya sabe cuidar releva a otras familias" },
];

const ROLES = [
  { href: "/app", t: "Familia", d: "Web app para el teléfono: inicio, registrar, turnos, red y Pasaporte" },
  { href: "/app/whatsapp", t: "WhatsApp", d: "Canal de entrada y salida para quien no abre la app" },
  { href: "/panel", t: "Promotora", d: "Revisa alertas rojas, canaliza y valida prácticas" },
  { href: "/panel/cooperativa", t: "Cooperativa y pagador", d: "Confirma relevos y administra la bolsa de horas" },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-4 py-10">
      <section className="flex flex-wrap items-end justify-between gap-8">
        <div className="flex max-w-[640px] flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <h1 className="text-[44px] font-semibold leading-none tracking-[-0.03em]">Respira</h1>
          </div>
          <p className="text-2xl font-medium leading-snug tracking-tight">La red que cuida a quien cuida.</p>
          <p className="text-[15px] leading-relaxed text-muted">
            La familia registra el estado de la persona cuidada y lo que cada quien hace por ella. Ese registro reparte la carga, respalda la certificación de las cuidadoras, les abre financiamiento y activa una red de respiro con personas cercanas que ya saben cuidar.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/app/crear-red" className={btnPrimary}>
              Empezar la demo
            </Link>
            <Link href="/tecnico" className={btnSecondary}>
              Ver mapa técnico
            </Link>
          </div>
        </div>
        <p className="max-w-[360px] rounded-2xl border border-line bg-white p-4 text-[13px] leading-relaxed text-muted">
          Demo con datos sintéticos: Rosa y su familia son personas ficticias. Todo corre en tu navegador; usa <strong className="text-ink">Reiniciar</strong> para volver al inicio. Abre la app y el panel de la promotora en dos pestañas para ver la alerta llegar en vivo.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">El ciclo</h2>
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {CICLO.map((c, i) => (
            <li key={c.t} className={`flex flex-col gap-1 rounded-2xl border p-4 ${i === 4 ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
              <span className={`text-xs ${i === 4 ? "text-[#c9c9c6]" : "text-muted"}`}>{i === 4 ? "5, y vuelve a empezar" : i + 1}</span>
              <span className="text-[15px] font-semibold">{c.t}</span>
              <span className={`text-[13px] ${i === 4 ? "text-[#d9d9d6]" : "text-muted"}`}>{c.d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Guion para el jurado</h2>
          <p className="text-sm text-muted">Ocho pasos, unos 5 minutos. Cada paso abre la pantalla que lo muestra.</p>
          <GuionLista />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Entrar por rol</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ROLES.map((r) => (
              <Link key={r.href} href={r.href} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5 transition hover:border-ink">
                <span className="text-base font-semibold">{r.t}</span>
                <span className="text-sm leading-snug text-muted">{r.d}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

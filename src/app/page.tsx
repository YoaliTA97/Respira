"use client";

import Link from "next/link";
import { useData } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { btnPrimary, btnSecondary } from "@/components/ui";

const SECCIONES = [
  { t: "Red de cuidado", d: "La familia es el nodo principal: disponibilidad, relevos de 4, 6 u 8 horas e intercambio de horas o dinero." },
  { t: "Reporte y alertas", d: "Al recibir a la persona, una nota de voz con sus signos. Si se cumple la trifecta de alerta, aviso por WhatsApp y mapa de centros." },
  { t: "Capacitación y certificación", d: "Tutoriales según lo que necesita la persona cuidada. Las horas y habilidades desbloquean certificaciones." },
];

export default function Inicio() {
  const { usuario } = useData();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl font-bold tracking-tight">respira</span>
        </div>
        <div className="flex gap-2">
          {usuario ? (
            <Link href="/inicio" className={btnPrimary}>Ir a mi red</Link>
          ) : (
            <>
              <Link href="/login" className={btnSecondary}>Iniciar sesión</Link>
              <Link href="/registro" className={btnPrimary}>Crear cuenta</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-[1180px] flex-col gap-14 px-5 pb-16 pt-10">
        <section className="flex max-w-[720px] flex-col gap-5">
          <p className="text-sm font-medium text-muted">Ciudad de México y área metropolitana</p>
          <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[56px]">Se cae la abuela. ¿Quién empieza con los cuidados? La familia.</h1>
          <p className="text-lg leading-relaxed text-ink-2">
            Respira organiza a la familia para cuidar en red, avisa cuando la persona necesita más de lo que se puede atender en casa y convierte la experiencia de la cuidadora en certificaciones que abren empleo formal, seguro y pensión.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/registro" className={`${btnPrimary} min-h-[50px] px-6 text-[15px]`}>Dar de alta a mi familia</Link>
            <Link href="/login" className={`${btnSecondary} min-h-[50px] px-6 text-[15px]`}>Entrar a la familia de ejemplo</Link>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {SECCIONES.map((s, i) => (
            <div key={s.t} className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5">
              <span className="text-xs font-semibold text-muted">{i + 1}</span>
              <h2 className="text-lg font-semibold tracking-tight">{s.t}</h2>
              <p className="text-sm leading-relaxed text-ink-2">{s.d}</p>
            </div>
          ))}
        </section>

        <p className="text-xs text-muted">
          Versión de demostración: la familia de ejemplo es ficticia y los datos se guardan en este navegador. Los centros del mapa vienen del DENUE del INEGI.{" "}
          <Link href="/tecnico" className="underline">Ver mapa técnico</Link>
        </p>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/lib/store";

export function useGuion() {
  const { state } = useDemo();
  const registroApp = state.events.some((e) => e.casoId === state.casoId && e.canal === "app" && !e.id.startsWith("e-seed"));
  const alertaRosa = state.alerts.find((a) => a.casoId === state.casoId);
  const relevo = state.relevos.find((r) => r.casoId === state.casoId);
  return [
    { n: 1, href: "/app/crear-red", titulo: "Crear la red familiar", texto: "Rosa da de alta a su mamá e invita a su hermano y a su hija.", hecho: false },
    { n: 2, href: "/app/registrar", titulo: "Registrar con confirmación", texto: "Rosa anota que movilizó a su mamá; Mariana lo confirma.", hecho: registroApp },
    { n: 3, href: "/app/whatsapp", titulo: "Audio por WhatsApp", texto: "Rosa cuenta por voz que su mamá amaneció confundida.", hecho: state.chatFase === "confirmado" },
    { n: 4, href: "/panel", titulo: "La promotora revisa", texto: "Confirma la alerta roja, canaliza y valida la práctica.", hecho: alertaRosa?.estado === "confirmada" },
    { n: 5, href: "/app/turnos", titulo: "Turnos y relevo cercano", texto: "Hueco el sábado: Rosa pide un relevo en su radio.", hecho: !!relevo },
    { n: 6, href: "/panel/cooperativa", titulo: "La cooperativa confirma", texto: "El relevo se descuenta de la bolsa del DIF.", hecho: relevo?.estado === "confirmado" },
    { n: 7, href: "/app/pasaporte", titulo: "Pasaporte y financiamiento", texto: "Horas verificadas, habilidades y apoyos elegibles.", hecho: false },
    { n: 8, href: "/panel/indicadores", titulo: "Indicadores", texto: "Carga por género, respiro y alertas atendidas.", hecho: false },
  ];
}

export function GuionLista({ compacto = false }: { compacto?: boolean }) {
  const pasos = useGuion();
  const pathname = usePathname();
  return (
    <ol className="flex flex-col gap-1.5">
      {pasos.map((p) => {
        const actual = pathname === p.href;
        return (
          <li key={p.n}>
            <Link
              href={p.href}
              className={`flex gap-3 rounded-2xl border p-3 transition ${
                actual ? "border-ink bg-white" : "border-transparent hover:border-line hover:bg-white"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  p.hecho ? "bg-ink text-white" : "border border-line bg-white text-ink"
                }`}
              >
                {p.hecho ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="hecho">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                ) : (
                  p.n
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{p.titulo}</span>
                {!compacto && <span className="text-[13px] leading-snug text-muted">{p.texto}</span>}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

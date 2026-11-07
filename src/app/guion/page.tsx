"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CODIGO_DEMO, useData } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { Avatar, btnPrimary, btnSecondary } from "@/components/ui";

// Guion de 3 minutos: cada paso entra con la persona indicada y abre la pantalla, con datos de
// ejemplo ya cargados para no capturar en vivo.
const PASOS = [
  { t: "La familia es el nodo", quien: "5510000001", ruta: "/familia", seg: 25, dice: "Se cae la abuela: Rosa coordina. Indicadores del mes: horas de relevo, sobrecarga con Zarit, alertas atendidas a tiempo y cuidadoras certificadas con ingreso." },
  { t: "Todos entran con un QR", quien: "5510000001", ruta: "/integrantes", seg: 15, dice: "Mapa de nodos y roles. «Proyectar en pantalla» muestra el QR: cada integrante entra desde su teléfono." },
  { t: "La voz de Lucía", quien: "5510000012", ruta: "/mi-voz", seg: 25, dice: "Lucía no es solo paciente: su perfil en sus palabras, sus decisiones de salud, quién ve su historial, sus metas y lo que aporta." },
  { t: "Recibir el turno con checklist", quien: "5510000002", ruta: "/valoracion", seg: 25, dice: "Jorge recibe a Lucía. «Ejemplo de alerta» llena biométricos, síntomas y conciencia: la trifecta da rojo. Guardar y enviar al chat." },
  { t: "Alerta: familia, SIDECU y ficha", quien: "5510000002", ruta: "/alertas", seg: 20, dice: "WhatsApp a los principales con el enlace a SIDECU, ficha de emergencia con sus decisiones. El botón de pánico avisa a toda la familia." },
  { t: "Relevos y red por radio", quien: "5510000001", ruta: "/red", seg: 25, dice: "El sábado no está cubierto: Rosa busca por radio en la red de Respira y en la base de SIDECU. Intercambio de horas o pago." },
  { t: "Equipo que se presta", quien: "5510000001", ruta: "/equipo", seg: 15, dice: "Les falta un oxímetro: Lupita lo presta; o se renta con un aliado." },
  { t: "Del cuidado a la trayectoria", quien: "5510000004", ruta: "/cv", seg: 30, dice: "Lupita: habilidades verificadas, evidencia confirmada por otra persona, certificación de la Cruz Roja e ingreso. Ese es el diferenciador." },
];

export default function Guion() {
  const { db, iniciarSesion, reiniciarDemo } = useData();
  const router = useRouter();
  const abrir = (tel: string, ruta: string) => {
    if (iniciarSesion(tel, CODIGO_DEMO)) router.push(ruta);
  };
  const total = PASOS.reduce((a, p) => a + p.seg, 0);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Guion de presentación</h1>
          <p className="text-sm text-muted">{PASOS.length} pasos · unos {Math.round(total / 60)} minutos · con datos de ejemplo ya cargados</p>
        </div>
        <button type="button" className={btnSecondary} onClick={reiniciarDemo}>Reiniciar familia de ejemplo</button>
      </div>
      <ol className="flex flex-col gap-3">
        {PASOS.map((p, i) => {
          const u = db.usuarios.find((x) => x.telefono === p.quien);
          return (
            <li key={p.t} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 md:flex-row md:items-center">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primario text-sm font-semibold text-white">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">{p.t} <span className="text-xs font-normal text-muted">~{p.seg} s</span></span>
                <span className="text-sm text-ink-2">{p.dice}</span>
              </div>
              {u && (
                <button type="button" onClick={() => abrir(p.quien, p.ruta)} className={`${btnPrimary} shrink-0`}>
                  <Avatar nombre={u.nombre} tono={u.tono} size={24} />
                  Entrar como {u.nombre.split(" ")[0]}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">Tip: abre el guion en una pestaña y cada paso en otra. Los datos se comparten entre pestañas del mismo navegador. Activa «Capa técnica» para mostrar qué respalda cada pantalla.</p>
    </div>
  );
}

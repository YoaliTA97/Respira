import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Quién paga y el impacto · Respira" };

// Bloque 5 del pitch: quién paga (nunca la familia ni la cuidadora) y el impacto proyectado.
const PAGADORES = [
  { t: "Empresas", d: "Pierden talento cuando una empleada cuida sola. Prestación + NOM-035.", icono: "M4 21V8l8-5 8 5v13M9 21v-6h6v6" },
  { t: "Aseguradoras", d: "Pagan reingresos y urgencias evitables.", icono: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" },
  { t: "Gobiernos", d: "Tienen presupuesto etiquetado para cuidados (Anexo 31).", icono: "M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-6 10 6z" },
];

const CIFRAS = [
  { v: "30 mil", t: "familias" },
  { v: "6 millones", t: "de horas de descanso al año" },
  { v: "$374 millones", t: "pagados a cuidadoras certificadas" },
];

export default function Impacto() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>

      <section className="flex flex-col gap-4">
        <h1 className="text-[32px] font-semibold tracking-tight">¿Quién paga?</h1>
        <p className="text-lg text-ink-2">Nunca la familia ni la cuidadora. Pagan quienes hoy cargan con el costo de que el cuidado falle.</p>
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col gap-3">
            {PAGADORES.map((p) => (
              <div key={p.t} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2e3f8f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p.icono} /></svg>
                <span className="flex flex-col"><span className="font-semibold">{p.t}</span><span className="text-sm text-muted">{p.d}</span></span>
              </div>
            ))}
          </div>
          <svg width="80" height="40" viewBox="0 0 80 40" className="mx-auto rotate-90 md:rotate-0" aria-hidden="true"><path d="M4 20h64M56 8l14 12-14 12" fill="none" stroke="#2e3f8f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-primario p-8 text-center text-white">
            <Logo size={44} />
            <span className="font-display text-3xl font-bold">respira</span>
            <span className="text-sm text-white/85">Lo que pagan las empresas cubre también a las cuidadoras que no tienen empleador.</span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">En cinco años</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {CIFRAS.map((c) => (
            <div key={c.t} className="flex flex-col gap-1 rounded-3xl border border-line bg-white p-6">
              <span className="font-display text-[44px] font-bold leading-none tracking-tight text-primario">{c.v}</span>
              <span className="text-ink-2">{c.t}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">Proyecciones del caso base, con supuestos explícitos: números positivos en el año 4. Con la mitad de la adopción, el equilibrio llega en el año 5.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Primer paso</span>
          <p className="mt-1 text-xl font-semibold">Piloto de 100 cuidadoras en una alcaldía de la CDMX</p>
          <p className="mt-1 text-sm text-muted">Mide horas de relevo, sobrecarga (Zarit), alertas atendidas a tiempo, Mi voz completo, certificación y seguridad social.</p>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Qué necesitamos hoy</span>
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-[15px]">
            <li>Una alcaldía aliada para el piloto</li>
            <li>3 a 5 empresas dispuestas a probar el servicio</li>
            <li>Fondos no reembolsables por ~3.4 millones de pesos</li>
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/respaldo" className="font-semibold text-primario underline">Límites y alcances</Link>
        <Link href="/guion" className="font-semibold text-primario underline">Guion de presentación</Link>
      </div>
    </div>
  );
}

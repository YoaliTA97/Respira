"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useData, type PerfilNuevo } from "@/lib/db";
import { semana } from "@/lib/seed";
import { ALCALDIAS, ROLES_INTERES, SUGERENCIAS_EXPERIENCIA, SUGERENCIAS_ROL, telefonoLimpio } from "@/lib/catalogos";
import type { Usuario } from "@/lib/types";
import { DisponibilidadEditor } from "@/components/Disponibilidad";
import { Logo } from "@/components/Logo";
import { TechTag } from "@/components/TechTag";
import { Etiquetas, Segmentado, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const PASOS = ["Tu cuenta", "Tu perfil de cuidado", "¿Qué sigue?"];

export default function Registro() {
  const { db, crearCuenta } = useData();
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [p, setP] = useState<PerfilNuevo>({
    nombre: "", telefono: "", genero: "mujer", alcaldia: "Coyoacán", roles: ["Cuidar a mi familiar"], experiencia: [], disponibilidad: semana(8, 20), bio: "",
    ofreceAyuda: { activo: false, radioKm: 3, modalidades: ["intercambio de horas"], tarifaHora: 100 },
  });
  const tel = p.telefono.replace(/\D/g, "");
  const existente = db.usuarios.find((u) => u.telefono === tel);
  const yaTieneCuenta = !!existente && existente.alcaldia !== "";
  const invitado = !!existente && !yaTieneCuenta;
  const valido = paso === 0 ? p.nombre.trim().length > 1 && tel.length === 10 && !yaTieneCuenta : true;
  const toggleMod = (m: Usuario["ofreceAyuda"]["modalidades"][number]) =>
    setP({ ...p, ofreceAyuda: { ...p.ofreceAyuda, modalidades: p.ofreceAyuda.modalidades.includes(m) ? p.ofreceAyuda.modalidades.filter((x) => x !== m) : [...p.ofreceAyuda.modalidades, m] } });

  const terminar = (destino: string) => {
    crearCuenta({ ...p, nombre: p.nombre.trim() });
    router.push(destino);
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[820px] items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl font-bold tracking-tight">respira</span>
        </Link>
        <Link href="/login" className="text-sm font-medium text-muted">Ya tengo cuenta</Link>
      </header>
      <main className="mx-auto flex max-w-[820px] flex-col gap-6 px-5 pb-16">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1.5">{PASOS.map((s, i) => <span key={s} className={`h-1 rounded-full ${i <= paso ? "bg-primario" : "bg-[#dfe2ee]"}`} />)}</div>
          <div className="grid grid-cols-3 gap-1.5 text-xs text-muted">{PASOS.map((s, i) => <span key={s} className={i === paso ? "font-semibold text-ink" : ""}>{s}</span>)}</div>
        </div>

        <TechTag k="perfil">
          <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-6 md:p-8">
            {paso === 0 && (
              <>
                <div>
                  <h1 className="text-[28px] font-semibold tracking-tight">Crea tu cuenta</h1>
                  <p className="mt-1 text-muted">Tu perfil es individual: lo llevas a tu espacio familiar y a la red de cuidado.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="n" className={label}>Nombre completo</label>
                    <input id="n" className={input} value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="t" className={label}>Teléfono celular (WhatsApp)</label>
                    <input id="t" inputMode="tel" placeholder="10 dígitos" className={input} value={p.telefono} onChange={(e) => setP({ ...p, telefono: telefonoLimpio(e.target.value) })} />
                    {yaTieneCuenta && <span className="text-xs text-red-ink">Ese teléfono ya tiene cuenta. <Link href="/login" className="underline">Inicia sesión</Link>.</span>}
                    {invitado && <span className="text-xs text-green-ink">Tienes una invitación esperando: al crear tu cuenta podrás aceptarla.</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className={label}>Género</span>
                    <Segmentado etiqueta="Género" valor={p.genero} onChange={(v) => setP({ ...p, genero: v })} opciones={[{ v: "mujer", t: "Mujer" }, { v: "hombre", t: "Hombre" }, { v: "otro", t: "Otro" }]} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="a" className={label}>Alcaldía o municipio</label>
                    <select id="a" className={input} value={p.alcaldia} onChange={(e) => setP({ ...p, alcaldia: e.target.value })}>
                      {ALCALDIAS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
            {paso === 1 && (
              <>
                <div>
                  <h1 className="text-[28px] font-semibold tracking-tight">Tu perfil de cuidado</h1>
                  <p className="mt-1 text-muted">Qué roles puedes desempeñar y cuándo. Tus habilidades se irán sumando con la capacitación.</p>
                </div>
                <fieldset className="flex flex-col gap-2">
                  <legend className={`${label} mb-2`}>Roles que puedes desempeñar</legend>
                  <Etiquetas etiqueta="Roles que puedes desempeñar" valor={p.roles} onChange={(roles) => setP({ ...p, roles })} opciones={ROLES_INTERES} sugerencias={SUGERENCIAS_ROL} placeholder="¿Otro? Ej. llevar a consultas" />
                </fieldset>
                <fieldset className="flex flex-col gap-2">
                  <legend className={`${label} mb-2`}>Experiencia que ya tienes (opcional)</legend>
                  <Etiquetas etiqueta="Experiencia que ya tienes" valor={p.experiencia ?? []} onChange={(experiencia) => setP({ ...p, experiencia })} sugerencias={SUGERENCIAS_EXPERIENCIA} placeholder="Ej. aplicar insulina, primeros auxilios" />
                </fieldset>
                <div className="flex flex-col gap-2">
                  <span className={label}>¿Cuándo puedes cuidar?</span>
                  <DisponibilidadEditor valor={p.disponibilidad} onChange={(d) => setP({ ...p, disponibilidad: d })} />
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-line p-4">
                  <label className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold">Quiero ayudar a otras familias de la red</span>
                    <input type="checkbox" role="switch" className="h-5 w-9 accent-primario" checked={p.ofreceAyuda.activo} onChange={(e) => setP({ ...p, ofreceAyuda: { ...p.ofreceAyuda, activo: e.target.checked } })} />
                  </label>
                  {p.ofreceAyuda.activo && (
                    <>
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className={label}>Radio: {p.ofreceAyuda.radioKm} km</span>
                        <input type="range" min={1} max={15} value={p.ofreceAyuda.radioKm} onChange={(e) => setP({ ...p, ofreceAyuda: { ...p.ofreceAyuda, radioKm: Number(e.target.value) } })} className="accent-primario" />
                      </label>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {(["intercambio de horas", "pago", "programa de apoyo"] as const).map((m) => (
                          <label key={m} className="flex items-center gap-2">
                            <input type="checkbox" className="h-4 w-4 accent-primario" checked={p.ofreceAyuda.modalidades.includes(m)} onChange={() => toggleMod(m)} />
                            {m}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            {paso === 2 && (
              <>
                <div>
                  <h1 className="text-[28px] font-semibold tracking-tight">¿Qué quieres hacer?</h1>
                  <p className="mt-1 text-muted">Puedes hacer las tres cosas; empieza por una.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <button type="button" onClick={() => terminar("/nueva-familia")} className="flex flex-col gap-2 rounded-2xl border border-primario p-5 text-left hover:bg-chip">
                    <span className="font-semibold">Crear el espacio de mi familia</span>
                    <span className="text-sm text-muted">Das de alta a quien cuidas, su condición y a tu familia.</span>
                  </button>
                  <button type="button" onClick={() => terminar("/inicio")} className="flex flex-col gap-2 rounded-2xl border border-line p-5 text-left hover:border-primario">
                    <span className="font-semibold">Unirme a mi familia</span>
                    <span className="text-sm text-muted">{invitado ? "Tienes una invitación pendiente." : "Si alguien te invitó con tu teléfono, la verás en tu inicio."}</span>
                  </button>
                  <button type="button" onClick={() => terminar("/red")} className="flex flex-col gap-2 rounded-2xl border border-line p-5 text-left hover:border-primario">
                    <span className="font-semibold">Ayudar en la red</span>
                    <span className="text-sm text-muted">Recibe solicitudes de relevo de familias cercanas.</span>
                  </button>
                </div>
              </>
            )}
            {paso < 2 && (
              <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-5">
                {paso > 0 ? <button type="button" className={btnSecondary} onClick={() => setPaso(paso - 1)}>Atrás</button> : <Link href="/" className={btnSecondary}>Cancelar</Link>}
                <button type="button" className={btnPrimary} disabled={!valido} onClick={() => setPaso(paso + 1)}>Continuar</button>
              </div>
            )}
          </section>
        </TechTag>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import type { Member, Tone } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { Avatar, BottomBar, Chip, Pill, WizardHeader, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const PASOS = ["A quién cuidas", "Tu familia", "Permisos"];
const RELACIONES = ["mamá", "papá", "pareja", "abuela", "otra persona"];
const CONDICIONES = ["Diabetes", "Hipertensión", "Demencia", "Movilidad reducida", "Otra"];
const AYUDA: Member["ayuda"][] = ["A diario", "Algunos días", "Solo avisos"];
const TONOS: Tone[] = ["mid", "light", "dark"];

export default function CrearRedPage() {
  const { state, guardarRed, avisar } = useDemo();
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [recipient, setRecipient] = useState(state.recipient);
  const [members, setMembers] = useState<Member[]>(state.members);
  const [consent, setConsent] = useState(state.consent);
  const [nuevo, setNuevo] = useState({ nombre: "", whatsapp: "", ayuda: "A diario" as Member["ayuda"] });

  const agregar = () => {
    if (!nuevo.nombre.trim()) return;
    setMembers((ms) => [
      ...ms,
      {
        id: `m-${ms.length + 1}-${nuevo.nombre.toLowerCase()}`,
        nombre: nuevo.nombre.trim(),
        relacion: "Familiar",
        ayuda: nuevo.ayuda,
        estado: "Invitado",
        genero: "mujer",
        tono: TONOS[ms.length % TONOS.length],
        horasBaseSemana: 0,
      },
    ]);
    avisar(`Invitación enviada por WhatsApp a ${nuevo.nombre.trim()} (simulado)`);
    setNuevo({ nombre: "", whatsapp: "", ayuda: "A diario" });
  };

  const terminar = () => {
    guardarRed(recipient, members, consent);
    avisar("Red familiar lista");
    router.push("/app");
  };

  const toggleCond = (c: string) =>
    setRecipient((r) => ({
      ...r,
      condiciones: r.condiciones.includes(c) ? r.condiciones.filter((x) => x !== c) : [...r.condiciones, c],
    }));

  return (
    <div className="flex flex-1 flex-col gap-5 pt-4">
      <WizardHeader titulo="Crear la red" paso={paso} pasos={PASOS} onVolver={paso > 1 ? () => setPaso(paso - 1) : undefined} />

      {paso === 1 && (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">¿A quién cuidas?</h1>
            <p className="text-[15px] leading-relaxed text-muted">Con esto armamos el caso que comparte tu familia.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre-cuidada" className={label}>Nombre</label>
            <input id="nombre-cuidada" className={input} value={recipient.nombre} onChange={(e) => setRecipient({ ...recipient, nombre: e.target.value })} />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>Es tu…</legend>
            <div className="flex flex-wrap gap-2">
              {RELACIONES.map((r) => (
                <Chip key={r} selected={recipient.relacion === r} onClick={() => setRecipient({ ...recipient, relacion: r })}>
                  {r}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>¿Vive con alguna condición?</legend>
            <div className="flex flex-wrap gap-2">
              {CONDICIONES.map((c) => (
                <Chip key={c} selected={recipient.condiciones.includes(c)} onClick={() => toggleCond(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="municipio" className={label}>Municipio</label>
            <input id="municipio" className={input} value={recipient.municipio} onChange={(e) => setRecipient({ ...recipient, municipio: e.target.value })} />
          </div>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">Invita a tu familia</h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Quienes cuidan a {recipient.nombre} registran lo que hacen. Así el cuidado se reparte y se reconoce.
            </p>
          </div>
          <TechTag k="red-familiar">
            <ul className="overflow-hidden rounded-2xl border border-line bg-white">
              {members.map((m, i) => (
                <li key={m.id} className={`flex items-center gap-3 px-3.5 py-3 ${i < members.length - 1 ? "border-b border-line-soft" : ""}`}>
                  <Avatar nombre={m.nombre} tone={m.tono} size={36} />
                  <div className="flex flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{m.estado === "Tú" ? `${m.nombre} (tú)` : m.nombre}</span>
                    <span className="text-[13px] text-muted">
                      {m.relacion} · {m.ayuda.toLowerCase()}
                    </span>
                  </div>
                  <Pill tone={m.estado === "Aceptó" ? "green" : "neutral"}>{m.estado}</Pill>
                </li>
              ))}
            </ul>
          </TechTag>
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[#cfcfcb] bg-white p-4">
            <span className="text-sm font-semibold">Agregar a alguien más</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nuevo-nombre" className={label}>Nombre</label>
                <input id="nuevo-nombre" className={input} placeholder="Ej. Tere" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nuevo-wa" className={label}>WhatsApp</label>
                <input id="nuevo-wa" className={input} placeholder="10 dígitos" inputMode="tel" value={nuevo.whatsapp} onChange={(e) => setNuevo({ ...nuevo, whatsapp: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-1 rounded-xl bg-chip p-1" role="group" aria-label="Cómo ayuda">
              {AYUDA.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={nuevo.ayuda === a}
                  onClick={() => setNuevo({ ...nuevo, ayuda: a })}
                  className={`min-h-[40px] flex-1 rounded-lg text-sm ${nuevo.ayuda === a ? "border border-line bg-white font-semibold" : "font-medium text-muted"}`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button type="button" onClick={agregar} disabled={!nuevo.nombre.trim()} className={`${btnSecondary} disabled:opacity-40`}>
              Enviar invitación por WhatsApp
            </button>
          </div>
        </>
      )}

      {paso === 3 && (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">Tú decides qué se comparte</h1>
            <p className="text-[15px] leading-relaxed text-muted">Puedes cambiarlo o borrar todo cuando quieras.</p>
          </div>
          <TechTag k="consentimiento">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
              {[
                { k: "registro" as const, t: "Guardar lo que registra la familia", d: `Estado de ${recipient.nombre} y lo que cada quien hace. Es necesario para usar Respira.` },
                { k: "promotora" as const, t: "Compartir alertas con una promotora de salud", d: "Solo cuando el semáforo marca rojo, para que una persona la revise." },
                { k: "indicadores" as const, t: "Sumar a indicadores sin nombres", d: "Horas de cuidado y respiro, agregadas, para políticas públicas." },
              ].map((o, i) => (
                <label key={o.k} className={`flex cursor-pointer gap-3 p-4 ${i < 2 ? "border-b border-line-soft" : ""}`}>
                  <input
                    type="checkbox"
                    checked={consent[o.k]}
                    onChange={(e) => setConsent({ ...consent, [o.k]: e.target.checked })}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{o.t}</span>
                    <span className="text-[13px] leading-snug text-muted">{o.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </TechTag>
          <p className="text-[13px] leading-relaxed text-muted">
            Respira no da diagnósticos. Si algo es urgente, te dice a dónde acudir. Escribe BORRAR por WhatsApp para eliminar tu historial.
          </p>
        </>
      )}

      <BottomBar>
        {paso < 3 ? (
          <button type="button" className={btnPrimary} onClick={() => setPaso(paso + 1)} disabled={paso === 1 && !recipient.nombre.trim()}>
            Continuar
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={terminar} disabled={!consent.registro}>
            Crear la red familiar
          </button>
        )}
        <span className="text-center text-xs text-muted">{paso === 2 ? "Puedes invitar a más personas después" : `Paso ${paso} de 3`}</span>
      </BottomBar>
    </div>
  );
}

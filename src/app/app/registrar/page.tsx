"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import type { Senal, SkillId } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { Avatar, BottomBar, Chip, Pill, WizardHeader, btnPrimary, label } from "@/components/ui";

const PASOS = ["Qué pasó", "Detalles", "Quién lo vio"];

type Opcion = { categoria: string; tipo: "accion" | "observacion"; competencia?: SkillId; detalle: string; senales: Senal[] };

const ACCIONES: Opcion[] = [
  { categoria: "Movilización", tipo: "accion", competencia: "movilizacion", detalle: "La pasé de la cama a la silla para desayunar.", senales: ["tranquila"] },
  { categoria: "Medicamento", tipo: "accion", competencia: "medicamentos", detalle: "Le di su medicamento de la tarde.", senales: [] },
  { categoria: "Comida", tipo: "accion", competencia: "alimentacion", detalle: "Le preparé la comida y comió completo.", senales: [] },
  { categoria: "Higiene", tipo: "accion", detalle: "La ayudé a bañarse.", senales: [] },
  { categoria: "Curación", tipo: "accion", detalle: "Le curé una herida pequeña en el pie.", senales: [] },
  { categoria: "Acompañamiento", tipo: "accion", detalle: "La acompañé toda la tarde.", senales: ["tranquila"] },
];
const OBSERVACIONES: Opcion[] = [
  { categoria: "Estado", tipo: "observacion", detalle: "Está tranquila y de buen ánimo.", senales: ["tranquila"] },
  { categoria: "Glucosa", tipo: "observacion", detalle: "Anoté su glucosa antes de comer.", senales: [] },
  { categoria: "Dolor", tipo: "observacion", detalle: "Se queja de dolor en la rodilla.", senales: ["dolor"] },
  { categoria: "Tomó poca agua", tipo: "observacion", detalle: "Casi no ha tomado agua hoy.", senales: ["poca_agua"] },
  { categoria: "Confusión", tipo: "observacion", detalle: "Está confundida, no reconoce dónde está.", senales: ["confusion"] },
  { categoria: "Caída", tipo: "observacion", detalle: "Se resbaló en el baño.", senales: ["caida"] },
];
const SENALES: { id: Senal; t: string }[] = [
  { id: "tranquila", t: "Tranquila" },
  { id: "cansada", t: "Cansada" },
  { id: "dolor", t: "Con dolor" },
  { id: "confusion", t: "Confundida" },
  { id: "poca_agua", t: "Tomó poca agua" },
  { id: "caida", t: "Se cayó" },
];

export default function RegistrarPage() {
  const { state, registrar, avisar } = useDemo();
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [modo, setModo] = useState<"accion" | "observacion">("accion");
  const [opcion, setOpcion] = useState<Opcion>(ACCIONES[0]);
  const [actorId, setActorId] = useState("m-rosa");
  const [detalle, setDetalle] = useState(ACCIONES[0].detalle);
  const [senales, setSenales] = useState<Senal[]>(ACCIONES[0].senales);
  const [foto, setFoto] = useState(false);
  const [confirmaId, setConfirmaId] = useState<string | undefined>("m-mariana");
  const nombre = state.recipient.nombre;

  const elegir = (o: Opcion) => {
    setOpcion(o);
    setDetalle(o.detalle);
    setSenales(o.senales);
  };
  const toggleSenal = (s: Senal) => setSenales((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  const otros = state.members.filter((m) => m.id !== actorId);
  const confirmaValido = confirmaId && confirmaId !== actorId ? confirmaId : undefined;
  const nivelVerif = confirmaValido ? "V2 · confirmado" : foto ? "V1 · con evidencia" : "V0 · autorreportado";

  const guardar = () => {
    const ev = registrar({
      actorId,
      tipo: opcion.tipo,
      categoria: opcion.categoria,
      competencia: opcion.competencia,
      detalle,
      senales,
      evidencia: foto ? "foto" : undefined,
      confirmadoPorId: confirmaValido,
    });
    avisar(ev.nivel === "verde" ? "Registro guardado en la bitácora" : `Registro guardado · semáforo ${ev.nivel}: se avisó a la promotora`);
    router.push("/app");
  };

  return (
    <div className="flex flex-1 flex-col gap-5 pt-4">
      <WizardHeader titulo="Registrar" paso={paso} pasos={PASOS} onVolver={paso > 1 ? () => setPaso(paso - 1) : undefined} />

      {paso === 1 && (
        <>
          <h1 className="text-[26px] font-semibold tracking-tight">¿Qué quieres anotar?</h1>
          <div className="flex gap-1 rounded-xl bg-chip p-1" role="group" aria-label="Tipo de registro">
            {(["accion", "observacion"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => {
                  setModo(m);
                  elegir(m === "accion" ? ACCIONES[0] : OBSERVACIONES[0]);
                }}
                className={`min-h-[42px] flex-1 rounded-lg text-sm ${modo === m ? "border border-line bg-white font-semibold" : "font-medium text-muted"}`}
              >
                {m === "accion" ? "Algo que hice" : `Cómo está ${nombre}`}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {(modo === "accion" ? ACCIONES : OBSERVACIONES).map((o) => (
              <button
                key={o.categoria}
                type="button"
                aria-pressed={opcion.categoria === o.categoria}
                onClick={() => elegir(o)}
                className={`flex min-h-[64px] flex-col items-start justify-center rounded-2xl border px-4 text-left transition ${
                  opcion.categoria === o.categoria ? "border-ink bg-white ring-1 ring-ink" : "border-line bg-white hover:bg-chip"
                }`}
              >
                <span className="text-[15px] font-semibold">{o.categoria}</span>
                {o.competencia && <span className="text-xs text-muted">suma a tu Pasaporte</span>}
              </button>
            ))}
          </div>
          <Link href="/app/whatsapp" className="flex items-center gap-3 rounded-2xl border border-dashed border-[#cfcfcb] p-4 text-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
            <span>
              <span className="font-semibold">¿Prefieres contarlo por voz?</span> <span className="text-muted">Mándalo por WhatsApp</span>
            </span>
          </Link>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white py-2 pl-4 pr-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted">{opcion.tipo === "accion" ? "Qué hiciste" : "Qué notaste"}</span>
              <span className="text-[15px] font-semibold">{opcion.categoria}</span>
            </div>
            <button type="button" onClick={() => setPaso(1)} className="min-h-[44px] px-3 text-[13px] font-medium text-muted">
              Cambiar
            </button>
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight">Cuéntanos los detalles</h1>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>¿Quién lo hizo?</legend>
            <div className="flex flex-wrap gap-2">
              {state.members.map((m) => (
                <Chip key={m.id} selected={actorId === m.id} onClick={() => setActorId(m.id)}>
                  {m.nombre}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="detalle" className={label}>Detalle</label>
            <textarea
              id="detalle"
              rows={2}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="resize-none rounded-xl border border-line bg-white p-3 text-[15px] leading-snug outline-none focus:border-ink"
            />
          </div>
          <TechTag k="estado-semaforo">
            <fieldset className="flex flex-col gap-2">
              <legend className={`${label} mb-2`}>¿Cómo estaba {nombre}?</legend>
              <div className="flex flex-wrap gap-2">
                {SENALES.map((s) => (
                  <Chip key={s.id} selected={senales.includes(s.id)} onClick={() => toggleSenal(s.id)}>
                    {s.t}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </TechTag>
          <TechTag k="evidencia">
            <button
              type="button"
              aria-pressed={foto}
              onClick={() => setFoto(!foto)}
              className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-sm font-medium ${
                foto ? "border-ink bg-white" : "border-dashed border-[#cfcfcb] text-ink-2"
              }`}
            >
              {foto ? "Foto agregada (simulada) · quitar" : "Agregar foto como evidencia"}
            </button>
          </TechTag>
        </>
      )}

      {paso === 3 && (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">¿Alguien más lo vio?</h1>
            <p className="text-[15px] leading-relaxed text-muted">
              Si otra persona de la familia lo confirma, cuenta para el Pasaporte y para los apoyos.
            </p>
          </div>
          <TechTag k="verificacion">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only-text">Quién lo confirma</legend>
              {otros.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 ${confirmaId === m.id ? "border-ink ring-1 ring-ink" : "border-line"}`}
                >
                  <Avatar nombre={m.nombre} tone={m.tono} size={34} />
                  <span className="flex flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{m.nombre}</span>
                    <span className="text-xs text-muted">Recibe un aviso para confirmarlo</span>
                  </span>
                  <input type="radio" name="confirma" checked={confirmaId === m.id} onChange={() => setConfirmaId(m.id)} className="h-5 w-5 accent-ink" />
                </label>
              ))}
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 ${!confirmaId ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">Nadie más lo vio</span>
                  <span className="text-xs text-muted">Queda en la bitácora como autorreporte</span>
                </span>
                <input type="radio" name="confirma" checked={!confirmaId} onChange={() => setConfirmaId(undefined)} className="h-5 w-5 accent-ink" />
              </label>
            </fieldset>
          </TechTag>
          <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
            <span className="text-muted">Nivel de verificación</span>
            <Pill tone={confirmaValido ? "green" : "outline"}>{nivelVerif}</Pill>
          </div>
        </>
      )}

      <BottomBar>
        {paso < 3 ? (
          <button type="button" className={btnPrimary} onClick={() => setPaso(paso + 1)}>
            {paso === 1 ? "Siguiente: detalles" : "Siguiente: quién lo vio"}
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={guardar}>
            Guardar registro
          </button>
        )}
        <span className="text-center text-xs text-muted">Lo que confirma alguien más cuenta para tu Pasaporte</span>
      </BottomBar>
    </div>
  );
}

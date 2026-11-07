"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/store";
import type { Day, Slot } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { Avatar, BottomBar, Chip, Pill, WizardHeader, btnPrimary, label } from "@/components/ui";

const PASOS = ["Horario", "Quién", "Confirmar"];
const DIAS: Day[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const SLOTS: { s: Slot; horario: string }[] = [
  { s: "Mañana", horario: "9:00 a 13:00" },
  { s: "Tarde", horario: "14:00 a 18:00" },
  { s: "Noche", horario: "19:00 a 23:00" },
];
const RADIOS = [1, 3, 5];
const NOMBRE_DIA: Record<Day, string> = { Lun: "Lunes", Mar: "Martes", Mié: "Miércoles", Jue: "Jueves", Vie: "Viernes", Sáb: "Sábado", Dom: "Domingo" };

// Posiciones del mapa ilustrativo (no es un mapa real)
const PUNTOS: Record<string, { x: number; y: number }> = {
  "h-chela": { x: 196, y: 72 },
  "h-lupita": { x: 214, y: 122 },
  "h-teresa": { x: 110, y: 120 },
  "h-beto": { x: 300, y: 36 },
};

export default function RelevoPage() {
  const { state, solicitarRelevo } = useDemo();
  const router = useRouter();
  const primerHueco = DIAS.flatMap((d) => SLOTS.filter(({ s }) => !state.shifts[d][s]).map(({ s }) => ({ d, s })))[0];
  const [paso, setPaso] = useState(1);
  const [dia, setDia] = useState<Day>(primerHueco?.d ?? "Sáb");
  const [slot, setSlot] = useState<Slot>(primerHueco?.s ?? "Mañana");
  const [radio, setRadio] = useState(3);
  const [helperId, setHelperId] = useState("h-lupita");

  const horario = SLOTS.find((x) => x.s === slot)!.horario;
  const candidatos = state.helpers.filter((h) => h.disponible && h.distanciaKm <= radio);
  const elegido = state.helpers.find((h) => h.id === helperId);
  const restante = state.bolsa.totalHoras - state.bolsa.usadasHoras;

  const confirmar = () => {
    solicitarRelevo(dia, slot, horario, helperId);
    router.push("/app/turnos");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 pt-4">
      <WizardHeader titulo="Pedir relevo" paso={paso} pasos={PASOS} volver="/app/turnos" onVolver={paso > 1 ? () => setPaso(paso - 1) : undefined} />

      {paso === 1 && (
        <>
          <h1 className="text-[26px] font-semibold tracking-tight">¿Cuándo necesitas descansar?</h1>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>Día</legend>
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => (
                <Chip key={d} selected={dia === d} onClick={() => setDia(d)}>
                  {d}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className={`${label} mb-2`}>Horario de 4 horas</legend>
            {SLOTS.map((x) => (
              <label key={x.s} className={`flex cursor-pointer items-center justify-between rounded-2xl border bg-white px-4 py-3 ${slot === x.s ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold">{x.s}</span>
                  <span className="text-xs text-muted">{x.horario}</span>
                </span>
                <input type="radio" name="slot" checked={slot === x.s} onChange={() => setSlot(x.s)} className="h-5 w-5 accent-ink" />
              </label>
            ))}
          </fieldset>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="flex items-center justify-between rounded-2xl border border-line bg-white py-2 pl-4 pr-2">
            <span className="text-[15px] font-semibold">
              {NOMBRE_DIA[dia]} · {horario}
            </span>
            <button type="button" onClick={() => setPaso(1)} className="min-h-[44px] px-3 text-[13px] font-medium text-muted">
              Cambiar
            </button>
          </div>
          <TechTag k="relevo-radio">
            <div className="relative h-[172px] overflow-hidden rounded-[18px] border border-line bg-[#ececea]">
              <svg width="100%" height="172" viewBox="0 0 358 172" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa ilustrativo con tu casa al centro y personas disponibles en el radio">
                <path d="M0 40H358M0 112H358M70 0V172M180 0V172M290 0V172M0 150L358 20" stroke="#fff" strokeWidth="7" fill="none" />
                <circle cx="180" cy="86" r={20 + radio * 18} fill="rgba(23,23,23,0.04)" stroke="#171717" strokeWidth="1.2" strokeDasharray="4 4" />
                <circle cx="180" cy="86" r="8" fill="#171717" stroke="#fff" strokeWidth="3" />
                {state.helpers.map((h) => {
                  const pt = PUNTOS[h.id] ?? { x: 40, y: 140 };
                  const dentro = h.distanciaKm <= radio;
                  return (
                    <circle key={h.id} cx={pt.x} cy={pt.y} r={h.id === helperId ? 7 : 5.5} fill={dentro ? (h.id === helperId ? "#171717" : "#6b6b6b") : "#b5b5b2"} stroke="#fff" strokeWidth="2" />
                  );
                })}
              </svg>
              <span className="glass absolute left-2.5 top-2.5 rounded-full px-2.5 py-1.5 text-xs font-semibold">
                {candidatos.length} disponibles en {radio} km
              </span>
              <div className="glass absolute bottom-2.5 right-2.5 flex gap-0.5 rounded-full p-[3px]" role="group" aria-label="Radio de búsqueda">
                {RADIOS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={radio === r}
                    onClick={() => setRadio(r)}
                    className={`min-h-[36px] rounded-full px-3 text-[13px] ${radio === r ? "bg-ink font-semibold text-white" : "font-medium text-ink-2"}`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </TechTag>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only-text">Elige quién te releva</legend>
            {candidatos.map((h, i) => (
              <label key={h.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 ${helperId === h.id ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                <Avatar nombre={h.nombre} tone={i % 2 ? "mid" : "dark"} size={36} />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">
                    {h.nombre} <span className="font-normal text-muted">· {h.descripcion}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {h.nivel === "C3" ? "Certificada C3" : "Práctica validada C2"} · {h.distanciaKm} km · {h.habilidades.join(", ").toLowerCase()}
                  </span>
                </span>
                <input type="radio" name="helper" checked={helperId === h.id} onChange={() => setHelperId(h.id)} className="h-5 w-5 accent-ink" />
              </label>
            ))}
            {candidatos.length === 0 && <p className="text-sm text-muted">Nadie disponible en este radio. Amplía la búsqueda.</p>}
          </fieldset>
        </>
      )}

      {paso === 3 && elegido && (
        <>
          <h1 className="text-[26px] font-semibold tracking-tight">Confirma tu relevo</h1>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex items-center gap-3 border-b border-line-soft p-4">
              <Avatar nombre={elegido.nombre} tone="dark" size={44} />
              <div className="flex flex-col">
                <span className="text-base font-semibold">{elegido.nombre}</span>
                <span className="text-[13px] text-muted">
                  {elegido.descripcion} · {elegido.nivel === "C3" ? "certificada" : "práctica validada"} · {elegido.distanciaKm} km
                </span>
              </div>
            </div>
            <div className="flex justify-between p-4 text-sm">
              <span className="text-muted">Cuándo</span>
              <span className="font-semibold">
                {NOMBRE_DIA[dia]} · {horario}
              </span>
            </div>
          </div>
          <TechTag k="pagador">
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Lo paga: {state.bolsa.pagador}</span>
                <Pill tone="green">Tú no pagas</Pill>
              </div>
              <span className="text-[13px] text-muted">Bolsa del piloto (ejemplo): quedan {restante} de {state.bolsa.totalHoras} horas.</span>
            </div>
          </TechTag>
        </>
      )}

      <BottomBar>
        {paso < 3 ? (
          <button type="button" className={btnPrimary} onClick={() => setPaso(paso + 1)} disabled={paso === 2 && !candidatos.some((h) => h.id === helperId)}>
            {paso === 1 ? "Siguiente: quién" : "Siguiente: confirmar"}
          </button>
        ) : (
          <button type="button" className={btnPrimary} onClick={confirmar}>
            Pedir relevo
          </button>
        )}
        <span className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
          </svg>
          Lo paga {state.bolsa.pagador}, no tu familia
        </span>
      </BottomBar>
    </div>
  );
}

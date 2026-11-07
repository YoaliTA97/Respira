"use client";

import { nombreCondicion } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import { Pill } from "./ui";

// Ficha de emergencia: lo indispensable para urgencias, incluidas las decisiones de la persona
// cuidada (clínica, acompañante y voluntad anticipada) y lo que no quiere.
export function FichaEmergencia({ compacta = false }: { compacta?: boolean }) {
  const { db, familia, paciente, integrantes } = useData();
  if (!familia || !paciente) return null;
  const meds = db.medicamentos.filter((m) => m.familiaId === familia.id);
  const dec = paciente.voz?.decisiones;
  const principales = integrantes.filter((i) => i.membresia.principal);
  const fila = (t: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-2 border-b border-line-soft py-1.5 text-sm last:border-0">
      <span className="text-muted">{t}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col rounded-2xl border border-red-line bg-white p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-red-ink">Ficha de emergencia</span>
        <span className="text-xs text-muted">{paciente.nombre}, {paciente.edad} años</span>
      </div>
      {fila("Condiciones", paciente.condiciones.map(nombreCondicion).join(", ") || "—")}
      {fila("Alergias", (paciente.alergias ?? []).length ? <span className="text-red-ink">{(paciente.alergias ?? []).join(", ")}</span> : "Ninguna registrada")}
      {!compacta && fila("Medicamentos", meds.map((m) => `${m.nombre} (${m.horarios.join(", ")})`).join(" · ") || "—")}
      {fila("Afiliación", paciente.servicios ? `${paciente.servicios.afiliacion.join(", ") || "—"}${paciente.servicios.unidad ? ` · ${paciente.servicios.unidad}` : ""}` : "Sin registrar")}
      {fila("Quiere ir a", dec?.clinica || "Sin registrar")}
      {fila("La acompaña", dec?.acompanante || "Sin registrar")}
      {fila("Voluntad anticipada", dec?.voluntadAnticipada ? <Pill tono="dark">Sí, registrada{dec.documento ? " · documento adjunto" : ""}</Pill> : "No registrada")}
      {!compacta && (paciente.voz?.noQuiero ?? []).length > 0 && fila("No quiere", paciente.voz!.noQuiero.join(" · "))}
      {fila("Avisar a", principales.map((i) => `${i.usuario.nombre.split(" ")[0]} ${i.usuario.telefono}`).join(" · ") || "—")}
    </div>
  );
}

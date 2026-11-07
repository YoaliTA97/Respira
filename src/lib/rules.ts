import type { CareEvent, DemoState, Member, Nivel, Senal, Skill } from "./types";
import { SKILL_C2_PRACTICAS } from "./seed";

// Reglas deterministas de alarma. Corren ANTES de cualquier modelo de IA:
// el semáforo rojo nunca depende del criterio de un LLM.
export function evaluarSenales(senales: Senal[]): { nivel: Nivel; motivo: string; reglas: string[] } {
  const s = new Set(senales);
  if (s.has("confusion") && s.has("poca_agua")) {
    return {
      nivel: "rojo",
      motivo: "La confusión que aparece de repente y tomar poca agua pueden ser señal de deshidratación u otra complicación. Esto no es un diagnóstico.",
      reglas: ["Confusión repentina", "Poca agua"],
    };
  }
  if (s.has("confusion")) {
    return {
      nivel: "rojo",
      motivo: "La confusión que aparece de repente necesita revisión hoy. Esto no es un diagnóstico.",
      reglas: ["Confusión repentina"],
    };
  }
  if (s.has("caida")) {
    return {
      nivel: "rojo",
      motivo: "Una caída en una persona mayor necesita revisión aunque parezca leve.",
      reglas: ["Caída reportada"],
    };
  }
  if (s.has("poca_agua") || s.has("dolor")) {
    return {
      nivel: "amarillo",
      motivo: s.has("dolor")
        ? "El dolor conviene vigilarlo y registrarlo otra vez más tarde."
        : "Tomar poca agua puede llevar a deshidratación. Ofrécele líquidos y vuelve a registrar más tarde.",
      reglas: s.has("dolor") ? ["Dolor reportado"] : ["Poca agua"],
    };
  }
  return { nivel: "verde", motivo: "Sin señales de alarma.", reglas: [] };
}

export function nivelSkill(skill: Skill): "C1" | "C2" | "C3" | "C0" {
  if (skill.certificada) return "C3";
  if (skill.practicasValidadas >= SKILL_C2_PRACTICAS) return "C2";
  if (skill.microcurso) return "C1";
  return "C0";
}

export function horasDe(events: CareEvent[], filtro: (e: CareEvent) => boolean) {
  return events.filter(filtro).reduce((acc, e) => acc + e.duracionMin, 0) / 60;
}

const esVerificado = (e: CareEvent) => e.verificacion === "V2" || e.verificacion === "V3";

// Proyecciones que en el MVP serían vistas SQL sobre la bitácora (care_event)
export function proyecciones(state: DemoState) {
  const delCaso = state.events.filter((e) => e.casoId === state.casoId);
  const deRosa = delCaso.filter((e) => e.actorId === "m-rosa");
  const horasRegistradas = state.base.horasRegistradas + horasDe(deRosa, () => true);
  const horasVerificadas = state.base.horasVerificadas + horasDe(deRosa, esVerificado);
  const relevosRosa = state.relevos.filter((r) => r.casoId === state.casoId && r.estado !== "solicitado");
  const respiroHoras = state.base.respiroHoras + relevosRosa.length * 4;
  const skillsC2 = state.skills.filter((s) => ["C2", "C3"].includes(nivelSkill(s))).length;
  const elegibleApoyo = horasVerificadas >= 250 && skillsC2 >= 2;

  const cargaSemana = state.members.map((m: Member) => ({
    member: m,
    horas: m.horasBaseSemana + horasDe(delCaso, (e) => e.actorId === m.id),
  }));
  const totalSemana = cargaSemana.reduce((a, c) => a + c.horas, 0) || 1;
  const horasMujeres = cargaSemana.filter((c) => c.member.genero === "mujer").reduce((a, c) => a + c.horas, 0);

  const alertaCaso = [...state.alerts].reverse().find((a) => a.casoId === state.casoId && a.nivel !== "verde");
  const estadoHoy: { nivel: Nivel; titulo: string; detalle: string } = alertaCaso
    ? {
        nivel: alertaCaso.estado === "reclasificada" ? "amarillo" : alertaCaso.nivel,
        titulo: alertaCaso.resumen,
        detalle:
          alertaCaso.estado === "confirmada"
            ? `La promotora confirmó la alerta. Acudir a: ${alertaCaso.destino ?? "servicio indicado"}.`
            : alertaCaso.estado === "reclasificada"
              ? "La promotora la revisó y la bajó a vigilar."
              : "Una promotora de salud está revisando la alerta.",
      }
    : { nivel: "verde", titulo: "Estable", detalle: "Sin señales de alarma en los registros de hoy." };

  return {
    horasRegistradas,
    horasVerificadas,
    respiroHoras,
    skillsC2,
    elegibleApoyo,
    cargaSemana,
    totalSemana,
    pctMujeres: Math.round((horasMujeres / totalSemana) * 100),
    estadoHoy,
    alertaCaso,
  };
}

export const NIVEL_UI: Record<Nivel, { etiqueta: string; ink: string; bg: string; line: string }> = {
  rojo: { etiqueta: "Atender hoy", ink: "text-red-ink", bg: "bg-red-bg", line: "border-red-line" },
  amarillo: { etiqueta: "Vigilar", ink: "text-amber-ink", bg: "bg-amber-bg", line: "border-[#f1dfb8]" },
  verde: { etiqueta: "Estable", ink: "text-green-ink", bg: "bg-green-bg", line: "border-line" },
};

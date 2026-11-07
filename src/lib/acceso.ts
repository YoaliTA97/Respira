import { ROL_TEXTO, type Membresia, type RolFamilia, type Usuario } from "./types";

// Qué secciones ve cada persona. Depende de dos cosas:
// 1) los roles que eligió en su perfil ("Roles que puedes desempeñar");
// 2) su rol en el espacio familiar activo (coordinación, cuidado, apoyo, avisos o persona mayor).
// En el MVP las mismas reglas viven en las políticas por membresía de Supabase.

export type Seccion =
  | "inicio" | "perfil" | "cv" | "red" | "capacitacion"
  | "familia" | "integrantes" | "chat" | "valoracion" | "seguimiento" | "relevos" | "paciente" | "equipo" | "alertas" | "voz" | "gastos";

export const SECCION_DE_RUTA: Record<string, Seccion> = {
  "/inicio": "inicio", "/perfil": "perfil", "/cv": "cv", "/pasaporte": "cv", "/red": "red", "/capacitacion": "capacitacion",
  "/familia": "familia", "/integrantes": "integrantes", "/chat": "chat", "/valoracion": "valoracion", "/seguimiento": "seguimiento",
  "/relevos": "relevos", "/paciente": "paciente", "/equipo": "equipo", "/alertas": "alertas", "/mi-voz": "voz", "/gastos": "gastos",
};

const TODOS: RolFamilia[] = ["coordinacion", "cuidado", "apoyo", "avisos", "persona"];
const QUIENES_CUIDAN: RolFamilia[] = ["coordinacion", "cuidado", "apoyo"];
export const ROLES_DEL_ESPACIO: Record<Exclude<Seccion, "inicio" | "perfil" | "cv" | "red" | "capacitacion">, RolFamilia[]> = {
  familia: TODOS,
  chat: TODOS,
  alertas: TODOS,
  voz: TODOS,
  integrantes: QUIENES_CUIDAN,
  valoracion: QUIENES_CUIDAN,
  relevos: QUIENES_CUIDAN,
  equipo: QUIENES_CUIDAN,
  seguimiento: [...QUIENES_CUIDAN, "avisos"],
  paciente: [...QUIENES_CUIDAN, "avisos"],
  gastos: [...QUIENES_CUIDAN, "avisos"],
};

const ROLES_DE_CUIDADO = ["Cuidar a mi familiar", "Coordinar a la familia", "Hacer relevos en la red", "Acompañamiento"];

export const ayudaEnRed = (u: Usuario) => u.ofreceAyuda.activo || u.roles.includes("Hacer relevos en la red");

export function acceso(seccion: Seccion, u: Usuario, m: Membresia | null): { ok: boolean; motivo: string } {
  const rol = m?.rol;
  const si = { ok: true, motivo: "" };
  const no = (motivo: string) => ({ ok: false, motivo });
  const cuida = u.roles.some((r) => ROLES_DE_CUIDADO.includes(r)) || (!!rol && QUIENES_CUIDAN.includes(rol));

  if (seccion === "inicio" || seccion === "perfil") return si;
  if (seccion === "cv") return rol === "persona" ? no("El CV de cuidado es para quienes cuidan. Tus aportes están en Mi voz.") : si;
  if (seccion === "capacitacion") {
    if (rol === "persona") return no("La capacitación es para quienes cuidan. Tus metas de autonomía están en Mi voz.");
    return cuida ? si : no("Agrega en tu perfil un rol de cuidado (cuidar a tu familiar, hacer relevos o acompañamiento) para ver la capacitación.");
  }
  if (seccion === "red") {
    if (ayudaEnRed(u) || rol === "coordinacion" || rol === "cuidado") return si;
    return no("La red de cuidado se activa cuando eliges «Hacer relevos en la red» en tu perfil, o cuando coordinas o cuidas en un espacio familiar.");
  }
  if (!m || !rol) return no("Necesitas pertenecer a un espacio familiar.");
  return ROLES_DEL_ESPACIO[seccion].includes(rol) ? si : no(`Con el rol «${ROL_TEXTO[rol].t}» esta sección no se usa. Si la necesitas, pide a quien coordina que cambie tu rol.`);
}

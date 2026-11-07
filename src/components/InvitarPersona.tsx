"use client";

import { useState } from "react";
import { CODIGO_DEMO, useData, type InvitacionNueva } from "@/lib/db";
import { PARENTESCOS, telefonoLimpio } from "@/lib/catalogos";
import { certificadas, conocidos, habilidades, perfilVisible } from "@/lib/calculos";
import { ROL_TEXTO, type Id, type RolFamilia } from "@/lib/types";
import { enlaceUnion } from "./QrFamilia";
import { Avatar, Pill, Segmentado, btnPrimary, btnSecondary, input, label } from "./ui";

const ROLES: RolFamilia[] = ["cuidado", "apoyo", "avisos", "coordinacion"];
const VACIA: InvitacionNueva = { nombre: "", telefono: "", parentesco: "", rol: "cuidado", principal: false, genero: "mujer" };

// Alta de una persona en un espacio familiar. Se empieza por el teléfono: si ya tiene perfil en
// Respira se vincula ese perfil (no se vuelve a capturar nada); si no, se crea uno provisional
// que la persona completa al entrar. En los dos casos la persona acepta la invitación.
export function InvitarPersona({
  excluirIds = [],
  excluirTelefonos = [],
  onAgregar,
  textoBoton = "Enviar invitación",
  principalPorDefecto = false,
  simulacion = false,
}: {
  excluirIds?: Id[];
  excluirTelefonos?: string[];
  onAgregar: (i: InvitacionNueva) => void;
  textoBoton?: string;
  principalPorDefecto?: boolean;
  simulacion?: boolean; // muestra el mensaje que recibiría la persona y cómo abrirlo en la demo
}) {
  const { db, usuario, familia, paciente } = useData();
  const [inv, setInv] = useState<InvitacionNueva>({ ...VACIA, principal: principalPorDefecto });
  const [enviada, setEnviada] = useState<{ nombre: string; telefono: string; modo: "real" | "simulado" } | null>(null);
  if (!usuario) return null;

  const tel = inv.telefono;
  const listo = tel.length === 10;
  const existente = listo ? db.usuarios.find((u) => u.telefono === tel) : undefined;
  const yaEsta = listo && (tel === usuario.telefono || excluirTelefonos.includes(tel) || (!!existente && excluirIds.includes(existente.id)));
  const sugeridos = conocidos(db, usuario.id, excluirIds).filter((c) => !excluirTelefonos.includes(c.usuario.telefono));
  const visible = existente ? perfilVisible(db, usuario.id, existente) : false;
  const valido = listo && !yaEsta && (existente ? true : inv.nombre.trim().length > 1);

  const mensaje = (nombre: string, id?: string) =>
    `Hola ${nombre.split(" ")[0]}: ${usuario.nombre.split(" ")[0]} te invitó al espacio ${familia?.nombre ?? "familiar"} en Respira para coordinar el cuidado de ${paciente?.nombre ?? "su familiar"}. Entra aquí: ${familia?.codigo ? enlaceUnion(familia.codigo, id) : ""} · Código de acceso de prueba: ${CODIGO_DEMO}`;
  const agregar = async () => {
    const nombre = existente ? existente.nombre : inv.nombre.trim();
    onAgregar({ ...inv, nombre, genero: existente ? existente.genero : inv.genero, parentesco: inv.parentesco.trim() || "Familiar" });
    setInv({ ...VACIA, principal: principalPorDefecto });
    if (!simulacion) return;
    setEnviada({ nombre, telefono: tel, modo: "simulado" });
    try {
      const r = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefonos: [tel], texto: mensaje(nombre, existente?.id) }) });
      const modo = ((await r.json()) as { modo: "real" | "simulado" }).modo;
      setEnviada({ nombre, telefono: tel, modo });
    } catch {
      /* queda simulado */
    }
  };
  const invitado = enviada ? db.usuarios.find((u) => u.telefono === enviada.telefono) : undefined;

  return (
    <div className="flex flex-col gap-4">
      {enviada && familia?.codigo && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-primario/30 bg-realce/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">Así le llega a {enviada.nombre.split(" ")[0]} por WhatsApp</span>
            <Pill tono={enviada.modo === "real" ? "green" : "outline"}>{enviada.modo === "real" ? "Enviado" : "Simulado"}</Pill>
          </div>
          <p className="rounded-xl rounded-tl-md bg-white p-3 text-sm leading-relaxed">{mensaje(enviada.nombre, invitado?.id)}</p>
          <div className="flex flex-wrap gap-2">
            <a href={enlaceUnion(familia.codigo, invitado?.id)} target="_blank" rel="noopener" className={btnPrimary}>Abrir como {enviada.nombre.split(" ")[0]} en otra pestaña</a>
            <button type="button" className={btnSecondary} onClick={() => navigator.clipboard?.writeText(mensaje(enviada.nombre, invitado?.id))}>Copiar mensaje</button>
            <button type="button" className="text-sm text-muted underline" onClick={() => setEnviada(null)}>Cerrar</button>
          </div>
          <p className="text-xs text-muted">
            En la simulación la invitación queda aceptada al instante y ya aparece en el espacio. Para entrar como {enviada.nombre.split(" ")[0]}: abre la otra pestaña, o en /login usa su teléfono y el código {CODIGO_DEMO}.
          </p>
        </div>
      )}
      {sugeridos.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={label}>Personas que ya tienen perfil y conoces</span>
          <div className="flex flex-wrap gap-2">
            {sugeridos.map(({ usuario: u, contexto }) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setInv({ ...inv, telefono: u.telefono, nombre: "" })}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-left text-sm ${tel === u.telefono ? "border-primario bg-realce" : "border-line bg-white hover:bg-chip"}`}
              >
                <Avatar nombre={u.nombre} tono={u.tono} size={30} />
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{u.nombre}</span>
                  <span className="text-xs text-muted">{contexto}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between gap-2">
            <label htmlFor="inv-tel" className={label}>Teléfono (WhatsApp)</label>
            <button type="button" className="text-xs font-semibold text-primario underline" onClick={() => setInv({ ...inv, telefono: "5531000001", nombre: "Elena Ramírez", parentesco: "Sobrina", genero: "mujer" })}>Llenar ejemplo</button>
          </span>
          <input id="inv-tel" inputMode="tel" placeholder="10 dígitos" className={input} value={tel} onChange={(e) => setInv({ ...inv, telefono: telefonoLimpio(e.target.value) })} />
        </div>

        <div className="flex min-h-[72px] flex-col justify-end">
          {!listo && <p className="pb-2.5 text-sm text-muted">Escribe su teléfono: si ya usa Respira, se vincula su perfil y no hay que capturarlo.</p>}
          {listo && yaEsta && <p className="pb-2.5 text-sm font-medium text-amber-ink">{tel === usuario.telefono ? "Ese es tu teléfono." : "Esa persona ya está en este espacio."}</p>}
          {listo && !yaEsta && existente && (
            <div className="flex items-start gap-3 rounded-2xl border border-primario/30 bg-realce/60 p-3">
              <Avatar nombre={existente.nombre} tono={existente.tono} size={40} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold">{existente.nombre}</span>
                  <Pill tono="outline">Ya tiene perfil en Respira</Pill>
                </span>
                <span className="text-muted">{existente.alcaldia || "Perfil provisional (aún no entra)"}{existente.alcaldia ? " · se vincula su perfil con sus roles y disponibilidad" : ""}</span>
                {visible && (
                  <span className="flex flex-wrap gap-1">
                    {certificadas(db, existente.id).map((c) => <Pill key={c.id} tono="dark">{c.nombre}</Pill>)}
                    {habilidades(db, existente.id).map((h) => <Pill key={h.tutorial.id}>{h.tutorial.habilidad}</Pill>)}
                    {(existente.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}
                  </span>
                )}
              </div>
            </div>
          )}
          {listo && !yaEsta && !existente && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inv-nom" className={label}>Nombre (aún no tiene perfil)</label>
                <input id="inv-nom" className={input} value={inv.nombre} onChange={(e) => setInv({ ...inv, nombre: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={label}>Género</span>
                <Segmentado etiqueta="Género" valor={inv.genero} onChange={(v) => setInv({ ...inv, genero: v })} opciones={[{ v: "mujer", t: "Mujer" }, { v: "hombre", t: "Hombre" }, { v: "otro", t: "Otro" }]} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 md:items-end">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-par" className={label}>Parentesco o relación</label>
          <input id="inv-par" list="inv-parentescos" className={input} placeholder="Hija, vecina, cuidadora…" value={inv.parentesco} onChange={(e) => setInv({ ...inv, parentesco: e.target.value })} />
          <datalist id="inv-parentescos">{PARENTESCOS.map((p) => <option key={p} value={p} />)}</datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inv-rol" className={label}>Rol en este espacio</label>
          <select id="inv-rol" className={input} value={inv.rol} onChange={(e) => setInv({ ...inv, rol: e.target.value as RolFamilia })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROL_TEXTO[r].t}</option>)}
          </select>
        </div>
        <label className="flex min-h-[44px] items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-primario" checked={inv.principal} onChange={(e) => setInv({ ...inv, principal: e.target.checked })} />
          Principal (recibe alertas por WhatsApp)
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={existente ? btnPrimary : btnSecondary} disabled={!valido} onClick={agregar}>
          {existente && !yaEsta ? `Vincular a ${existente.nombre.split(" ")[0]}` : textoBoton}
        </button>
        <span className="text-xs text-muted">Simulación: la invitación se acepta al instante. Con backend, la persona la acepta desde su cuenta.</span>
      </div>
    </div>
  );
}

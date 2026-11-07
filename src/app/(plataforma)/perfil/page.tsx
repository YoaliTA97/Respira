"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/db";
import { certificadas, habilidades, horasCuidado, horasDisponibles } from "@/lib/calculos";
import { ROLES_INTERES, SUGERENCIAS_EXPERIENCIA, SUGERENCIAS_ROL } from "@/lib/catalogos";
import type { Usuario } from "@/lib/types";
import { DisponibilidadEditor } from "@/components/Disponibilidad";
import { TechTag } from "@/components/TechTag";
import { ZaritModal } from "@/components/Zarit";
import { Avatar, Encabezado, Etiquetas, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const MODALIDADES: Usuario["ofreceAyuda"]["modalidades"] = ["intercambio de horas", "pago", "programa de apoyo"];

export default function Perfil() {
  const { db, ahora, usuario, actualizarPerfil } = useData();
  const [datos, setDatos] = useState(() => ({ nombre: usuario?.nombre ?? "", alcaldia: usuario?.alcaldia ?? "", bio: usuario?.bio ?? "" }));
  const [roles, setRoles] = useState<string[]>(usuario?.roles ?? []);
  const [experiencia, setExperiencia] = useState<string[]>(usuario?.experiencia ?? []);
  const [disp, setDisp] = useState(usuario?.disponibilidad ?? {});
  const [ayuda, setAyuda] = useState(usuario?.ofreceAyuda);
  const [zarit, setZarit] = useState(false);
  if (!usuario || !ayuda) return null;

  const habs = habilidades(db, usuario.id);
  const certs = certificadas(db, usuario.id);
  const horas = horasCuidado(db, usuario.id, ahora);
  const toggleMod = (m: Usuario["ofreceAyuda"]["modalidades"][number]) =>
    setAyuda({ ...ayuda, modalidades: ayuda.modalidades.includes(m) ? ayuda.modalidades.filter((x) => x !== m) : [...ayuda.modalidades, m] });

  return (
    <>
      <Encabezado
        sub="Tu perfil es tuyo: lo llevas a cualquier espacio familiar y a la red"
        titulo="Mi perfil"
        acciones={
          <>
            <button type="button" className={btnSecondary} onClick={() => setZarit(true)}>¿Cómo estás tú? (Zarit)</button>
            <Link href="/cv" className={btnPrimary}>Ver mi CV de cuidado</Link>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <TechTag k="perfil" className="lg:col-span-2">
          <Tarjeta titulo="Datos">
            <div className="flex items-center gap-3">
              <Avatar nombre={usuario.nombre} tono={usuario.tono} size={52} />
              <div className="text-sm text-muted">
                <p>{usuario.telefono}</p>
                <p>{horas} h de cuidado registradas · saldo de horas {usuario.saldoHoras >= 0 ? "+" : ""}{usuario.saldoHoras}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pn" className={label}>Nombre</label>
                <input id="pn" className={input} value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pa" className={label}>Alcaldía o municipio</label>
                <input id="pa" className={input} value={datos.alcaldia} onChange={(e) => setDatos({ ...datos, alcaldia: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pb" className={label}>Sobre ti (lo ven las familias de la red)</label>
              <textarea id="pb" rows={2} className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario" value={datos.bio} onChange={(e) => setDatos({ ...datos, bio: e.target.value })} />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className={`${label} mb-2`}>Roles que puedes desempeñar</legend>
              <Etiquetas etiqueta="Roles que puedes desempeñar" valor={roles} onChange={setRoles} opciones={ROLES_INTERES} sugerencias={SUGERENCIAS_ROL} placeholder="¿Otro? Ej. llevar a consultas" />
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className={`${label} mb-2`}>Experiencia que ya tienes</legend>
              <Etiquetas etiqueta="Experiencia que ya tienes" valor={experiencia} onChange={setExperiencia} sugerencias={SUGERENCIAS_EXPERIENCIA} placeholder="Ej. aplicar insulina, primeros auxilios" />
              <p className="text-xs text-muted">Se muestra como declarada. Lo que completas en Capacitación aparece como habilidad verificada.</p>
            </fieldset>
            <button type="button" className={`${btnPrimary} self-start`} onClick={() => actualizarPerfil({ ...datos, roles, experiencia })}>Guardar datos</button>
          </Tarjeta>
        </TechTag>

        <TechTag k="certificaciones">
          <Tarjeta titulo="Habilidades y certificaciones" accion={<Link href="/capacitacion" className="text-sm font-medium text-muted">Capacitación</Link>}>
            {habs.length === 0 && <Vacio>Aún no tienes habilidades verificadas.</Vacio>}
            <ul className="flex flex-col gap-2">
              {habs.map(({ tutorial, practicas }) => (
                <li key={tutorial.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{tutorial.habilidad}</span>
                  <span className="text-xs text-muted">{practicas} prácticas</span>
                </li>
              ))}
            </ul>
            {(usuario.experiencia ?? []).length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
                <span className="text-xs text-muted">Declaradas</span>
                <div className="flex flex-wrap gap-1.5">{(usuario.experiencia ?? []).map((x) => <Pill key={x} tono="outline">{x}</Pill>)}</div>
              </div>
            )}
            {certs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
                {certs.map((c) => <Pill key={c.id} tono="dark">{c.nombre}</Pill>)}
              </div>
            )}
          </Tarjeta>
        </TechTag>

        <TechTag k="disponibilidad" className="lg:col-span-2">
          <Tarjeta titulo={`Disponibilidad · ${horasDisponibles(disp)} h por semana`}>
            <p className="text-sm text-muted">Se usa para proponerte relevos en tus espacios familiares y, si lo activas, en la red.</p>
            <DisponibilidadEditor valor={disp} onChange={setDisp} />
            <button type="button" className={`${btnPrimary} self-start`} onClick={() => actualizarPerfil({ disponibilidad: disp })}>Guardar disponibilidad</button>
          </Tarjeta>
        </TechTag>

        <TechTag k="red-perfiles">
          <Tarjeta titulo="Ayudar a otras familias">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Aparecer en la red de cuidado</span>
              <input type="checkbox" role="switch" className="h-5 w-9 accent-primario" checked={ayuda.activo} onChange={(e) => setAyuda({ ...ayuda, activo: e.target.checked })} />
            </label>
            <p className="text-xs leading-relaxed text-muted">Las familias ven tu nombre, habilidades, certificaciones, disponibilidad y distancia aproximada. Nunca ven tu dirección ni entras a su espacio familiar.</p>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="radio" className={label}>Radio en el que puedes ayudar: {ayuda.radioKm} km</label>
              <input id="radio" type="range" min={1} max={15} value={ayuda.radioKm} onChange={(e) => setAyuda({ ...ayuda, radioKm: Number(e.target.value) })} className="accent-primario" />
            </div>
            <fieldset className="flex flex-col gap-1.5">
              <legend className={`${label} mb-1.5`}>Cómo te pueden compensar</legend>
              {MODALIDADES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-primario" checked={ayuda.modalidades.includes(m)} onChange={() => toggleMod(m)} />
                  {m}
                </label>
              ))}
            </fieldset>
            {ayuda.modalidades.includes("pago") && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tarifa" className={label}>Tarifa por hora (MXN)</label>
                <input id="tarifa" type="number" min={0} className={input} value={ayuda.tarifaHora} onChange={(e) => setAyuda({ ...ayuda, tarifaHora: Number(e.target.value) })} />
              </div>
            )}
            <button type="button" className={`${btnPrimary} self-start`} onClick={() => actualizarPerfil({ ofreceAyuda: ayuda })}>Guardar</button>
          </Tarjeta>
        </TechTag>
      </div>
      {zarit && <ZaritModal onCerrar={() => setZarit(false)} />}
    </>
  );
}

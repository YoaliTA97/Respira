"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/db";
import { certificadas, estadoCertificaciones, habilidades, horasCuidado, horasDisponibles, horasPorSemana } from "@/lib/calculos";
import { Columnas, Medidor } from "@/components/Graficas";
import { TUTORIALES } from "@/lib/catalogos";
import { AVISOS, ROLES_INTERES, SUGERENCIAS_EXPERIENCIA, SUGERENCIAS_ROL } from "@/lib/catalogos";
import type { Usuario } from "@/lib/types";
import { DisponibilidadEditor } from "@/components/Disponibilidad";
import { problemaClave } from "@/lib/clave";
import { TechTag } from "@/components/TechTag";
import { ZaritModal } from "@/components/Zarit";
import { Avatar, Encabezado, Etiquetas, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const MODALIDADES: Usuario["ofreceAyuda"]["modalidades"] = ["intercambio de horas", "pago", "programa de apoyo"];

export default function Perfil() {
  const { db, ahora, usuario, actualizarPerfil, cambiarClave } = useData();
  const [claves, setClaves] = useState({ actual: "", nueva: "", repetir: "", error: "" });
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
      <TechTag k="trayectoria" className="mb-4">
        <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">Mi progreso: horas de cuidado por semana</span>
            <Columnas titulo="Mis horas de cuidado por semana" unidad=" h" datos={horasPorSemana(db, usuario.id, ahora, 4)} />
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {estadoCertificaciones(db, usuario.id, ahora).slice(0, 1).map((c) => (
              <div key={c.def.id} className="flex flex-col gap-1.5">
                <span className="flex justify-between gap-2"><span className="font-semibold">Horas para {c.def.nombre.split(" · ")[0]}</span><span className="text-muted">{Math.min(c.horas, c.def.horasMinimas)} de {c.def.horasMinimas} h</span></span>
                <Medidor valor={Math.min(c.horas, c.def.horasMinimas)} max={c.def.horasMinimas} titulo="Horas para la certificación" />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <span className="flex justify-between gap-2"><span className="font-semibold">Habilidades verificadas</span><span className="text-muted">{habs.length} de {TUTORIALES.length}</span></span>
              <Medidor valor={habs.length} max={TUTORIALES.length} titulo="Habilidades verificadas" />
            </div>
            <div className="flex items-baseline justify-between gap-2 rounded-xl bg-canvas p-3">
              <span>Banco de tiempo</span>
              <span className="text-lg font-semibold">{usuario.saldoHoras >= 0 ? "+" : ""}{usuario.saldoHoras} h</span>
            </div>
            {db.banco.filter((b) => b.deUsuarioId === usuario.id || b.paraUsuarioId === usuario.id).slice(0, 3).map((b) => (
              <span key={b.id} className="text-xs text-muted">{b.fecha.slice(5)} · {b.deUsuarioId === usuario.id ? `Diste ${b.horas} h` : `Recibiste ${b.horas} h`}: {b.concepto}</span>
            ))}
          </div>
        </section>
      </TechTag>

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

        <TechTag k="acceso">
          <div id="seguridad" className="scroll-mt-20" />
          <Tarjeta titulo="Seguridad de tu cuenta">
            <p className="text-sm text-muted">Entras con tu teléfono y contraseña. Tras 5 intentos fallidos la cuenta se bloquea unos minutos.</p>
            <div className="grid gap-2">
              <input aria-label="Contraseña actual" type="password" autoComplete="current-password" placeholder="Contraseña actual" className={input} value={claves.actual} onChange={(e) => setClaves({ ...claves, actual: e.target.value })} />
              <input aria-label="Nueva contraseña" type="password" autoComplete="new-password" placeholder="Nueva contraseña" className={input} value={claves.nueva} onChange={(e) => setClaves({ ...claves, nueva: e.target.value })} />
              <input aria-label="Repite la nueva contraseña" type="password" autoComplete="new-password" placeholder="Repítela" className={input} value={claves.repetir} onChange={(e) => setClaves({ ...claves, repetir: e.target.value })} />
            </div>
            {claves.error && <p role="alert" className="text-sm text-red-ink">{claves.error}</p>}
            <button
              type="button"
              className={`${btnPrimary} self-start`}
              disabled={!claves.nueva}
              onClick={async () => {
                const p = problemaClave(claves.nueva);
                if (p) return setClaves({ ...claves, error: p });
                if (claves.nueva !== claves.repetir) return setClaves({ ...claves, error: "Las contraseñas no coinciden." });
                const ok = await cambiarClave(claves.actual, claves.nueva);
                setClaves(ok ? { actual: "", nueva: "", repetir: "", error: "" } : { ...claves, error: "La contraseña actual no es correcta." });
              }}
            >
              Cambiar contraseña
            </button>
          </Tarjeta>
        </TechTag>

        <TechTag k="red-perfiles">
          <Tarjeta titulo="Ayudar a otras familias">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Aparecer en la red de cuidado</span>
              <input type="checkbox" role="switch" className="h-5 w-9 accent-primario" checked={ayuda.activo} onChange={(e) => setAyuda({ ...ayuda, activo: e.target.checked })} />
            </label>
            <p className="text-xs leading-relaxed text-muted">Las familias ven tu nombre, habilidades, certificaciones, disponibilidad y distancia aproximada. Nunca ven tu dirección ni entras a su espacio familiar.</p>
            <p className="text-xs leading-relaxed text-muted">{AVISOS.noRemuneracion}</p>
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

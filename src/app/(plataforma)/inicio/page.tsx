"use client";

import Link from "next/link";
import { useData } from "@/lib/db";
import { DIAS_LARGOS } from "@/lib/catalogos";
import { certificadas, estadoCertificaciones, fechaDe, habilidades, horasCuidado, proximosRelevos, rangoRelevo, relevoActual } from "@/lib/calculos";
import { diaSemana, fechaISO } from "@/lib/seed";
import { ROL_TEXTO } from "@/lib/types";
import { TechTag } from "@/components/TechTag";
import { ListaNotificaciones, useNotificaciones } from "@/components/Notificaciones";
import { Avatar, Encabezado, NivelPill, Pill, Tarjeta, Vacio, btnPrimary, btnSecondary } from "@/components/ui";

export default function Inicio() {
  const { db, ahora, usuario, misFamilias, invitaciones, responderInvitacion, responderIntercambio, responderSolicitud, cambiarFamilia } = useData();
  const avisos = useNotificaciones();
  if (!usuario) return null;
  const hoy = fechaISO(ahora);
  const misRelevos = proximosRelevos(db, null, ahora, 7, usuario.id).slice(0, 5);
  const intercambios = db.intercambios.filter((i) => i.aUsuarioId === usuario.id && i.estado === "pendiente");
  const solicitudes = db.solicitudes.filter((s) => s.usuarioId === usuario.id && s.estado === "enviada");
  const habs = habilidades(db, usuario.id);
  const certs = certificadas(db, usuario.id);
  const cert = estadoCertificaciones(db, usuario.id, ahora).find((c) => c.estado !== "certificada");
  const horas = horasCuidado(db, usuario.id, ahora);
  const diaTxt = (f: string) => (f === hoy ? "Hoy" : DIAS_LARGOS[diaSemana(fechaDe(f))]);

  return (
    <>
      <Encabezado sub={`${DIAS_LARGOS[diaSemana(ahora)]} ${ahora.getDate()}`} titulo={`Hola, ${usuario.nombre.split(" ")[0]}`} />

      {avisos.length > 0 && (
        <TechTag k="notificaciones" className="mb-4">
          <Tarjeta titulo={`Pendientes y avisos (${avisos.length})`}>
            <ListaNotificaciones lista={avisos} max={5} />
          </Tarjeta>
        </TechTag>
      )}

      {invitaciones.length > 0 && (
        <Tarjeta titulo="Te invitaron a un espacio familiar" className="mb-4 border-primario">
          {invitaciones.map(({ membresia, familia }) => {
            const quien = db.usuarios.find((u) => u.id === familia.creadaPor);
            return (
              <div key={membresia.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-3 text-sm">
                <span>
                  <span className="font-semibold">{quien?.nombre ?? "Alguien"}</span> te invitó a <span className="font-semibold">{familia.nombre}</span> como {membresia.parentesco.toLowerCase()} con rol de {ROL_TEXTO[membresia.rol].t.toLowerCase()}.
                </span>
                <span className="flex gap-2">
                  <button type="button" className={btnPrimary} onClick={() => responderInvitacion(membresia.id, true)}>Unirme</button>
                  <button type="button" className={btnSecondary} onClick={() => responderInvitacion(membresia.id, false)}>Rechazar</button>
                </span>
              </div>
            );
          })}
        </Tarjeta>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <TechTag k="perfil" className="lg:col-span-1">
          <Tarjeta titulo="Mi perfil" accion={<Link href="/perfil" className="text-sm font-medium text-muted">Editar</Link>}>
            <div className="flex items-center gap-3">
              <Avatar nombre={usuario.nombre} tono={usuario.tono} size={44} />
              <div className="flex flex-col">
                <span className="font-semibold">{usuario.nombre}</span>
                <span className="text-sm text-muted">{usuario.alcaldia || "Sin alcaldía"}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-canvas p-2.5"><p className="text-xl font-semibold">{horas}</p><p className="text-xs text-muted">horas de cuidado</p></div>
              <div className="rounded-xl bg-canvas p-2.5"><p className="text-xl font-semibold">{habs.length}</p><p className="text-xs text-muted">habilidades</p></div>
              <div className="rounded-xl bg-canvas p-2.5"><p className="text-xl font-semibold">{certs.length}</p><p className="text-xs text-muted">certificaciones</p></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {usuario.roles.map((r) => <Pill key={r}>{r}</Pill>)}
              {usuario.ofreceAyuda.activo && <Pill tono="green">Disponible en la red · {usuario.ofreceAyuda.radioKm} km</Pill>}
            </div>
          </Tarjeta>
        </TechTag>

        <Tarjeta titulo="Mis espacios familiares" accion={<Link href="/nueva-familia" className="text-sm font-medium text-muted">Crear</Link>} className="lg:col-span-2">
          {misFamilias.length === 0 && <Vacio>No perteneces a ningún espacio familiar. Puedes crear uno o ayudar a otras familias desde la red de cuidado.</Vacio>}
          <div className="grid gap-3 md:grid-cols-2">
            {misFamilias.map(({ familia, membresia }) => {
              const pac = db.pacientes.find((p) => p.familiaId === familia.id);
              const ultima = db.lecturas.filter((l) => l.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))[0];
              const alertas = db.alertas.filter((a) => a.familiaId === familia.id && a.estado === "activa").length;
              const turno = relevoActual(db, familia.id, ahora);
              const deTurno = db.usuarios.find((u) => u.id === turno?.asignadoA)?.nombre.split(" ")[0];
              return (
                <Link
                  key={familia.id}
                  href="/familia"
                  onClick={() => cambiarFamilia(familia.id)}
                  className="flex flex-col gap-2 rounded-xl border border-line p-4 transition hover:border-primario"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{familia.nombre}</span>
                    {alertas > 0 ? <NivelPill nivel="rojo" texto={`${alertas} alerta${alertas > 1 ? "s" : ""}`} /> : ultima && <NivelPill nivel={ultima.nivel} />}
                  </span>
                  <span className="text-sm text-muted">Cuidado de {pac?.nombre} · tu rol: {ROL_TEXTO[membresia.rol].t}</span>
                  <span className="text-xs text-muted">{deTurno ? `De turno ahora: ${deTurno}` : "Sin turno en este horario"}</span>
                </Link>
              );
            })}
          </div>
        </Tarjeta>

        <TechTag k="relevos" className="lg:col-span-2">
          <Tarjeta titulo="Mis próximos relevos">
            {misRelevos.length === 0 && <Vacio>No tienes relevos asignados esta semana.</Vacio>}
            <ul className="flex flex-col divide-y divide-line-soft">
              {misRelevos.map((r) => {
                const fam = db.familias.find((f) => f.id === r.familiaId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="flex flex-col">
                      <span className="font-medium">{diaTxt(r.fecha)} · {rangoRelevo(r)}</span>
                      <span className="text-xs text-muted">{fam?.nombre}{r.origen === "red" ? " · relevo de la red" : ""}</span>
                    </span>
                    <Pill>{r.horas} h</Pill>
                  </li>
                );
              })}
            </ul>
          </Tarjeta>
        </TechTag>

        <TechTag k="trayectoria">
          <Tarjeta titulo="Mi trayectoria" accion={<Link href="/capacitacion" className="text-sm font-medium text-muted">Capacitación</Link>}>
            {cert ? (
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-semibold">{cert.def.nombre}</span>
                <span className="text-muted">
                  {cert.estado === "disponible" ? "Ya puedes agendar tu demostración presencial." : cert.estado === "agendada" ? `Agendada: ${cert.cita}` : `Te faltan ${cert.faltan.length} habilidad${cert.faltan.length === 1 ? "" : "es"}${cert.horasOk ? "" : ` y ${cert.def.horasMinimas - cert.horas} h de cuidado`}.`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted">Tienes todas las certificaciones disponibles.</p>
            )}
            {certs.map((c) => <Pill key={c.id} tono="dark">{c.nombre}</Pill>)}
          </Tarjeta>
        </TechTag>
      </div>

      {(intercambios.length > 0 || solicitudes.length > 0) && (
        <TechTag k="intercambio" className="mt-4">
          <Tarjeta titulo="Te piden cubrir un relevo">
            {intercambios.map((i) => {
              const r = db.relevos.find((x) => x.id === i.relevoId);
              const de = db.usuarios.find((u) => u.id === i.deUsuarioId);
              return (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-3 text-sm">
                  <span>
                    <span className="font-semibold">{de?.nombre.split(" ")[0]}</span> (tu familia) te pide cubrir {r ? `${diaTxt(r.fecha).toLowerCase()} de ${rangoRelevo(r)}` : "un relevo"} a cambio de{" "}
                    <span className="font-semibold">{i.tipo === "horas" ? `${r?.horas ?? 0} h que te devuelve` : `$${i.monto} MXN`}</span>
                  </span>
                  <span className="flex gap-2">
                    <button type="button" className={btnPrimary} onClick={() => responderIntercambio(i.id, true)}>Aceptar</button>
                    <button type="button" className={btnSecondary} onClick={() => responderIntercambio(i.id, false)}>No puedo</button>
                  </span>
                </div>
              );
            })}
            {solicitudes.map((s) => {
              const r = db.relevos.find((x) => x.id === s.relevoId);
              const fam = db.familias.find((f) => f.id === s.familiaId);
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-3 text-sm">
                  <span>
                    <span className="font-semibold">{fam?.nombre}</span> (red de cuidado) te pide un relevo {r ? `${diaTxt(r.fecha).toLowerCase()} de ${rangoRelevo(r)}` : ""} · {s.pago}
                    {s.pago === "pago" ? ` $${s.monto} MXN` : ""}
                  </span>
                  <span className="flex gap-2">
                    <button type="button" className={btnPrimary} onClick={() => responderSolicitud(s.id, true)}>Aceptar</button>
                    <button type="button" className={btnSecondary} onClick={() => responderSolicitud(s.id, false)}>No puedo</button>
                  </span>
                </div>
              );
            })}
          </Tarjeta>
        </TechTag>
      )}
    </>
  );
}

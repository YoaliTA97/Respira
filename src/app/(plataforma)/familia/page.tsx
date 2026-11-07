"use client";

import Link from "next/link";
import { useData } from "@/lib/db";
import { DIAS_LARGOS, nombreCondicion } from "@/lib/catalogos";
import { adherencia, cargaSemana, coberturaSemana, fechaDe, horasCuidado, horasDisponibles, rangoRelevo } from "@/lib/calculos";
import { diaSemana, fechaISO } from "@/lib/seed";
import { ROL_TEXTO } from "@/lib/types";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Avatar, Encabezado, NivelPill, Pill, TONO_BARRA, Tarjeta, Vacio, btnDanger, btnPrimary, btnSecondary } from "@/components/ui";

function Kpi({ t, v, d }: { t: string; v: React.ReactNode; d: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
      <span className="text-sm text-muted">{t}</span>
      <span className="text-[26px] font-semibold tracking-tight">{v}</span>
      <span className="text-xs text-muted">{d}</span>
    </div>
  );
}

function Resumen() {
  const { db, ahora, familia, paciente, integrantes } = useData();
  if (!familia || !paciente) return null;
  const hoy = fechaISO(ahora);
  const lecturas = db.lecturas.filter((l) => l.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));
  const ultima = lecturas[0];
  const alertas = db.alertas.filter((a) => a.familiaId === familia.id && a.estado === "activa");
  const cobertura = coberturaSemana(db, familia.id, ahora);
  const adh = adherencia(db, familia.id, ahora);
  const carga = cargaSemana(db, familia.id, ahora);
  const maxCarga = Math.max(1, ...carga.filas.map((f) => f.horas), carga.externas);
  const d7 = new Date(ahora);
  d7.setDate(d7.getDate() - 7);

  return (
    <>
      <Encabezado
        sub={`Cuidado de ${paciente.nombre}, ${paciente.edad} años · ${paciente.condiciones.map(nombreCondicion).join(", ")}`}
        titulo={familia.nombre}
        acciones={
          <>
            <Link href="/chat" className={btnPrimary}>Recibir a {paciente.nombre}</Link>
            <Link href="/relevos" className={btnSecondary}>Relevos</Link>
          </>
        }
      />

      {alertas.length > 0 && (
        <TechTag k="trifecta" className="mb-4">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-line bg-red-bg p-5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-red-ink">Alerta activa</span>
              <span className="text-[15px] font-semibold">{alertas[alertas.length - 1].titulo}</span>
              <span className="text-sm text-ink-2">{alertas[alertas.length - 1].motivo}</span>
            </div>
            <div className="flex gap-2">
              <a href="tel:911" className={btnDanger}>Llamar al 911</a>
              <Link href="/alertas" className={btnSecondary}>Centros cercanos</Link>
            </div>
          </section>
        </TechTag>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi t="Estado" v={ultima ? <NivelPill nivel={ultima.nivel} /> : "—"} d={ultima ? `Último reporte ${ultima.fechaHora.slice(0, 10) === hoy ? "hoy" : ultima.fechaHora.slice(0, 10)} ${ultima.fechaHora.slice(11, 16)}` : "Sin reportes"} />
        <Kpi t="Cobertura 7 días" v={`${cobertura.pct}%`} d={cobertura.sinCubrir.length ? `${cobertura.sinCubrir.length} relevo(s) sin cubrir` : "Todos los relevos cubiertos"} />
        <Kpi t="Medicación de hoy" v={`${adh.dadas}/${adh.debidas}`} d="Dosis dadas de las que ya tocaban" />
        <Kpi t="Horas de cuidado" v={`${carga.total} h`} d={`Últimos 7 días · ${carga.pctMujeres}% las cubrieron mujeres`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TechTag k="historial" className="lg:col-span-2">
          <Tarjeta titulo="Signos registrados" accion={<Link href="/paciente" className="text-sm font-medium text-muted">Historial completo</Link>}>
            {lecturas.length === 0 ? (
              <Vacio>Sin reportes todavía.</Vacio>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      {["Cuándo", "FC", "FR", "Presión", "Glucosa", "Dolor", "Nivel", "Quién"].map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {lecturas.slice(0, 7).map((l) => (
                      <tr key={l.id} className="border-b border-line-soft last:border-0">
                        <td className="py-2 pr-3">{l.fechaHora.slice(5, 10)} {l.fechaHora.slice(11, 16)}</td>
                        <td className="py-2 pr-3">{l.fc ?? "—"}</td>
                        <td className="py-2 pr-3">{l.fr ?? "—"}</td>
                        <td className="py-2 pr-3">{l.paSist ? `${l.paSist}/${l.paDiast ?? "?"}` : "—"}</td>
                        <td className="py-2 pr-3">{l.glucosa ?? "—"}</td>
                        <td className="py-2 pr-3">{l.dolor ?? "—"}</td>
                        <td className="py-2 pr-3"><NivelPill nivel={l.nivel} /></td>
                        <td className="py-2 pr-3 text-muted">{db.usuarios.find((u) => u.id === l.porUsuarioId)?.nombre.split(" ")[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tarjeta>
        </TechTag>

        <TechTag k="carga-genero">
          <Tarjeta titulo="Quién cuidó (7 días)">
            <div className="flex flex-col gap-2.5 text-sm">
              {carga.filas.map((f) => (
                <div key={f.usuario.id} className="grid grid-cols-[76px_minmax(0,1fr)_44px] items-center gap-2.5">
                  <span className="truncate">{f.usuario.nombre.split(" ")[0]}</span>
                  <span className="flex h-2 rounded-full bg-chip"><span className={`rounded-full ${TONO_BARRA[f.usuario.tono]}`} style={{ width: `${(f.horas / maxCarga) * 100}%` }} /></span>
                  <span className="text-right font-semibold">{f.horas} h</span>
                </div>
              ))}
              {carga.externas > 0 && (
                <div className="grid grid-cols-[76px_minmax(0,1fr)_44px] items-center gap-2.5">
                  <span>Red</span>
                  <span className="flex h-2 rounded-full bg-chip"><span className="rounded-full bg-maya" style={{ width: `${(carga.externas / maxCarga) * 100}%` }} /></span>
                  <span className="text-right font-semibold">{carga.externas} h</span>
                </div>
              )}
            </div>
            <p className="border-t border-line-soft pt-3 text-xs text-muted">Las mujeres de la familia cubrieron el {carga.pctMujeres}% de las horas.</p>
          </Tarjeta>
        </TechTag>

        <TechTag k="membresias" className="lg:col-span-2">
          <Tarjeta titulo="Roles y disponibilidad" accion={<Link href="/integrantes" className="text-sm font-medium text-muted">Gestionar</Link>}>
            <ul className="flex flex-col divide-y divide-line-soft">
              {integrantes.map(({ usuario: u, membresia: m }) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Avatar nombre={u.nombre} tono={u.tono} size={32} />
                  <span className="flex min-w-[140px] flex-1 flex-col">
                    <span className="font-semibold">{u.nombre}</span>
                    <span className="text-xs text-muted">{m.parentesco}</span>
                  </span>
                  <Pill tono="outline">{ROL_TEXTO[m.rol].t}</Pill>
                  {m.principal && <Pill>Recibe alertas</Pill>}
                  <span className="w-36 text-right text-xs text-muted">{horasDisponibles(u.disponibilidad)} h/sem disponibles · {horasCuidado(db, u.id, ahora, fechaISO(d7), familia.id)} h cubiertas</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </TechTag>

        <TechTag k="relevos">
          <Tarjeta titulo="Sin cubrir esta semana" accion={<Link href="/relevos" className="text-sm font-medium text-muted">Cubrir</Link>}>
            {cobertura.sinCubrir.length === 0 && <p className="text-sm text-muted">Todos los relevos de la semana tienen responsable.</p>}
            {cobertura.sinCubrir.slice(0, 5).map((r) => (
              <div key={r.id} className="flex justify-between text-sm">
                <span>{DIAS_LARGOS[diaSemana(fechaDe(r.fecha))]}</span>
                <span className="font-medium text-red-ink">{rangoRelevo(r)}</span>
              </div>
            ))}
          </Tarjeta>
        </TechTag>
      </div>
    </>
  );
}

export default function FamiliaPage() {
  return (
    <RequiereFamilia>
      <Resumen />
    </RequiereFamilia>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useData } from "@/lib/db";
import { DIAS_LARGOS, MINUTOS_A_TIEMPO, ZARIT_CORTE, nivelZarit, nombreCondicion } from "@/lib/catalogos";
import { adherencia, cargaSemana, coberturaSemana, fechaDe, horasCuidado, horasDisponibles, metricasEspacio, puedeVerHistorial, rangoRelevo } from "@/lib/calculos";
import { diaSemana, fechaISO } from "@/lib/seed";
import { ROL_TEXTO } from "@/lib/types";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { ZaritModal } from "@/components/Zarit";
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
  const { db, ahora, usuario, familia, paciente, integrantes } = useData();
  const [zarit, setZarit] = useState(false);
  if (!familia || !paciente || !usuario) return null;
  const met = metricasEspacio(db, familia.id, ahora);
  const hoy = fechaISO(ahora);
  const verHist = puedeVerHistorial(paciente, usuario.id);
  const lecturas = db.lecturas.filter((l) => verHist && l.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));
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
            <Link href="/valoracion" className={btnPrimary}>Valorar a {paciente.nombre}</Link>
            <Link href="/chat" className={btnSecondary}>Nota de voz</Link>
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
              <Link href="/alertas" className={btnSecondary}>Responder y ver centros</Link>
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

      <TechTag k="metricas" className="mb-4">
        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-semibold">Indicadores del espacio · últimos 30 días</h2>
            <span className="text-xs text-muted">Calculados con lo que registra la familia</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-xl bg-canvas p-4">
              <span className="text-sm text-muted">Horas de relevo al mes</span>
              <span className="text-[26px] font-semibold tracking-tight">{met.horasMes} h</span>
              <span className="text-xs text-muted">{met.horasFamilia} h de la familia · {met.horasRed} h de la red</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-canvas p-4">
              <span className="text-sm text-muted">Sobrecarga (escala de Zarit)</span>
              <span className={`text-[26px] font-semibold tracking-tight ${met.sobrecargadas ? "text-amber-ink" : ""}`}>{met.sobrecargadas} de {met.conZarit}</span>
              <span className="text-xs text-muted">cuidadoras con sobrecarga intensa ({ZARIT_CORTE}+ puntos)</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-canvas p-4">
              <span className="text-sm text-muted">Alertas atendidas a tiempo</span>
              <span className="text-[26px] font-semibold tracking-tight">{met.alertas.total ? `${met.alertas.aTiempo} de ${met.alertas.total}` : "—"}</span>
              <span className="text-xs text-muted">
                En {MINUTOS_A_TIEMPO} min o menos{met.alertas.mediana !== null ? ` · mediana ${met.alertas.mediana} min` : ""}{met.alertas.activas ? ` · ${met.alertas.activas} activa(s)` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-canvas p-4">
              <span className="text-sm text-muted">Cuidadoras certificadas con ingreso</span>
              <span className="text-[26px] font-semibold tracking-tight">{met.certificadasConIngreso.length}</span>
              <span className="text-xs text-muted">
                {met.certificadasConIngreso.length
                  ? met.certificadasConIngreso.map((c) => `${c.usuario.nombre.split(" ")[0]} ($${c.ingreso.toLocaleString("es-MX")})`).join(", ")
                  : `${met.certificadas.length} certificada(s) sin ingreso todavía`}
              </span>
            </div>
          </div>
        </section>
      </TechTag>

      <div className="grid gap-4 lg:grid-cols-3">
        <TechTag k="historial" className="lg:col-span-2">
          <Tarjeta titulo="Signos registrados" accion={<Link href="/paciente" className="text-sm font-medium text-muted">Historial completo</Link>}>
            {lecturas.length === 0 ? (
              <Vacio>{verHist ? "Sin reportes todavía." : `${paciente.nombre} no comparte su historial contigo por ahora.`}</Vacio>
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

        <TechTag k="metricas" className="lg:col-span-2">
          <Tarjeta titulo="¿Cómo están quienes cuidan? · Zarit" accion={<button type="button" className="text-sm font-medium text-muted" onClick={() => setZarit(true)}>Responder mi escala</button>}>
            <ul className="flex flex-col gap-2.5">
              {met.zarit.map(({ usuario: u, ultima, anterior }) => (
                <li key={u.id} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="truncate font-medium">{u.nombre.split(" ")[0]}</span>
                  {ultima ? (
                    <span className="relative flex h-2.5 rounded-full bg-chip">
                      <span className={`rounded-full ${ultima.puntaje >= ZARIT_CORTE ? "bg-amber-ink" : "bg-primario"}`} style={{ width: `${(ultima.puntaje / 35) * 100}%` }} />
                      <span className="absolute -top-1 h-4.5 w-0.5 bg-ink/40" style={{ left: `${(ZARIT_CORTE / 35) * 100}%` }} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="text-xs text-muted">Sin responder</span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs">
                    {ultima && <Pill tono={ultima.puntaje >= ZARIT_CORTE ? "amber" : "green"}>{ultima.puntaje} · {nivelZarit(ultima.puntaje)}</Pill>}
                    {ultima && anterior && <span className="text-muted">{ultima.puntaje > anterior.puntaje ? "↑" : ultima.puntaje < anterior.puntaje ? "↓" : "="} vs {anterior.puntaje}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line-soft pt-3 text-xs text-muted">Zarit abreviada de 7 preguntas, de 7 a 35 puntos; la línea marca {ZARIT_CORTE}. Si alguien está en sobrecarga intensa, conviene darle relevos.</p>
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
      {zarit && <ZaritModal onCerrar={() => setZarit(false)} />}
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

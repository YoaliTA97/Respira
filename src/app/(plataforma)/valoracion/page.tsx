"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useData } from "@/lib/db";
import { AFILIACIONES, ANTECEDENTES, DISPOSITIVOS, EQUIPOS, GUIAS_MEDICAS, MEDICAMENTOS_DE, SIGNOS, SINTOMAS, ULTIMA_CONSULTA, condicionCatalogo } from "@/lib/catalogos";
import { reducirImagen } from "@/lib/imagen";
import { imagenEjemplo } from "@/lib/seed";
import { evaluar, type Medicion, type Senal } from "@/lib/reglas";
import type { HistoriaClinica, ServiciosSalud, SignoId } from "@/lib/types";
import { GuiaModal } from "@/components/GuiaVideo";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Encabezado, Etiquetas, NivelPill, Pill, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const PASOS = ["Biométricos", "Síntomas", "Conciencia", "Historia clínica", "Servicios de salud", "Resultado"];

type Campo = { k: keyof Medicion; t: string; unidad: string; signo: SignoId; guia: string; paso?: string };
const CAMPOS: Campo[] = [
  { k: "fc", t: "Frecuencia cardiaca", unidad: "lpm", signo: "fc", guia: "pulso-respiracion" },
  { k: "fr", t: "Frecuencia respiratoria", unidad: "rpm", signo: "fr", guia: "pulso-respiracion" },
  { k: "paSist", t: "Presión sistólica (la alta)", unidad: "mmHg", signo: "pa", guia: "presion" },
  { k: "paDiast", t: "Presión diastólica (la baja)", unidad: "mmHg", signo: "pa", guia: "presion" },
  { k: "glucosa", t: "Glucosa", unidad: "mg/dL", signo: "glucosa", guia: "glucosa" },
  { k: "temperatura", t: "Temperatura", unidad: "°C", signo: "temperatura", guia: "temperatura", paso: "0.1" },
  { k: "spo2", t: "Oxigenación", unidad: "%", signo: "spo2", guia: "oximetro" },
];

type Conciencia = { ojos: boolean | null; voz: boolean | null; tacto: boolean | null; nombre: boolean | null; lugar: boolean | null; fecha: boolean | null; cambio: boolean | null };

function SiNo({ valor, onChange, etiqueta }: { valor: boolean | null; onChange: (v: boolean) => void; etiqueta: string }) {
  return (
    <div role="group" aria-label={etiqueta} className="flex shrink-0 gap-1 rounded-xl bg-chip p-1">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" aria-pressed={valor === v} onClick={() => onChange(v)} className={`min-h-[36px] min-w-[52px] rounded-lg px-3 text-sm font-semibold ${valor === v ? "bg-white shadow-sm" : "text-muted"}`}>
          {v ? "Sí" : "No"}
        </button>
      ))}
    </div>
  );
}

function resultadoConciencia(c: Conciencia, conDemencia: boolean): { valor: Medicion["conciencia"] | undefined; texto: string } {
  if (c.ojos === null) return { valor: undefined, texto: "Responde las preguntas para valorar." };
  if (c.ojos === false && c.voz === false) {
    return c.tacto === null ? { valor: undefined, texto: "Falta saber si responde al tacto." } : { valor: "no responde", texto: c.tacto ? "Solo responde al tacto: es una alerta. Llama al 911." : "No responde a la voz ni al tacto: llama al 911." };
  }
  const orientacion = [c.nombre, c.lugar, c.fecha];
  if (orientacion.some((x) => x === null) || c.cambio === null) return { valor: undefined, texto: "Faltan preguntas de orientación." };
  if (c.cambio) return { valor: "confundida", texto: "Hay un cambio repentino respecto a cómo suele estar: es señal de alerta." };
  if (orientacion.every(Boolean)) return { valor: "alerta", texto: "Está alerta y orientada." };
  return conDemencia
    ? { valor: "alerta", texto: "No está orientada, pero es su estado habitual por el deterioro cognitivo." }
    : { valor: "confundida", texto: "No está orientada: regístralo como confusión." };
}

function Valoracion() {
  const { db, paciente, familia, usuario, puede, guardarValoracion, procesando } = useData();
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Partial<Record<keyof Medicion, string>>>({});
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [dolor, setDolor] = useState<number | null>(null);
  const [c, setC] = useState<Conciencia>({ ojos: null, voz: null, tacto: null, nombre: null, lugar: null, fecha: null, cambio: null });
  const [historia, setHistoria] = useState<Omit<HistoriaClinica, "actualizada" | "porUsuarioId">>(() => {
    const h = paciente?.historia;
    return { antecedentes: h?.antecedentes ?? [], dispositivos: h?.dispositivos ?? [], notas: h?.notas ?? "" };
  });
  const [servicios, setServicios] = useState<Omit<ServiciosSalud, "actualizada" | "porUsuarioId">>(() => {
    const s = paciente?.servicios;
    return {
      afiliacion: s?.afiliacion ?? [], unidad: s?.unidad ?? "", medico: s?.medico ?? "", ultimaConsulta: s?.ultimaConsulta ?? "",
      urgencias3m: s?.urgencias3m ?? null, citaPendiente: s?.citaPendiente ?? null, recetaVigente: s?.recetaVigente ?? null, medicamentosDe: s?.medicamentosDe ?? "",
    };
  });
  const [tocoHistoria, setTocoHistoria] = useState(false);
  const [tocoServicios, setTocoServicios] = useState(false);
  const [fotos, setFotos] = useState<{ descripcion: string; foto: string }[]>([]);
  const [nota, setNota] = useState("");
  const [guia, setGuia] = useState<string | null>(null);
  if (!paciente || !familia || !usuario) return null;
  if (!puede("registrar")) return <p className="text-sm text-muted">Tu rol en este espacio es de avisos: puedes ver los registros pero no capturar valoraciones.</p>;

  const num = (k: keyof Medicion) => {
    const v = valores[k];
    return v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined;
  };
  const conDemencia = paciente.condiciones.includes("demencia");
  const conc = resultadoConciencia(c, conDemencia);
  const medicion: Medicion = {
    fc: num("fc"), fr: num("fr"), paSist: num("paSist"), paDiast: num("paDiast"), glucosa: num("glucosa"), temperatura: num("temperatura"), spo2: num("spo2"),
    dolor: dolor ?? undefined, conciencia: conc.valor,
  };
  (Object.keys(medicion) as (keyof Medicion)[]).forEach((k) => medicion[k] === undefined && delete medicion[k]);
  const senales = SINTOMAS.filter((s) => s.senal && sintomas.includes(s.t)).map((s) => s.senal!) as Senal[];
  if (conc.valor === "no responde") senales.push("no_responde");
  if (conc.valor === "confundida") senales.push("confusion");
  const otrosSintomas = sintomas.filter((t) => !SINTOMAS.some((s) => s.senal && s.t === t));
  const ev = evaluar(medicion, senales, paciente.umbrales, paciente.condiciones, paciente.signos);
  const equipoDe = (signo: SignoId) => EQUIPOS.find((e) => e.signo === signo);
  const loTienen = (tipo: string) => db.equipos.some((e) => e.familiaId === familia.id && e.tipo === tipo && e.estado !== "necesitamos");
  const rango = (k: keyof Medicion) => {
    const u = paciente.umbrales;
    if (k === "fc") return `${u.fc.min}–${u.fc.max}`;
    if (k === "fr") return `${u.fr.min}–${u.fr.max}`;
    if (k === "paSist") return `${u.paSist.min}–${u.paSist.max}`;
    if (k === "glucosa") return `${u.glucosa.min}–${u.glucosa.max}`;
    if (k === "temperatura") return `hasta ${u.temperatura.max}`;
    return "";
  };

  // Para la presentación: llena la valoración completa y salta al resultado.
  const llenar = (tipo: "estable" | "alerta") => {
    if (tipo === "estable") {
      setValores({ fc: "78", fr: "17", paSist: "128", paDiast: "78", glucosa: "132", temperatura: "36.6", spo2: "96" });
      setSintomas(["Durmió mal"]);
      setDolor(3);
      setC({ ojos: true, voz: null, tacto: null, nombre: true, lugar: true, fecha: true, cambio: false });
      setFotos([{ descripcion: "Glucómetro: 132 mg/dL", foto: imagenEjemplo("132", "mg/dL") }]);
    } else {
      setValores({ fc: "128", fr: "27", paSist: "86", paDiast: "52", glucosa: "210", temperatura: "37.4", spo2: "89" });
      setSintomas(["Le falta el aire", "Mareo"]);
      setDolor(6);
      setC({ ojos: true, voz: null, tacto: null, nombre: true, lugar: false, fecha: false, cambio: true });
      setFotos([{ descripcion: "Baumanómetro: 86/52 mmHg", foto: imagenEjemplo("86/52", "mmHg") }]);
    }
    setPaso(5);
  };

  const guardar = async () => {
    await guardarValoracion({
      medicion, senales, sintomas: otrosSintomas, nota, evidencias: fotos,
      historia: tocoHistoria ? historia : undefined, servicios: tocoServicios ? servicios : undefined,
    });
    router.push("/chat");
  };

  const pregunta = (k: keyof Conciencia, t: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-line-soft py-2.5 last:border-0">
      <span className="text-[15px]">{t}</span>
      <SiNo etiqueta={t} valor={c[k]} onChange={(v) => setC({ ...c, [k]: v })} />
    </div>
  );

  return (
    <>
      <Encabezado sub={`Valoración de ${paciente.nombre} · checklist para registrar más fácil`} titulo="Valoración del estado actual" acciones={
          <>
            <button type="button" className={btnSecondary} onClick={() => llenar("estable")}>Ejemplo estable</button>
            <button type="button" className={btnSecondary} onClick={() => llenar("alerta")}>Ejemplo de alerta</button>
            <Link href="/chat" className={btnSecondary}>Por nota de voz</Link>
          </>
        }
      />
      <div className="mb-5 flex flex-col gap-2">
        <div className="grid grid-cols-6 gap-1.5">{PASOS.map((s, i) => <span key={s} className={`h-1 rounded-full ${i <= paso ? "bg-primario" : "bg-[#dfe2ee]"}`} />)}</div>
        <div className="hidden grid-cols-6 gap-1.5 text-xs text-muted md:grid">{PASOS.map((s, i) => <button type="button" key={s} onClick={() => setPaso(i)} className={`text-left ${i === paso ? "font-semibold text-ink" : ""}`}>{s}</button>)}</div>
        <span className="text-xs text-muted md:hidden">Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}</span>
      </div>

      <TechTag k={paso === 3 || paso === 4 ? "historia-clinica" : "valoracion"}>
        <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-5 md:p-7">
          {paso === 0 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Toma de biométricos</h2>
                <p className="mt-1 text-sm text-muted">Llena lo que pudiste medir. Los marcados los pide su perfil. Si no sabes cómo, abre la guía del médico.</p>
              </div>
              <ul className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line">
                {CAMPOS.map((f) => {
                  const pide = paciente.signos.includes(f.signo);
                  const eq = equipoDe(f.signo);
                  return (
                    <li key={f.k} className="grid gap-2 p-3 md:grid-cols-[1fr_150px_auto] md:items-center">
                      <div className="flex flex-col">
                        <span className="flex flex-wrap items-center gap-1.5 text-[15px] font-medium">{f.t} {pide && <Pill>Lo pide su perfil</Pill>}</span>
                        <span className="text-xs text-muted">
                          {rango(f.k) && `Rango de su perfil: ${rango(f.k)} · `}
                          {eq && !loTienen(eq.id) ? <Link href="/equipo" className="font-semibold underline">No tienen {eq.nombre.toLowerCase()}: pedirlo</Link> : f.unidad}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input aria-label={f.t} type="number" inputMode="decimal" step={f.paso ?? "1"} className={`${input} h-10`} value={valores[f.k] ?? ""} onChange={(e) => setValores({ ...valores, [f.k]: e.target.value })} />
                        <span className="w-12 text-xs text-muted">{f.unidad}</span>
                      </div>
                      <button type="button" className="justify-self-start text-sm font-semibold text-primario underline" onClick={() => setGuia(f.guia)}>¿Cómo se mide?</button>
                    </li>
                  );
                })}
              </ul>
              <TechTag k="evidencia">
                <div className="flex flex-col gap-2 rounded-2xl bg-canvas p-4">
                  <span className="text-sm font-semibold">Evidencia: foto de la pantalla del equipo (opcional)</span>
                  <span className="text-xs text-muted">Respalda lo que registras; otra persona de la familia la puede confirmar después.</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {fotos.map((f, i) => (
                      <span key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element -- foto local en data URL */}
                        <img src={f.foto} alt={f.descripcion} className="h-20 w-28 rounded-xl border border-line object-cover" />
                        <button type="button" aria-label="Quitar foto" onClick={() => setFotos(fotos.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-sm text-white">×</button>
                      </span>
                    ))}
                    <label className={`${btnSecondary} cursor-pointer`}>
                      Tomar o subir foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={async (e) => {
                          const a = e.target.files?.[0];
                          e.target.value = "";
                          if (a) setFotos([...fotos, { descripcion: "Foto de la medición en la valoración", foto: await reducirImagen(a) }]);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </TechTag>
            </>
          )}

          {paso === 1 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Evaluación de síntomas</h2>
                <p className="mt-1 text-sm text-muted">Marca lo que observas hoy. Si es otro, escríbelo.</p>
              </div>
              <Etiquetas etiqueta="Síntomas" valor={sintomas} onChange={setSintomas} opciones={SINTOMAS.map((s) => s.t)} placeholder="¿Otro síntoma? Escríbelo" />
              <div className="flex flex-col gap-2">
                <span className={label}>Dolor: ¿cómo lo califica de 0 a 10?</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button key={i} type="button" aria-pressed={dolor === i} onClick={() => setDolor(dolor === i ? null : i)} className={`h-11 w-11 rounded-xl border text-sm font-semibold ${dolor === i ? "border-primario bg-primario text-white" : "border-line bg-white"}`}>
                      {i}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted">0 = sin dolor · 10 = el peor dolor imaginable</span>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Estado de conciencia</h2>
                  <p className="mt-1 text-sm text-muted">Cómo identificar si está alerta, confundida o no responde.</p>
                </div>
                <button type="button" className={btnSecondary} onClick={() => setGuia("conciencia")}>Ver guía del médico</button>
              </div>
              <div className="flex flex-col rounded-2xl border border-line px-4">
                {pregunta("ojos", "¿Tiene los ojos abiertos y te sigue con la mirada?")}
                {c.ojos === false && pregunta("voz", "¿Responde cuando le hablas en voz alta por su nombre?")}
                {c.ojos === false && c.voz === false && pregunta("tacto", "¿Responde si la tocas del hombro con firmeza?")}
                {(c.ojos || c.voz) && (
                  <>
                    {pregunta("nombre", "¿Sabe cómo se llama?")}
                    {pregunta("lugar", "¿Sabe dónde está?")}
                    {pregunta("fecha", "¿Sabe qué día o mes es, aproximadamente?")}
                    {pregunta("cambio", "¿Está distinta a como suele estar (más dormida, más confundida o habla raro)?")}
                  </>
                )}
              </div>
              <div className={`rounded-2xl p-4 text-sm ${conc.valor === "no responde" ? "bg-red-bg text-red-ink" : conc.valor === "confundida" ? "bg-amber-bg text-amber-ink" : conc.valor === "alerta" ? "bg-green-bg text-green-ink" : "bg-canvas text-muted"}`}>
                <span className="font-semibold">{conc.valor ? `Resultado: ${conc.valor}. ` : ""}</span>
                {conc.texto}
                {conc.valor === "no responde" && <a href="tel:911" className="ml-2 font-semibold underline">Llamar al 911</a>}
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Historia clínica</h2>
                <p className="mt-1 text-sm text-muted">
                  {paciente.historia ? `Registrada el ${paciente.historia.actualizada}. Revisa si cambió algo; si no, continúa.` : "Se registra una vez y se actualiza cuando cambie algo."}
                </p>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className={`${label} mb-2`}>Antecedentes</legend>
                <Etiquetas etiqueta="Antecedentes" valor={historia.antecedentes} onChange={(v) => { setHistoria({ ...historia, antecedentes: v }); setTocoHistoria(true); }} opciones={ANTECEDENTES} placeholder="¿Otro? Escríbelo" />
              </fieldset>
              <fieldset className="flex flex-col gap-2">
                <legend className={`${label} mb-2`}>Usa o necesita</legend>
                <Etiquetas etiqueta="Dispositivos" valor={historia.dispositivos} onChange={(v) => { setHistoria({ ...historia, dispositivos: v }); setTocoHistoria(true); }} opciones={DISPOSITIVOS} placeholder="¿Otro? Escríbelo" />
              </fieldset>
              <div className="grid gap-3 rounded-2xl bg-canvas p-4 text-sm md:grid-cols-2">
                <span><span className="font-semibold">Condiciones:</span> {paciente.condiciones.map((x) => condicionCatalogo(x)?.nombre ?? x).join(", ")}</span>
                <span><span className="font-semibold">Alergias:</span> {(paciente.alergias ?? []).join(", ") || "Sin registrar"}</span>
                <span><span className="font-semibold">Medicamentos:</span> {db.medicamentos.filter((x) => x.familiaId === familia.id).map((x) => x.nombre).join(", ") || "Sin registrar"}</span>
                <Link href="/paciente" className="font-semibold underline">Editar condiciones, alergias y medicación</Link>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="hc-notas" className={label}>Notas (cirugías, hospitalizaciones, indicaciones)</label>
                <textarea id="hc-notas" rows={2} className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario" value={historia.notas} onChange={(e) => { setHistoria({ ...historia, notas: e.target.value }); setTocoHistoria(true); }} />
              </div>
            </>
          )}

          {paso === 4 && (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Uso de servicios de salud</h2>
                <p className="mt-1 text-sm text-muted">{paciente.servicios ? `Registrado el ${paciente.servicios.actualizada}. Actualiza lo que haya cambiado.` : "Dónde la atienden y cómo va su seguimiento médico."}</p>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className={`${label} mb-2`}>Afiliación</legend>
                <Etiquetas etiqueta="Afiliación" valor={servicios.afiliacion} onChange={(v) => { setServicios({ ...servicios, afiliacion: v }); setTocoServicios(true); }} opciones={AFILIACIONES} placeholder="¿Otra? Escríbela" />
              </fieldset>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label htmlFor="sv-unidad" className={label}>Unidad o clínica donde la atienden</label><input id="sv-unidad" className={input} value={servicios.unidad} onChange={(e) => { setServicios({ ...servicios, unidad: e.target.value }); setTocoServicios(true); }} /></div>
                <div className="flex flex-col gap-1.5"><label htmlFor="sv-medico" className={label}>Médico familiar (opcional)</label><input id="sv-medico" className={input} value={servicios.medico} onChange={(e) => { setServicios({ ...servicios, medico: e.target.value }); setTocoServicios(true); }} /></div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sv-ultima" className={label}>Última consulta</label>
                  <select id="sv-ultima" className={input} value={servicios.ultimaConsulta} onChange={(e) => { setServicios({ ...servicios, ultimaConsulta: e.target.value }); setTocoServicios(true); }}>
                    <option value="">Elige</option>
                    {ULTIMA_CONSULTA.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="sv-meds" className={label}>Sus medicamentos</label>
                  <select id="sv-meds" className={input} value={servicios.medicamentosDe} onChange={(e) => { setServicios({ ...servicios, medicamentosDe: e.target.value }); setTocoServicios(true); }}>
                    <option value="">Elige</option>
                    {MEDICAMENTOS_DE.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col rounded-2xl border border-line px-4">
                {([
                  ["urgencias3m", "¿Fue a urgencias en los últimos 3 meses?"],
                  ["citaPendiente", "¿Tiene una cita médica pendiente?"],
                  ["recetaVigente", "¿Tiene sus recetas vigentes?"],
                ] as const).map(([k, t]) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-b border-line-soft py-2.5 last:border-0">
                    <span className="text-[15px]">{t}</span>
                    <SiNo etiqueta={t} valor={servicios[k]} onChange={(v) => { setServicios({ ...servicios, [k]: v }); setTocoServicios(true); }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {paso === 5 && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">Resultado</h2>
                <NivelPill nivel={ev.nivel} />
              </div>
              <div className={`rounded-2xl p-4 ${ev.nivel === "rojo" ? "bg-red-bg" : ev.nivel === "amarillo" ? "bg-amber-bg" : "bg-green-bg"}`}>
                <p className="font-semibold">{ev.titulo}</p>
                <p className="text-sm text-ink-2">{ev.motivo}</p>
                {ev.nivel === "rojo" && <p className="mt-1 text-sm font-semibold text-red-ink">Al guardar se avisa a la familia por WhatsApp con el enlace a SIDECU.</p>}
              </div>
              {ev.hallazgos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">{ev.hallazgos.map((h) => <Pill key={h.etiqueta} tono={h.estado === "normal" ? "neutral" : "red"}>{h.etiqueta}: {h.valor}</Pill>)}</div>
              )}
              {otrosSintomas.length > 0 && <p className="text-sm"><span className="font-semibold">Otros síntomas:</span> {otrosSintomas.join(", ")}</p>}
              {ev.faltantes.length > 0 && <p className="text-sm text-muted">Su perfil también pide: {ev.faltantes.map((f) => SIGNOS[f].nombre.toLowerCase()).join(", ")}. Puedes volver al paso 1.</p>}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="v-nota" className={label}>Nota para la familia (opcional)</label>
                <textarea id="v-nota" rows={2} className="resize-none rounded-xl border border-line p-3 text-[15px] outline-none focus:border-primario" value={nota} onChange={(e) => setNota(e.target.value)} />
              </div>
              <p className="text-xs text-muted">
                {fotos.length} foto(s) de evidencia · {tocoHistoria ? "historia clínica actualizada" : "historia sin cambios"} · {tocoServicios ? "servicios de salud actualizados" : "servicios sin cambios"}
              </p>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-5">
            {paso > 0 ? <button type="button" className={btnSecondary} onClick={() => setPaso(paso - 1)}>Atrás</button> : <Link href="/familia" className={btnSecondary}>Cancelar</Link>}
            {paso < PASOS.length - 1 ? (
              <button type="button" className={btnPrimary} onClick={() => setPaso(paso + 1)}>{paso === 3 || paso === 4 ? "Continuar" : "Siguiente"}</button>
            ) : (
              <button type="button" className={btnPrimary} disabled={procesando} onClick={guardar}>{procesando ? "Guardando…" : "Guardar y enviar al chat"}</button>
            )}
          </div>
        </section>
      </TechTag>

      {guia && GUIAS_MEDICAS.some((g) => g.id === guia) && <GuiaModal key={guia} id={guia} onCerrar={() => setGuia(null)} />}
    </>
  );
}

export default function ValoracionPage() {
  return (
    <RequiereFamilia>
      <Valoracion />
    </RequiereFamilia>
  );
}

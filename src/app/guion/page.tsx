"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/db";
import { CLAVE_DEMO } from "@/lib/seed";
import { Logo } from "@/components/Logo";
import { Avatar, btnPrimary, btnSecondary } from "@/components/ui";

// Guion de 3 minutos (versión 3): cada paso entra con la persona indicada (contraseña de ejemplo)
// y abre la pantalla, con datos ya cargados para no capturar en vivo.
const PASOS = [
  { b: "3 · De la familia a la comunidad (1:25–2:30)", t: "Nota de voz: vuelve a medir", quien: "5510000001", ruta: "/chat", seg: 20, dice: "«Mi mamá amaneció pálida y la presión salió en 90 sobre 60». Se confirma la transcripción; Respira compara con los umbrales de su médico: vuelve a medir en 15 minutos." },
  { b: "", t: "Si empeora: 911 y WhatsApp a toda la familia", quien: "5510000001", ruta: "/chat", seg: 15, dice: "«Vuelvo a medir: empeora» → alerta grave a pantalla completa: 911, WhatsApp, ficha y quién puede llegar." },
  { b: "", t: "El mapa de nodos se abre", quien: "5510000001", ruta: "/integrantes", seg: 15, dice: "«Ver cómo crece la red»: 3 familiares alrededor de Sara → Lupe, la vecina, y Ofelia, certificada a 10 min → don Luis por el banco de tiempo → Mi voz de Doreen." },
  { b: "", t: "Sara también cuida: banco de tiempo", quien: "5510000001", ruta: "/perfil", seg: 8, dice: "Un sábado acompañó a don Luis: esas 4 horas regresan a ella cuando necesita descansar." },
  { b: "", t: "Mi voz de Doreen", quien: "5510000005", ruta: "/mi-voz", seg: 10, dice: "Decide cómo quiere que la cuiden y aporta: les enseña a tejer a las nietas de la red." },
  { b: "4 · Lo que nadie más hace (2:30–2:55)", t: "Pasaporte de Cuidado de Sara", quien: "5510000001", ruta: "/pasaporte", seg: 25, dice: "Cada hora suma hasta el sello «Certificada CONOCER» («Seis meses después» lo completa). Tres íconos: una persona confirma, datos mínimos, la IA no diagnostica." },
  { b: "5 · Quién paga y el impacto (2:55–3:35)", t: "Quién paga", quien: "", ruta: "/impacto", seg: 40, dice: "Empresas, aseguradoras y gobiernos; nunca la familia ni la cuidadora. 30 mil familias, 6 millones de horas, $374 millones (caso base). Piloto de 100 cuidadoras." },
  { b: "6 · Cierre (3:35–4:00)", t: "La red de Doreen: de 3 a 14", quien: "5510000001", ruta: "/integrantes", seg: 15, dice: "Tras «Seis meses después»: Doreen camina 10 minutos al día, Sara está certificada, cotiza en el IMSS y cuida a dos vecinas. La red pasa de 3 a 14 personas." },
  { b: "Preguntas del jurado", t: "Límites y alcances", quien: "", ruta: "/respaldo", seg: 0, dice: "Respuestas cortas y dónde se ve cada respaldo en la app: la IA no diagnostica, datos, sin smartphone, NOM-035, IMSS, SIDECU, números y qué necesitamos." },
];

export default function Guion() {
  const { db, iniciarSesion, reiniciarDemo, simularSeisMeses } = useData();
  const router = useRouter();
  const abrir = async (tel: string, ruta: string) => {
    if ((await iniciarSesion(tel, CLAVE_DEMO, true)) === "ok") router.push(ruta);
  };

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Guion de presentación</h1>
          <p className="text-sm text-muted">Bloques 3 a 6 del speech · caso Newman con datos de ejemplo ya cargados · ten listo el video de respaldo de 60 s del bloque 3</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={reiniciarDemo}>Reiniciar caso de ejemplo</button>
          <button type="button" className={btnSecondary} onClick={simularSeisMeses}>Seis meses después</button>
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {PASOS.map((p, i) => {
          const u = db.usuarios.find((x) => x.telefono === p.quien);
          return (
            <li key={p.t} className="flex flex-col gap-2">
              {p.b && <span className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{p.b}</span>}
              <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 md:flex-row md:items-center">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primario text-sm font-semibold text-white">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold">{p.t} {p.seg > 0 && <span className="text-xs font-normal text-muted">~{p.seg} s</span>}</span>
                <span className="text-sm text-ink-2">{p.dice}</span>
              </div>
              {u ? (
                <button type="button" onClick={() => abrir(p.quien, p.ruta)} className={`${btnPrimary} shrink-0`}>
                  <Avatar nombre={u.nombre} tono={u.tono} size={24} />
                  Entrar como {u.nombre.split(" ")[0]}
                </button>
              ) : (
                <Link href={p.ruta} className={`${btnPrimary} shrink-0`}>Abrir</Link>
              )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">
        Caso: doña Doreen Newman, 82 años, Iztapalapa. Familia: Sara (hija, cuidadora principal), Karla (sobrina), Mariana y Diego (nietos). En la red cercana: Lupe (vecina de enfrente), Ofelia (cuidadora certificada a 10 minutos) y don Luis (vecino de al lado, banco de tiempo). Las cuentas de ejemplo usan la contraseña <span className="font-mono">{CLAVE_DEMO}</span>. Abre el guion en una pestaña y cada paso en otra: los datos se comparten entre pestañas del mismo navegador. Activa «Capa técnica» para mostrar qué respalda cada pantalla.
      </p>
    </div>
  );
}

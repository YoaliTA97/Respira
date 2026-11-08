import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Límites y alcances · Respira" };

// Respaldo para las preguntas del jurado: qué hace y qué no hace Respira, el respaldo técnico
// (seguridad, datos, normas y certificaciones) y dónde se ve en la app. Separa lo que la demo hace
// hoy de lo que tendrá el piloto, para no prometer lo que aún no existe.

const LIMITES = [
  { t: "No diagnostica ni da tratamiento", d: "Compara con los umbrales que indicó su médico; sin ellos solo aplica banderas rojas generales y lo avisa." },
  { t: "Una persona confirma cada registro", d: "La transcripción de la nota de voz se revisa y confirma antes de guardarse; otra persona puede confirmar la evidencia." },
  { t: "Ante la duda, sube de nivel", d: "Vuelve a revisar en 15 min; si se repite o empeora, alerta grave con 911 y WhatsApp a toda la familia." },
  { t: "No reemplaza a los expertos", d: "Respira organiza y orienta; los médicos, enfermeras y servicios de urgencia deciden." },
  { t: "Registrar no es certificar", d: "Las horas y tutoriales no habilitan por sí solos para cobrar: la certificación la otorga una entidad del CONOCER." },
  { t: "Inyecciones y curaciones: solo familia", d: "Como servicio pagado corresponden a enfermería con cédula; en Respira se contratan como enfermería." },
];

// Seguridad y datos: lo que ya hace la demo y lo que tendrá el piloto
const SEGURIDAD: { tema: string; hoy: string; piloto: string }[] = [
  { tema: "Contraseñas", hoy: "PBKDF2-SHA256 con 100,000 iteraciones y sal aleatoria de 128 bits; nunca se guarda la contraseña en claro. Comparación en tiempo constante.", piloto: "Supabase Auth con verificación por código (WhatsApp/SMS) y segundo factor opcional." },
  { tema: "Acceso a la cuenta", hoy: "Bloqueo de 5 minutos tras 5 intentos fallidos; «recordarme» opcional que vence a las 12 horas; cerrar sesión borra la sesión recordada.", piloto: "Sesiones con vencimiento y cierre de sesión remoto si se pierde el teléfono." },
  { tema: "Cifrado en tránsito", hoy: "HTTPS en el sitio publicado.", piloto: "TLS en todas las conexiones (app, base de datos, WhatsApp, IA)." },
  { tema: "Cifrado en reposo", hoy: "La demo guarda datos de ejemplo en el navegador; no hay datos reales.", piloto: "Base de datos en Supabase cifrada con AES-256; los campos de salud y documentos (voluntad anticipada) con cifrado adicional en la aplicación." },
  { tema: "Quién ve qué", hoy: "Permisos por rol en el espacio familiar; la persona mayor decide quién ve su historial y puede borrarlo. La red solo ve un perfil público, nunca la dirección.", piloto: "Las mismas reglas en la base de datos (Row Level Security por membresía), no solo en la pantalla." },
  { tema: "Bitácora", hoy: "Cada registro guarda quién y cuándo; la evidencia la confirma otra persona.", piloto: "Bitácora de accesos (quién vio o cambió qué) para auditoría." },
  { tema: "Claves de servicios", hoy: "Las llaves de la IA y de WhatsApp viven solo en el servidor, nunca en el navegador.", piloto: "Gestión de secretos del proveedor y rotación periódica." },
  { tema: "Datos mínimos", hoy: "Teléfono como identificador; ubicación aproximada (colonia o alcaldía); todo lo demás es voluntario.", piloto: "Evaluación de impacto de privacidad antes del piloto; retención y borrado definidos." },
];

const NORMAS: { n: string; para: string; estado: string }[] = [
  { n: "LFPDPPP (DOF 20/03/2025)", para: "Los datos de salud son sensibles: consentimiento expreso, aviso de privacidad y derechos ARCO (acceso, rectificación, cancelación, oposición). Autoridad: Secretaría Anticorrupción y Buen Gobierno.", estado: "Diseñado para cumplir; aviso integral por validar con asesoría legal" },
  { n: "CONOCER EC0669 y EC1209.01", para: "Certificación oficial de las cuidadoras: cuidado básico de la persona adulta mayor en domicilio y autocuidado de la persona cuidadora.", estado: "Ruta en la app; evaluación con entidad acreditada (por confirmar)" },
  { n: "NOM-004-SSA3-2012", para: "Expediente clínico. Respira no es un expediente clínico: es una bitácora de cuidado en casa.", estado: "Fuera de alcance (deliberado)" },
  { n: "NOM-024-SSA3-2012", para: "Sistemas de información de registro electrónico para la salud: interoperabilidad y seguridad, si se conecta con clínicas.", estado: "Referencia para integraciones futuras" },
  { n: "NOM-019-SSA3-2013", para: "Práctica de enfermería: marca el límite entre cuidado básico y procedimientos que requieren cédula.", estado: "Aplicado en la Ruta A/B (por validar)" },
  { n: "NOM-035-STPS-2018", para: "Riesgos psicosociales en el trabajo: argumento para que las empresas ofrezcan Respira como prestación.", estado: "Modelo de negocio" },
  { n: "OWASP Top 10 / ASVS", para: "Guía de desarrollo seguro para aplicaciones web.", estado: "Referencia de desarrollo" },
  { n: "WCAG 2.1 AA", para: "Accesibilidad: tipografía para baja visión, texto mínimo de 14 px, contraste, uso por voz y por WhatsApp.", estado: "Objetivo de diseño" },
];

const PROVEEDORES: { p: string; uso: string; respaldo: string }[] = [
  { p: "Supabase (PostgreSQL)", uso: "Base de datos, autenticación y archivos en el piloto", respaldo: "Cifrado AES-256 en reposo y TLS en tránsito; SOC 2 Tipo 2; HIPAA con contrato (BAA) en planes Team o Enterprise." },
  { p: "Anthropic (Claude)", uso: "Redacción de respuestas y extracción de la nota de voz", respaldo: "ISO 27001:2022, ISO/IEC 42001:2023 (gestión de IA) y SOC 2 Tipo II. Con la API comercial no entrena con los datos por defecto." },
  { p: "Twilio (WhatsApp)", uso: "Alertas y avisos por WhatsApp", respaldo: "API oficial de WhatsApp Business; certificaciones por confirmar en el contrato." },
  { p: "Netlify", uso: "Publicación de la app web", respaldo: "HTTPS automático." },
];

const TECNICAS: { p: string; r: string }[] = [
  { p: "¿Cómo protegen la información de salud?", r: "Por capas: datos mínimos y voluntarios, consentimiento expreso de la persona mayor, permisos por rol y por persona, cifrado en tránsito y en reposo, contraseña con hash y bloqueo por intentos, y bitácora de quién registra y confirma." },
  { p: "¿Los datos están cifrados?", r: "Hoy: contraseñas con PBKDF2 y sitio con HTTPS; la demo usa datos de ejemplo en el navegador. En el piloto: base de datos cifrada con AES-256, TLS en todo y cifrado adicional para campos de salud y documentos." },
  { p: "¿Qué ley aplica y cómo la cumplen?", r: "La LFPDPPP de 2025. Los datos de salud son sensibles: pedimos consentimiento expreso, damos aviso de privacidad, respetamos los derechos ARCO (la persona mayor puede ver, corregir, retirar permisos y borrar) y no vendemos datos." },
  { p: "¿Tienen alguna certificación?", r: "Respira todavía no tiene certificaciones propias: es un piloto. Nos apoyamos en proveedores certificados (Supabase SOC 2 Tipo 2; Anthropic ISO 27001, ISO 42001 y SOC 2 Tipo II), desarrollamos con OWASP y la ruta es ISO 27001 al escalar. La certificación de las cuidadoras es oficial: CONOCER EC0669." },
  { p: "¿La IA aprende con los datos de las familias?", r: "No. Con la API comercial de Anthropic los datos no se usan para entrenar por defecto, y no usamos datos de salud para entrenar modelos sin un consentimiento aparte. En el piloto se envía lo mínimo y seudonimizado." },
  { p: "¿Qué pasa si la IA falla o no hay internet?", r: "Las banderas rojas son reglas fijas que corren antes del modelo: si la IA no responde, la respuesta sale de las reglas. El modelo nunca baja el nivel de una alerta. El mapa funciona sin conexión y la familia siempre puede llamar al 911." },
  { p: "¿Es un expediente clínico?", r: "No. Es una bitácora de cuidado en casa que la familia puede compartir con su médico. Si se integra con clínicas, seguiríamos la NOM-024 de interoperabilidad y seguridad." },
  { p: "¿Quién puede ver qué?", r: "Solo los integrantes que la familia invita, según su rol. La persona mayor decide quién ve su historial. La red de cuidado ve un perfil público con calificaciones, nunca la dirección ni el expediente." },
  { p: "¿Y si roban o pierden un teléfono?", r: "La cuenta pide contraseña, se bloquea tras intentos fallidos y la sesión recordada vence. En el piloto los datos viven en el servidor, no en el teléfono, y se puede cerrar la sesión a distancia." },
  { p: "¿Cómo validan que la IA no se equivoque?", r: "Reglas revisables, confirmación humana de cada registro, revisión semanal de una enfermera aliada y pruebas de transcripción con acentos regionales, voces de personas mayores y lenguas indígenas antes de escalar." },
];

const PREGUNTAS: { p: string; r: string; ver: { t: string; href: string }[] }[] = [
  {
    p: "¿Y si la IA se equivoca con una alerta?",
    r: "No diagnostica. Las banderas rojas son reglas fijas y revisables; ante la duda se escala (vuelve a revisar → alerta grave), y una enfermera aliada revisa cada semana las recomendaciones. La familia siempre puede llamar al 911 directo.",
    ver: [{ t: "Reglas en el mapa técnico", href: "/tecnico" }, { t: "Revisión semanal (seguimiento)", href: "/seguimiento" }, { t: "Botón de pánico y 911", href: "/familia" }],
  },
  {
    p: "¿Cómo protegen los datos de salud?",
    r: "Aviso de privacidad simple, datos mínimos y voluntarios, consentimiento de la persona mayor, permisos por familiar, cifrado y derecho a borrar. No vendemos datos.",
    ver: [{ t: "Respaldo técnico", href: "#tecnico" }, { t: "Mi voz: consentimiento, permisos y borrar", href: "/mi-voz" }, { t: "Inicio de sesión seguro", href: "/login" }],
  },
  {
    p: "¿Qué pasa con quien no tiene smartphone o no sabe usar apps?",
    r: "Todo funciona por voz y por WhatsApp; las promotoras del DIF pueden hacer el registro asistido.",
    ver: [{ t: "Nota de voz", href: "/chat" }, { t: "Alta guiada de la familia", href: "/nueva-familia" }],
  },
  {
    p: "¿Por qué pagaría una empresa?",
    r: "Una empleada que cuida falta, rinde menos o renuncia. El servicio es una prestación que ayuda a retenerla y a cumplir la NOM-035 (riesgos psicosociales, incluida la interferencia entre el trabajo y la familia).",
    ver: [{ t: "Quién paga y el impacto", href: "/impacto" }],
  },
  {
    p: "¿Las cuidadoras son trabajadoras del hogar?",
    r: "No. En el caso base cotizan como trabajadoras independientes y la app aparta en automático su cuota del IMSS. Estamos validando si aplica el régimen de plataformas digitales; si aplica, el modelo lo absorbe con un cargo de ~30%.",
    ver: [{ t: "Pasaporte de Cuidado", href: "/pasaporte" }, { t: "CV con apartado IMSS", href: "/cv" }],
  },
  {
    p: "¿En qué se distinguen del sistema de cuidados del gobierno?",
    r: "Lo complementamos. SIDECU es un directorio; Respira acompaña a la familia todos los días y la conecta con esos servicios.",
    ver: [{ t: "Alertas con enlace a SIDECU", href: "/alertas" }, { t: "Radio de cuidado", href: "/red" }],
  },
  {
    p: "¿Qué tan realistas son sus números?",
    r: "Son un caso base con supuestos explícitos. Con la mitad de la adopción, el equilibrio llega en el año 5. Por eso el primer paso es un piloto de 100 cuidadoras que mida todo.",
    ver: [{ t: "Indicadores del piloto", href: "/familia" }],
  },
  {
    p: "¿Qué necesitan hoy?",
    r: "Una alcaldía aliada para el piloto, 3 a 5 empresas dispuestas a probar el servicio y fondos no reembolsables por ~3.4 millones de pesos.",
    ver: [{ t: "Quién paga y el impacto", href: "/impacto" }],
  },
];

const FUENTES = [
  { t: "Nueva LFPDPPP (DOF 20/03/2025), resumen de EY", href: "https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares" },
  { t: "Nueva LFPDPPP, Garrigues", href: "https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce" },
  { t: "Seguridad en Supabase", href: "https://supabase.com/security" },
  { t: "Certificaciones de Anthropic", href: "https://privacy.anthropic.com/ja/articles/10015870-anthropicはどのような認証を取得していますか" },
];

export default function Respaldo() {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-semibold tracking-tight">Límites, alcances y respaldo técnico</h1>
        <p className="text-muted">Lo que Respira hace, lo que no hace, cómo protege los datos y dónde se ve en la app.</p>
        <nav className="flex flex-wrap gap-2 text-sm">
          {[["#limites", "Límites"], ["#tecnico", "Seguridad y datos"], ["#normas", "Normas y certificaciones"], ["#tecnicas", "Preguntas técnicas"], ["#jurado", "Preguntas del jurado"]].map(([h, t]) => (
            <a key={h} href={h} className="rounded-full border border-line bg-white px-3 py-1 font-semibold text-primario hover:border-primario">{t}</a>
          ))}
        </nav>
      </div>

      <section id="limites" className="grid scroll-mt-6 gap-3 md:grid-cols-3">
        {LIMITES.map((l) => (
          <div key={l.t} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
            <span className="font-semibold">{l.t}</span>
            <span className="text-sm text-muted">{l.d}</span>
          </div>
        ))}
      </section>

      <section id="tecnico" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Seguridad y datos: hoy en la demo y en el piloto</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Tema</th>
                <th className="px-4 py-2.5 font-medium">Hoy en la demo</th>
                <th className="px-4 py-2.5 font-medium">En el piloto</th>
              </tr>
            </thead>
            <tbody>
              {SEGURIDAD.map((x) => (
                <tr key={x.tema} className="border-b border-line-soft align-top last:border-0">
                  <td className="px-4 py-3 font-semibold">{x.tema}</td>
                  <td className="px-4 py-3 text-ink-2">{x.hoy}</td>
                  <td className="px-4 py-3 text-ink-2">{x.piloto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {PROVEEDORES.map((p) => (
            <div key={p.p} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
              <span className="font-semibold">{p.p}</span>
              <span className="text-xs text-muted">{p.uso}</span>
              <span className="text-sm text-ink-2">{p.respaldo}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="normas" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Normas y certificaciones</h2>
        <ul className="flex flex-col divide-y divide-line-soft rounded-2xl border border-line bg-white">
          {NORMAS.map((x) => (
            <li key={x.n} className="grid gap-1 p-4 text-sm md:grid-cols-[220px_1fr_220px] md:gap-4">
              <span className="font-semibold">{x.n}</span>
              <span className="text-ink-2">{x.para}</span>
              <span className="text-xs text-muted md:text-right">{x.estado}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">Respira aún no tiene certificaciones propias (es un piloto): se apoya en proveedores certificados y la ruta al escalar es ISO 27001.</p>
      </section>

      <section id="tecnicas" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Preguntas técnicas</h2>
        {TECNICAS.map((q) => (
          <details key={q.p} className="rounded-2xl border border-line bg-white p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none font-semibold">{q.p}</summary>
            <p className="mt-2 text-[15px] text-ink-2">{q.r}</p>
          </details>
        ))}
      </section>

      <section id="jurado" className="flex scroll-mt-6 flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Preguntas probables del jurado</h2>
        {PREGUNTAS.map((q) => (
          <details key={q.p} className="rounded-2xl border border-line bg-white p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none font-semibold">{q.p}</summary>
            <p className="mt-2 text-[15px] text-ink-2">{q.r}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.ver.map((v) =>
                v.href.startsWith("#") ? (
                  <a key={v.href + v.t} href={v.href} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primario hover:border-primario">{v.t}</a>
                ) : (
                  <Link key={v.href + v.t} href={v.href} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-primario hover:border-primario">{v.t}</Link>
                ),
              )}
            </div>
          </details>
        ))}
      </section>

      <section className="flex flex-col gap-1 text-xs text-muted">
        <p>Cifras de INEGI (31.7 millones de personas que cuidan, 75% mujeres, 23.9% del PIB, 19.2 millones de personas de 60+, 77.6% sin cuidados en su hogar) son datos. Las del modelo (año 4, 30 mil familias, 374 millones) son proyecciones del caso base. Doreen y Sara son un caso ilustrativo.</p>
        <p>
          Fuentes:{" "}
          {FUENTES.map((f, i) => (
            <span key={f.href}>
              {i > 0 && " · "}
              <a href={f.href} target="_blank" rel="noopener noreferrer" className="underline">{f.t}</a>
            </span>
          ))}
          . Las certificaciones de proveedores se confirman en sus portales de confianza antes de firmar contratos.
        </p>
      </section>
    </div>
  );
}

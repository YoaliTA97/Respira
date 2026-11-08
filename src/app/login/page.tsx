"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CODIGO_DEMO, useData, type ResultadoAcceso } from "@/lib/db";
import { familiasDe } from "@/lib/calculos";
import { CLAVE_DEMO, FAMILIA_DEMO } from "@/lib/seed";
import { ROL_TEXTO } from "@/lib/types";
import { telefonoLimpio } from "@/lib/catalogos";
import { problemaClave } from "@/lib/clave";
import { emitirDemo } from "@/lib/demo";
import { Logo } from "@/components/Logo";
import { TechTag } from "@/components/TechTag";
import { Avatar, btnPrimary, btnSecondary, input, label } from "@/components/ui";

const MENSAJE: Record<Exclude<ResultadoAcceso, "ok">, string> = {
  "no-existe": "No encontramos ese teléfono. Revisa el número o crea una cuenta.",
  "sin-clave": "Esta cuenta aún no tiene contraseña: créala con el código de verificación.",
  error: "La contraseña no es correcta.",
  bloqueada: "Demasiados intentos. Espera unos minutos antes de volver a intentar.",
  codigo: "El código de verificación no es correcto.",
};

export default function Login() {
  const { db, iniciarSesion, crearClave, minutosBloqueo, reiniciarDemo, borrarTodo } = useData();
  const router = useRouter();
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [ver, setVer] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState({ a: "", b: "" });
  const [recordar, setRecordar] = useState(true);
  const [paso, setPaso] = useState<"telefono" | "clave" | "crear">("telefono");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const tel = telefono.replace(/\D/g, "");
  const cuenta = db.usuarios.find((u) => u.telefono === tel);
  const demoFamilia = db.membresias.filter((m) => m.familiaId === FAMILIA_DEMO && m.estado === "activa").map((m) => ({ m, u: db.usuarios.find((u) => u.id === m.usuarioId)! })).filter((x) => x.u);
  const SEMILLA = new Set(db.usuarios.filter((u) => u.telefono.startsWith("551000000")).map((u) => u.id));
  const demoRed = db.usuarios.filter((u) => SEMILLA.has(u.id) && u.ofreceAyuda.activo && !demoFamilia.some((x) => x.u.id === u.id));
  const otras = db.usuarios.filter((u) => !SEMILLA.has(u.id) && (u.alcaldia !== "" || db.membresias.some((m) => m.usuarioId === u.id)));
  const destino = (uId: string) => familiasDe(db, uId).map((f) => f.familia.nombre).join(", ");

  const continuar = () => {
    if (!cuenta) return setError(MENSAJE["no-existe"]);
    setError("");
    setPaso(cuenta.clave ? "clave" : "crear");
  };
  const resultado = (r: ResultadoAcceso) => {
    if (r === "ok") router.push("/inicio");
    else {
      setError(r === "bloqueada" ? `${MENSAJE.bloqueada} (${minutosBloqueo(tel)} min)` : MENSAJE[r]);
      if (r === "sin-clave") setPaso("crear");
    }
  };
  const entrar = async (t = tel, c = clave, rec = recordar) => {
    setOcupado(true);
    resultado(await iniciarSesion(t, c, rec));
    setOcupado(false);
  };
  const guardarNueva = async () => {
    const p = problemaClave(nueva.a);
    if (p) return setError(p);
    if (nueva.a !== nueva.b) return setError("Las contraseñas no coinciden.");
    setOcupado(true);
    resultado(await crearClave(tel, codigo, nueva.a, recordar));
    setOcupado(false);
  };

  const recordarCasilla = (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <input type="checkbox" className="h-4 w-4 accent-primario" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
      Recordarme en este dispositivo (12 horas)
    </label>
  );
  const cuentaDemo = (u: (typeof db.usuarios)[number], sub: string) => (
    <button key={u.id} type="button" disabled={ocupado} onClick={() => entrar(u.telefono, CLAVE_DEMO, true)} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left hover:border-primario">
      <Avatar nombre={u.nombre} tono={u.tono} size={32} />
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold">{u.nombre}</span>
        <span className="text-xs text-muted">{sub}</span>
      </span>
    </button>
  );

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10 md:items-center">
      <div className="grid w-full max-w-[920px] gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-xl font-bold tracking-tight">respira</span>
          </Link>
          <TechTag k="acceso">
            <form
              className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (paso === "telefono") continuar();
                else if (paso === "clave") void entrar();
                else void guardarNueva();
              }}
            >
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{paso === "crear" ? (cuenta?.clave ? "Recupera tu contraseña" : "Crea tu contraseña") : "Iniciar sesión"}</h1>
                <p className="mt-1 text-sm text-muted">
                  {paso === "telefono" ? "Entra con tu teléfono y tu contraseña." : paso === "clave" ? `Hola, ${cuenta?.nombre.split(" ")[0]}. Escribe tu contraseña.` : "Te enviamos un código por WhatsApp para verificar que eres tú."}
                </p>
              </div>

              {paso === "telefono" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tel" className={label}>Teléfono celular</label>
                  <input id="tel" inputMode="tel" autoComplete="username" placeholder="10 dígitos" className={input} value={telefono} onChange={(e) => setTelefono(telefonoLimpio(e.target.value))} />
                </div>
              )}

              {paso === "clave" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="clave" className={label}>Contraseña</label>
                    <div className="flex gap-2">
                      <input id="clave" type={ver ? "text" : "password"} autoComplete="current-password" className={input} value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
                      <button type="button" className={btnSecondary} onClick={() => setVer(!ver)}>{ver ? "Ocultar" : "Ver"}</button>
                    </div>
                  </div>
                  {recordarCasilla}
                </>
              )}

              {paso === "crear" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cod" className={label}>Código de verificación</label>
                    <input id="cod" inputMode="numeric" autoComplete="one-time-code" className={input} value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    <p className="text-xs text-muted">Versión de prueba: el código es {CODIGO_DEMO}.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="n1" className={label}>Nueva contraseña</label>
                    <input id="n1" type={ver ? "text" : "password"} autoComplete="new-password" className={input} value={nueva.a} onChange={(e) => setNueva({ ...nueva, a: e.target.value })} />
                    <span className="text-xs text-muted">Al menos 8 caracteres, con letras y números.</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="n2" className={label}>Repítela</label>
                    <input id="n2" type={ver ? "text" : "password"} autoComplete="new-password" className={input} value={nueva.b} onChange={(e) => setNueva({ ...nueva, b: e.target.value })} />
                  </div>
                  {recordarCasilla}
                </>
              )}

              {error && <p role="alert" className="text-sm text-red-ink">{error}</p>}
              <button type="submit" className={btnPrimary} disabled={ocupado || (paso === "telefono" ? tel.length < 10 : paso === "clave" ? !clave : !codigo || !nueva.a)}>
                {ocupado ? "Verificando…" : paso === "telefono" ? "Continuar" : paso === "clave" ? "Entrar" : "Guardar y entrar"}
              </button>
              {paso !== "telefono" && (
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <button type="button" className="text-muted underline" onClick={() => { setPaso("telefono"); setError(""); setClave(""); }}>Cambiar teléfono</button>
                  {paso === "clave" && <button type="button" className="text-muted underline" onClick={() => { setPaso("crear"); setError(""); }}>¿Olvidaste tu contraseña?</button>}
                </div>
              )}
            </form>
          </TechTag>
          <p className="text-sm text-muted">
            ¿Primera vez? <Link href="/registro" className="font-semibold text-ink underline">Crea tu cuenta</Link>
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white/60 p-5">
          <div>
            <p className="font-semibold">Caso de ejemplo</p>
            <p className="text-xs leading-relaxed text-muted">Familia Newman, Iztapalapa: doña Doreen, 82 años, con hipertensión, diabetes y una caída hace 3 días. La cuida su hija Sara con su sobrina Karla y sus nietos Mariana y Diego; En la red: Lupe, la vecina de enfrente; Ofelia, cuidadora certificada a 10 minutos; y don Luis, el vecino de al lado. Las cuentas de ejemplo usan la contraseña <span className="font-mono font-semibold">{CLAVE_DEMO}</span>; un toque entra con ella.</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Espacio familiar</p>
          {demoFamilia.map(({ m, u }) => cuentaDemo(u, `${m.parentesco} · ${ROL_TEXTO[m.rol].t}${m.principal ? " · recibe alertas" : ""}`))}
          {demoRed.length > 0 && (
            <>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Puede relevarlos (fuera del espacio familiar)</p>
              {demoRed.map((u) => cuentaDemo(u, u.bio || "Ofrece relevos en la red"))}
            </>
          )}
          {otras.length > 0 && (
            <>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Cuentas creadas en este navegador</p>
              {otras.map((u) => (
                <button key={u.id} type="button" onClick={() => { setTelefono(u.telefono); setError(""); setPaso(u.clave ? "clave" : "crear"); }} className="rounded-xl border border-line bg-white px-3 py-2 text-left text-sm hover:border-primario">
                  {u.nombre} <span className="text-muted">· {destino(u.id) || "sin espacio familiar"}</span>
                </button>
              ))}
            </>
          )}
          <p className="mt-1 text-xs leading-relaxed text-muted">Lo que registras se guarda en este navegador: puedes cerrar sesión, recargar o cerrar la pestaña y tus datos siguen aquí.</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <button type="button" onClick={() => emitirDemo("iniciar")} className="font-semibold text-primario underline">▶ Demo automática</button>
            <Link href="/guion" className="font-semibold text-ink underline">Guion de presentación (3 min)</Link>
            <button type="button" onClick={reiniciarDemo} className="text-muted underline">Reiniciar caso de ejemplo</button>
            <button type="button" onClick={() => { if (window.confirm("Se borra todo lo creado en este navegador y queda solo el caso de ejemplo. ¿Continuar?")) borrarTodo(); }} className="text-muted underline">Dejar solo el caso de ejemplo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

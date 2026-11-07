"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CODIGO_DEMO, useData } from "@/lib/db";
import { familiasDe } from "@/lib/calculos";
import { FAMILIA_DEMO } from "@/lib/seed";
import { ROL_TEXTO } from "@/lib/types";
import { telefonoLimpio } from "@/lib/catalogos";
import { Logo } from "@/components/Logo";
import { TechTag } from "@/components/TechTag";
import { Avatar, btnPrimary, input, label } from "@/components/ui";

export default function Login() {
  const { db, iniciarSesion, reiniciarDemo } = useData();
  const router = useRouter();
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"telefono" | "codigo">("telefono");
  const [error, setError] = useState("");

  const demoFamilia = db.membresias.filter((m) => m.familiaId === FAMILIA_DEMO && m.estado === "activa").map((m) => ({ m, u: db.usuarios.find((u) => u.id === m.usuarioId)! })).filter((x) => x.u);
  const demoRed = db.usuarios.filter((u) => u.ofreceAyuda.activo && ["u-lupita", "u-chela", "u-teresa"].includes(u.id));
  const SEMILLA = new Set(["u-rosa", "u-jorge", "u-mariana", "u-lupita", "u-chela", "u-teresa", "u-alberto", "u-guadalupe"]);
  const otras = db.usuarios.filter((u) => !SEMILLA.has(u.id) && u.alcaldia !== "");

  const pedirCodigo = () => {
    if (!db.usuarios.some((u) => u.telefono === telefono.replace(/\D/g, ""))) {
      setError("No encontramos ese teléfono. Revisa el número o crea una cuenta.");
      return;
    }
    setError("");
    setPaso("codigo");
  };
  const entrar = (tel = telefono, cod = codigo) => {
    if (iniciarSesion(tel, cod)) router.push("/inicio");
    else setError("El código no es correcto.");
  };
  const destino = (uId: string) => familiasDe(db, uId).map((f) => f.familia.nombre).join(", ");

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-10 md:items-center">
      <div className="grid w-full max-w-[920px] gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-display text-xl font-bold tracking-tight">respira</span>
          </Link>
          <TechTag k="acceso">
            <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
                <p className="mt-1 text-sm text-muted">Te enviamos un código a tu teléfono.</p>
              </div>
              {paso === "telefono" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tel" className={label}>Teléfono celular</label>
                    <input id="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos" className={input} value={telefono} onChange={(e) => setTelefono(telefonoLimpio(e.target.value))} onKeyDown={(e) => e.key === "Enter" && pedirCodigo()} />
                  </div>
                  <button type="button" className={btnPrimary} onClick={pedirCodigo} disabled={telefono.replace(/\D/g, "").length < 10}>Enviar código</button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cod" className={label}>Código de 6 dígitos</label>
                    <input id="cod" inputMode="numeric" autoComplete="one-time-code" className={input} value={codigo} onChange={(e) => setCodigo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} />
                    <p className="text-xs text-muted">Versión de prueba: el código es {CODIGO_DEMO}.</p>
                  </div>
                  <button type="button" className={btnPrimary} onClick={() => entrar()}>Entrar</button>
                  <button type="button" className="text-sm text-muted" onClick={() => setPaso("telefono")}>Cambiar teléfono</button>
                </>
              )}
              {error && <p role="alert" className="text-sm text-red-ink">{error}</p>}
            </div>
          </TechTag>
          <p className="text-sm text-muted">
            ¿Primera vez? <Link href="/registro" className="font-semibold text-ink underline">Crea tu cuenta</Link>
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-white/60 p-5">
          <div>
            <p className="font-semibold">Cuentas de ejemplo</p>
            <p className="text-xs leading-relaxed text-muted">Familia Hernández: Lucía, 78 años, con diabetes y una caída hace 3 días. Abre otra pestaña para entrar como otra persona; los datos se comparten entre pestañas.</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Espacio familiar</p>
          {demoFamilia.map(({ m, u }) => (
            <button key={u.id} type="button" onClick={() => entrar(u.telefono, CODIGO_DEMO)} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left hover:border-primario">
              <Avatar nombre={u.nombre} tono={u.tono} size={32} />
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">{u.nombre}</span>
                <span className="text-xs text-muted">{m.parentesco} · {ROL_TEXTO[m.rol].t}{m.principal ? " · recibe alertas" : ""}</span>
              </span>
            </button>
          ))}
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Red de cuidado (sin acceso al espacio familiar)</p>
          {demoRed.map((u) => (
            <button key={u.id} type="button" onClick={() => entrar(u.telefono, CODIGO_DEMO)} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-left hover:border-primario">
              <Avatar nombre={u.nombre} tono={u.tono} size={32} />
              <span className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">{u.nombre}</span>
                <span className="text-xs text-muted">{u.bio || "Ofrece relevos en la red"}</span>
              </span>
            </button>
          ))}
          {otras.length > 0 && (
            <>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted">Cuentas creadas en este navegador</p>
              {otras.map((u) => (
                <button key={u.id} type="button" onClick={() => entrar(u.telefono, CODIGO_DEMO)} className="rounded-xl border border-line bg-white px-3 py-2 text-left text-sm hover:border-primario">
                  {u.nombre} <span className="text-muted">· {destino(u.id) || "sin espacio familiar"}</span>
                </button>
              ))}
            </>
          )}
          <button type="button" onClick={reiniciarDemo} className="mt-1 self-start text-xs text-muted underline">Reiniciar datos de ejemplo</button>
        </div>
      </div>
    </div>
  );
}

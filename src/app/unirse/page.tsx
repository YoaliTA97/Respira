"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/lib/db";
import { PARENTESCOS, telefonoLimpio } from "@/lib/catalogos";
import { ROL_TEXTO, type Usuario } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { TechTag } from "@/components/TechTag";
import { Avatar, Pill, Segmentado, btnPrimary, btnSecondary, input, label } from "@/components/ui";

// Entrada por QR o por el enlace de la invitación. En la demo se elige el perfil; con backend,
// la persona confirma con un código que le llega por WhatsApp a su teléfono.
function Unirse() {
  const { db, usuario, unirseConCodigo } = useData();
  const router = useRouter();
  const q = useSearchParams();
  const [codigo, setCodigo] = useState((q.get("c") ?? "").toUpperCase());
  const [escrito, setEscrito] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", telefono: "", parentesco: "", genero: "mujer" as Usuario["genero"] });
  const [otro, setOtro] = useState(false);
  const sugerido = q.get("u");

  const fam = db.familias.find((f) => f.codigo && f.codigo.toUpperCase() === codigo);
  const pac = fam ? db.pacientes.find((p) => p.familiaId === fam.id) : null;
  const personas = fam
    ? db.membresias
        .filter((m) => m.familiaId === fam.id)
        .map((m) => ({ m, u: db.usuarios.find((u) => u.id === m.usuarioId)! }))
        .filter((x) => x.u)
        .sort((a, b) => (a.u.id === sugerido ? -1 : b.u.id === sugerido ? 1 : 0))
    : [];
  const entrar = (como: Parameters<typeof unirseConCodigo>[1]) => {
    if (unirseConCodigo(codigo, como)) router.push("/familia");
  };
  const telNuevo = nuevo.telefono.replace(/\D/g, "");
  const yaExiste = telNuevo.length === 10 && db.usuarios.find((u) => u.telefono === telNuevo);

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col gap-5 px-4 py-8">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="font-display text-xl font-bold tracking-tight">respira</span>
      </Link>

      <TechTag k="union-qr">
        <section className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-6">
          {!fam ? (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Unirte a un espacio familiar</h1>
                <p className="mt-1 text-sm text-muted">Escanea el QR que te compartieron o escribe el código de la familia.</p>
              </div>
              {codigo && <p role="alert" className="rounded-xl bg-amber-bg p-3 text-sm text-amber-ink">No encontramos el código {codigo} en este dispositivo. En la demo los datos viven en cada navegador: el QR funciona con la familia de ejemplo o en el mismo equipo donde se creó el espacio.</p>}
              <div className="flex gap-2">
                <input aria-label="Código de la familia" className={`${input} uppercase`} placeholder="Ej. HRN482" value={escrito} onChange={(e) => setEscrito(e.target.value.toUpperCase())} />
                <button type="button" className={btnPrimary} disabled={escrito.trim().length < 4} onClick={() => setCodigo(escrito.trim())}>Buscar</button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Te invitan a</span>
                <h1 className="text-2xl font-semibold tracking-tight">{fam.nombre}</h1>
                {pac && <span className="text-sm text-muted">Cuidado de {pac.nombre}, {pac.edad} años · código {fam.codigo}</span>}
              </div>

              {usuario && personas.some((x) => x.u.id === usuario.id) && (
                <button type="button" className={btnPrimary} onClick={() => entrar({ usuarioId: usuario.id })}>Entrar como {usuario.nombre}</button>
              )}

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">¿Quién eres?</span>
                <ul className="flex flex-col gap-2">
                  {personas.map(({ m, u }) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => entrar({ usuarioId: u.id })}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left hover:border-primario ${u.id === sugerido ? "border-primario bg-realce/50" : "border-line"}`}
                      >
                        <Avatar nombre={u.nombre} tono={u.tono} size={38} />
                        <span className="flex flex-1 flex-col">
                          <span className="font-semibold">{u.nombre}</span>
                          <span className="text-sm text-muted">{m.parentesco} · {ROL_TEXTO[m.rol].t}</span>
                        </span>
                        {m.estado === "invitada" && <Pill tono="amber">Invitación pendiente</Pill>}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted">Versión de prueba: eliges tu perfil. Con backend, confirmas con un código que llega por WhatsApp a tu teléfono.</p>
              </div>

              {!otro ? (
                <button type="button" className={btnSecondary} onClick={() => setOtro(true)}>Soy alguien más de la familia</button>
              ) : (
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[#c9cde0] p-4">
                  <div className="flex flex-col gap-1.5"><label htmlFor="un-nom" className={label}>Tu nombre</label><input id="un-nom" className={input} value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="un-tel" className={label}>Tu teléfono</label>
                    <input id="un-tel" inputMode="tel" className={input} value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: telefonoLimpio(e.target.value) })} />
                    {yaExiste && <span className="text-xs text-muted">Ya tienes perfil ({yaExiste.nombre}): entrarás con él.</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="un-par" className={label}>¿Qué eres de {pac?.nombre ?? "la persona cuidada"}?</label>
                    <input id="un-par" list="un-parentescos" className={input} value={nuevo.parentesco} onChange={(e) => setNuevo({ ...nuevo, parentesco: e.target.value })} />
                    <datalist id="un-parentescos">{PARENTESCOS.map((p) => <option key={p} value={p} />)}</datalist>
                  </div>
                  <Segmentado etiqueta="Género" valor={nuevo.genero} onChange={(v) => setNuevo({ ...nuevo, genero: v })} opciones={[{ v: "mujer", t: "Mujer" }, { v: "hombre", t: "Hombre" }, { v: "otro", t: "Otro" }]} />
                  <button type="button" className={btnPrimary} disabled={nuevo.nombre.trim().length < 2 || telNuevo.length !== 10} onClick={() => entrar({ nuevo: { ...nuevo, nombre: nuevo.nombre.trim() } })}>
                    Unirme a {fam.nombre}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </TechTag>
    </div>
  );
}

export default function UnirsePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Cargando…</p>}>
      <Unirse />
    </Suspense>
  );
}

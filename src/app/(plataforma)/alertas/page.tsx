"use client";

import { useData } from "@/lib/db";
import { Centros } from "@/components/Centros";
import { RequiereFamilia } from "@/components/RequiereFamilia";
import { TechTag } from "@/components/TechTag";
import { Encabezado, NivelPill, Pill, Tarjeta, Vacio, btnDanger, btnSecondary } from "@/components/ui";

function Alertas() {
  const { db, familia, paciente, atenderAlerta } = useData();
  if (!familia || !paciente) return null;
  const alertas = db.alertas.filter((a) => a.familiaId === familia.id).sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1));
  const activa = alertas.find((a) => a.estado === "activa");

  return (
    <>
      <Encabezado sub="Comunicación: alertas médicas, avisos por WhatsApp y centros cercanos" titulo="Alertas y centros" acciones={<a href="tel:911" className={btnDanger}>Llamar al 911</a>} />

      <TechTag k="whatsapp-alerta">
        <Tarjeta titulo="Alertas">
          {alertas.length === 0 && <Vacio>Sin alertas. Cuando un reporte cumple la trifecta u otra señal de emergencia, aparece aquí y se avisa por WhatsApp a los principales.</Vacio>}
          <ul className="flex flex-col gap-3">
            {alertas.map((a) => (
              <li key={a.id} className={`grid gap-3 rounded-2xl border p-4 md:grid-cols-[1.2fr_1fr] ${a.estado === "activa" && a.nivel === "rojo" ? "border-red-line bg-red-bg/40" : "border-line"}`}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <NivelPill nivel={a.nivel} />
                    {a.trifecta && <Pill tono="red">Trifecta</Pill>}
                    <Pill tono={a.estado === "activa" ? "amber" : "neutral"}>{a.estado}</Pill>
                    <span className="text-xs text-muted">{a.fechaHora.slice(0, 10)} {a.fechaHora.slice(11, 16)}</span>
                  </div>
                  <span className="font-semibold">{a.titulo}</span>
                  <span className="text-sm text-ink-2">{a.motivo}</span>
                  {a.centroElegido && <span className="text-sm">Centro elegido: <span className="font-semibold">{a.centroElegido}</span></span>}
                  {a.estado === "activa" && (
                    <div className="mt-1 flex gap-2">
                      <button type="button" className={btnSecondary} onClick={() => atenderAlerta(a.id)}>Marcar como atendida</button>
                    </div>
                  )}
                </div>
                {a.whatsapp ? (
                  <div className="flex flex-col gap-1.5 rounded-xl bg-realce p-3">
                    <span className="text-xs text-muted">
                      WhatsApp a {a.whatsapp.enviadoA.join(", ")} · {a.whatsapp.modo === "real" ? "enviado" : "simulado (falta configurar Twilio)"}
                    </span>
                    <p className="rounded-xl rounded-tl-md bg-white p-2.5 text-sm leading-relaxed">{a.whatsapp.texto}</p>
                  </div>
                ) : (
                  <p className="self-center text-sm text-muted">{a.nivel === "rojo" ? "Enviando aviso…" : "Alerta de vigilancia: no se envía WhatsApp."}</p>
                )}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </TechTag>

      <TechTag k="centros" className="mt-4">
        <Tarjeta titulo={`Centros de cuidado cerca de ${paciente.nombre}`}>
          <Centros hogar={familia.hogar} elegido={activa?.centroElegido} onElegir={activa ? (c) => atenderAlerta(activa.id, c.nombre) : undefined} />
        </Tarjeta>
      </TechTag>
    </>
  );
}

export default function AlertasPage() {
  return (
    <RequiereFamilia>
      <Alertas />
    </RequiereFamilia>
  );
}

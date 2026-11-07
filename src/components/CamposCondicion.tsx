"use client";

import { CONDICIONES, SIGNOS, SUGERENCIAS_ALERGIA, SUGERENCIAS_CONDICION, ajustarSignos, condicionCatalogo, nombreCondicion, normalizarCondicion } from "@/lib/catalogos";
import type { SignoId } from "@/lib/types";
import { Chip, Etiquetas, Pill, label } from "./ui";

export type DatosCondicion = { condiciones: string[]; signos: SignoId[]; alergias: string[] };

// Condición médica, signos a vigilar y alergias. Las condiciones del catálogo traen su
// protocolo; cualquier otra se da de alta con su nombre y la familia elige qué signos registrar.
export function CamposCondicion({ valor, onChange, disabled }: { valor: DatosCondicion; onChange: (v: Partial<DatosCondicion>) => void; disabled?: boolean }) {
  const propias = valor.condiciones.filter((c) => !condicionCatalogo(c));
  const toggleSigno = (s: SignoId) => onChange({ signos: valor.signos.includes(s) ? valor.signos.filter((x) => x !== s) : [...valor.signos, s] });

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Condición médica</legend>
        <Etiquetas
          etiqueta="Condición médica"
          valor={valor.condiciones}
          onChange={(next) => onChange({ condiciones: next, signos: ajustarSignos(valor.condiciones, next, valor.signos) })}
          opciones={Object.keys(CONDICIONES)}
          sugerencias={SUGERENCIAS_CONDICION}
          nombre={nombreCondicion}
          normalizar={normalizarCondicion}
          placeholder="¿Otra? Escríbela como la nombra su médico"
          disabled={disabled}
        />
        {propias.length > 0 && (
          <p className="text-sm text-muted">
            {propias.join(", ")} {propias.length === 1 ? "no tiene" : "no tienen"} protocolo automático todavía: elijan abajo qué signos registrar y el asistente {propias.length === 1 ? "la" : "las"} toma en cuenta al responder.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded-2xl bg-canvas p-4">
        <legend className="sr-only">Signos a registrar</legend>
        <p className="text-sm font-semibold">En cada recepción se pedirá registrar</p>
        {disabled ? (
          <div className="flex flex-wrap gap-1.5">{valor.signos.map((s) => <Pill key={s}>{SIGNOS[s].nombre}</Pill>)}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SIGNOS) as SignoId[]).map((s) => <Chip key={s} activo={valor.signos.includes(s)} onClick={() => toggleSigno(s)}>{SIGNOS[s].nombre}</Chip>)}
            </div>
            <p className="text-xs text-muted">Se prenden solos según la condición; puedes sumar o quitar los que indique su médico.</p>
          </>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${label} mb-2`}>Alergias</legend>
        <Etiquetas
          etiqueta="Alergias"
          valor={valor.alergias}
          onChange={(alergias) => onChange({ alergias })}
          sugerencias={SUGERENCIAS_ALERGIA}
          normalizar={(t) => t.trim().replace(/^\p{Ll}/u, (l) => l.toUpperCase())}
          placeholder="Medicamentos, alimentos o materiales"
          disabled={disabled}
        />
      </fieldset>
    </div>
  );
}

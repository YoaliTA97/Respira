"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Alert, CareEvent, Consent, Day, DemoState, Member, Recipient, Senal, SkillId, Slot, Toast } from "./types";
type Evaluacion = ReturnType<typeof evaluarSenales>;
import { createSeed, SEED_VERSION, STORAGE_KEY, DIRECTORIO } from "./seed";
import { evaluarSenales } from "./rules";

// Estado de la demo en el navegador. En el MVP cada acción es una llamada a la API
// (ver mapa técnico); aquí se guarda en localStorage y se sincroniza entre pestañas,
// para mostrar la app y el panel de la promotora lado a lado.

type RegistrarInput = {
  actorId: string;
  tipo: CareEvent["tipo"];
  categoria: string;
  competencia?: SkillId;
  detalle: string;
  senales: Senal[];
  evidencia?: "foto" | "audio";
  confirmadoPorId?: string;
  canal?: "app" | "whatsapp";
  transcripcion?: string;
};

type Actions = {
  setTech: (on: boolean) => void;
  reset: () => void;
  guardarRed: (recipient: Recipient, members: Member[], consent: Consent) => void;
  registrar: (input: RegistrarInput) => Evaluacion;
  chatEnviarAudio: () => void;
  chatResponder: (correcto: boolean) => void;
  confirmarAlerta: (id: string, destino: string) => void;
  reclasificarAlerta: (id: string) => void;
  validarPractica: (eventId: string) => void;
  solicitarRelevo: (dia: Day, slot: Slot, horario: string, helperId: string) => void;
  confirmarRelevo: (id: string) => void;
  setOfrecer: (on: boolean) => void;
  avisar: (texto: string) => void;
};

type Ctx = { state: DemoState; hydrated: boolean; toast: Toast } & Actions;

const DemoContext = createContext<Ctx | null>(null);

const DURACION: Record<string, number> = {
  Medicamento: 10, Movilización: 20, Higiene: 40, Comida: 45, Curación: 20, Acompañamiento: 120,
  "Reporte por voz": 5, Glucosa: 5, Estado: 5,
};

function horaAhora(): string {
  const d = new Date();
  return `Hoy ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function soloHora(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function nuevoId(prefijo: string): string {
  return `${prefijo}-${crypto.randomUUID().slice(0, 8)}`;
}

const TRANSCRIPCION_DEMO =
  "Buenos días. Mi mamá amaneció muy confundida, no me reconocía, y casi no ha tomado agua desde ayer. Sí le di su pastilla de la mañana.";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(createSeed);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar lo guardado y escuchar cambios de otras pestañas
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as DemoState;
        // Se hidrata después del montaje a propósito: el HTML prerenderizado usa los datos semilla.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (saved.version === SEED_VERSION) setState(saved);
      }
    } catch {
      // sin almacenamiento disponible: la demo funciona en memoria
    }
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const saved = JSON.parse(e.newValue) as DemoState;
        if (saved.version === SEED_VERSION) setState(saved);
      } catch {
        /* ignorar */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [state, hydrated]);

  const avisar = useCallback((texto: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), texto });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const registrarEn = (prev: DemoState, input: RegistrarInput, hora: string, ahoraMs: number) => {
    const actor = prev.members.find((m) => m.id === input.actorId);
    const confirmante = prev.members.find((m) => m.id === input.confirmadoPorId);
    const verificacion = confirmante ? "V2" : input.evidencia ? "V1" : "V0";
    const evento: CareEvent = {
      id: nuevoId("e"),
      casoId: prev.casoId,
      actorId: input.actorId,
      actorNombre: actor?.nombre ?? "Integrante",
      tipo: input.tipo,
      categoria: input.categoria,
      competencia: input.competencia,
      detalle: input.detalle,
      hora,
      canal: input.canal ?? "app",
      evidencia: input.evidencia,
      confirmadoPor: confirmante?.nombre,
      verificacion,
      senales: input.senales,
      duracionMin: DURACION[input.categoria] ?? 10,
      transcripcion: input.transcripcion,
    };
    const ev = evaluarSenales(input.senales);
    let alerta: Alert | undefined;
    if (ev.nivel !== "verde") {
      alerta = {
        id: nuevoId("a"),
        casoId: prev.casoId,
        persona: actor?.nombre ?? "Integrante",
        cuidaA: `su ${prev.recipient.relacion}`,
        eventoId: evento.id,
        nivel: ev.nivel,
        resumen: ev.reglas.join(" y "),
        motivo: ev.motivo,
        reglas: ev.reglas,
        senalesIA: input.transcripcion ? ["Tomó su medicamento"] : [],
        transcripcion: input.transcripcion,
        hora: hora.replace("Hoy ", ""),
        creadaMs: ahoraMs,
        estado: "pendiente",
      };
    }
    const next: DemoState = {
      ...prev,
      events: [...prev.events, evento],
      alerts: alerta ? [...prev.alerts, alerta] : prev.alerts,
    };
    return { next, alerta };
  };

  const actions: Actions = useMemo(
    () => ({
      avisar,
      setTech: (on) => setState((s) => ({ ...s, techMode: on })),
      reset: () => {
        const tech = state.techMode;
        setState({ ...createSeed(), techMode: tech });
        avisar("Demo reiniciada con los datos de ejemplo");
      },
      guardarRed: (recipient, members, consent) => setState((s) => ({ ...s, recipient, members, consent })),
      registrar: (input) => {
        const hora = horaAhora();
        const ahora = Date.now();
        setState((s) => registrarEn(s, input, hora, ahora).next);
        return evaluarSenales(input.senales);
      },
      chatEnviarAudio: () => {
        const hora = soloHora();
        setState((s) => ({
          ...s,
          chatFase: "audio",
          chat: [
            ...s.chat,
            { id: nuevoId("c"), de: "yo", tipo: "audio", texto: "0:42", hora },
            {
              id: nuevoId("c"), de: "bot", tipo: "resumen", hora,
              texto: "Amaneció confundida, no te reconocía|Casi no ha tomado agua desde ayer|Sí tomó su medicamento de la mañana",
              opciones: ["Sí, es correcto", "Corregir"],
            },
          ],
        }));
      },
      chatResponder: (correcto) => {
        const hora = soloHora();
        const ahora = Date.now();
        if (!correcto) {
          setState((s) => ({
            ...s,
            chatFase: "inicio",
            chat: [
              ...s.chat,
              { id: nuevoId("c"), de: "yo", tipo: "texto", texto: "Corregir", hora },
              { id: nuevoId("c"), de: "bot", tipo: "texto", texto: "Gracias por avisar. Mándame otro audio con lo que quieras corregir.", hora },
            ],
          }));
          return;
        }
        setState((s) => {
          const { next, alerta } = registrarEn(
            s,
            {
              actorId: "m-rosa", tipo: "observacion", categoria: "Reporte por voz",
              detalle: "Contó por voz: confundida, poca agua", senales: ["confusion", "poca_agua"],
              evidencia: "audio", canal: "whatsapp", transcripcion: TRANSCRIPCION_DEMO,
            },
            `Hoy ${hora}`,
            ahora,
          );
          return {
            ...next,
            chatFase: "confirmado",
            chat: [
              ...next.chat,
              { id: nuevoId("c"), de: "yo", tipo: "texto", texto: "Sí, es correcto", hora },
              { id: nuevoId("c"), de: "bot", tipo: "semaforo", hora, texto: alerta?.motivo, alertaId: alerta?.id },
            ],
          };
        });
      },
      confirmarAlerta: (id, destino) => {
        const ahora = Date.now();
        setState((s) => ({
          ...s,
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, estado: "confirmada", destino, revisadaMs: ahora } : a)),
        }));
        avisar("Alerta confirmada: la familia recibe a dónde acudir");
      },
      reclasificarAlerta: (id) => {
        const ahora = Date.now();
        setState((s) => ({
          ...s,
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, estado: "reclasificada", revisadaMs: ahora } : a)),
        }));
        avisar("Alerta bajada a vigilar");
      },
      validarPractica: (eventId) => {
        setState((s) => {
          const ev = s.events.find((e) => e.id === eventId);
          return {
            ...s,
            events: s.events.map((e) => (e.id === eventId ? { ...e, verificacion: "V3" } : e)),
            skills: s.skills.map((k) =>
              ev?.competencia === k.id ? { ...k, practicasValidadas: k.practicasValidadas + 1 } : k,
            ),
          };
        });
        avisar("Práctica validada: suma al Pasaporte de la cuidadora");
      },
      solicitarRelevo: (dia, slot, horario, helperId) => {
        setState((s) => {
          const helper = s.helpers.find((h) => h.id === helperId);
          return {
            ...s,
            relevos: [
              ...s.relevos,
              {
                id: nuevoId("r"), casoId: s.casoId, familia: "Rosa", dia, slot, horario,
                helperId, helperNombre: helper?.nombre, pagador: s.bolsa.pagador, estado: "solicitado",
              },
            ],
          };
        });
        avisar("Solicitud enviada; la cooperativa la confirma");
      },
      confirmarRelevo: (id) => {
        setState((s) => {
          const r = s.relevos.find((x) => x.id === id);
          if (!r) return s;
          const shifts =
            r.casoId === s.casoId && r.helperId
              ? { ...s.shifts, [r.dia]: { ...s.shifts[r.dia], [r.slot]: r.helperId } }
              : s.shifts;
          return {
            ...s,
            shifts,
            relevos: s.relevos.map((x) => (x.id === id ? { ...x, estado: "confirmado" } : x)),
            bolsa: { ...s.bolsa, usadasHoras: s.bolsa.usadasHoras + 4 },
          };
        });
        avisar("Relevo confirmado y descontado de la bolsa del pagador");
      },
      setOfrecer: (on) => {
        setState((s) => ({ ...s, ofrecerAcompanamiento: on }));
        if (on) avisar("Ahora apareces en la red cercana de otras familias");
      },
    }),
    [avisar, state.techMode],
  );

  return <DemoContext.Provider value={{ state, hydrated, toast, ...actions }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de DemoProvider");
  return ctx;
}

export { DIRECTORIO };

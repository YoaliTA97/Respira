"use client";

import { useEffect, useRef } from "react";

// Canal de eventos de la demo automática: el reproductor pide acciones (grabar la nota de ejemplo,
// abrir el mapa por etapas, cerrar la alerta grave) y cada pantalla las ejecuta.
const EVENTO = "respira-demo";

export function emitirDemo(accion: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO, { detail: accion }));
}

export function useDemoEvento(fn: (accion: string) => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    const h = (e: Event) => ref.current((e as CustomEvent<string>).detail);
    window.addEventListener(EVENTO, h);
    return () => window.removeEventListener(EVENTO, h);
  }, []);
}

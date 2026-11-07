"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

// QR para entrar a un espacio familiar: abre /unirse con el código de la familia.
export function enlaceUnion(codigo: string, usuarioId?: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/unirse?c=${encodeURIComponent(codigo)}${usuarioId ? `&u=${encodeURIComponent(usuarioId)}` : ""}`;
}

export function QrFamilia({ codigo, tamano = 200 }: { codigo: string; tamano?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let vivo = true;
    QRCode.toString(enlaceUnion(codigo), { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1b1e33", light: "#ffffff" } })
      .then((s) => vivo && setSvg(s))
      .catch(() => vivo && setSvg(""));
    return () => {
      vivo = false;
    };
  }, [codigo]);
  return (
    <div
      role="img"
      aria-label={`Código QR para unirse con el código ${codigo}`}
      className="rounded-2xl border border-line bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      style={{ width: tamano, height: tamano }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

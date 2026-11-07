"use client";

import Link from "next/link";
import { useState } from "react";
import { GUIAS_MEDICAS, nombreEquipo } from "@/lib/catalogos";
import { useData } from "@/lib/db";
import { Modal, btnSecondary, input, label } from "./ui";

// Convierte el enlace que da el médico aliado (YouTube, Vimeo, Drive o un .mp4) en algo reproducible.
function reproductor(url: string): { tipo: "iframe" | "video"; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { tipo: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  const dr = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (dr) return { tipo: "iframe", src: `https://drive.google.com/file/d/${dr[1]}/preview` };
  return { tipo: "video", src: url };
}

export function GuiaModal({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  const { db, familia, guardarVideoGuia } = useData();
  const g = GUIAS_MEDICAS.find((x) => x.id === id);
  const [url, setUrl] = useState(db.videosGuia[id] ?? "");
  if (!g) return null;
  const video = db.videosGuia[g.id];
  const r = video ? reproductor(video) : null;
  return (
    <Modal abierto onCerrar={onCerrar} titulo={g.titulo}>
      <div className="flex flex-col gap-4">
        {r ? (
          r.tipo === "iframe" ? (
            <iframe src={r.src} title={g.titulo} className="aspect-video w-full rounded-2xl border-0" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          ) : (
            <video src={r.src} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />
          )
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-2xl bg-realce p-5 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2e3f8f" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M10 8.5v7l6-3.5z" fill="#2e3f8f" />
            </svg>
            <span className="font-semibold">Video de {g.minutos} min · guía del médico</span>
            <span className="text-sm text-muted">Lo proporciona el médico aliado. Mientras tanto, estos son los puntos clave.</span>
          </div>
        )}
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">{g.puntos.map((p) => <li key={p}>{p}</li>)}</ol>
        {g.equipo && (
          <p className="rounded-xl bg-canvas p-3 text-sm">
            Se necesita: <span className="font-semibold">{nombreEquipo(g.equipo)}</span>.{" "}
            {familia && <Link href="/equipo" className="font-semibold underline" onClick={onCerrar}>¿No lo tienen? Pídelo prestado o réntalo</Link>}
          </p>
        )}
        <p className="text-xs text-muted">Contenido de ejemplo por validar con personal de salud. No sustituye la indicación de su médico.</p>
        <details className="rounded-xl border border-line p-3 text-sm">
          <summary className="cursor-pointer font-medium">{video ? "Cambiar el video del médico" : "Cargar el video del médico"}</summary>
          <div className="mt-3 flex flex-col gap-2">
            <label htmlFor={`v-${g.id}`} className={label}>Enlace del video (YouTube, Vimeo, Google Drive o .mp4)</label>
            <input id={`v-${g.id}`} className={input} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className={btnSecondary} disabled={!/^https?:\/\//.test(url.trim())} onClick={() => guardarVideoGuia(g.id, url)}>Guardar video</button>
              {video && <button type="button" className="text-sm text-muted underline" onClick={() => { setUrl(""); guardarVideoGuia(g.id, ""); }}>Quitar</button>}
            </div>
          </div>
        </details>
      </div>
    </Modal>
  );
}

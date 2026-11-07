// Íconos de línea (24×24, trazo 1.8) para botones y menús. Heredan el color del texto (currentColor).
const P = {
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  pasaporte: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9 16h6" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  casa: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  mas: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12l5 5 9-10" />,
  guion: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M12 8v4M12 15h.01" />
    </>
  ),
  grafica: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  capas: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  cambiar: (
    <>
      <path d="M7 7h12l-3-3M17 17H5l3 3" />
    </>
  ),
  salir: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4M6 12h11" />
    </>
  ),
  telefono: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  externo: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </>
  ),
  microfono: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  checklist: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v3H9zM9 13l2 2 4-4" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  chevron: <path d="M7 10l5 5 5-5" />,
  guardar: <path d="M5 12l5 5 9-10" />,
  enviar: <path d="M4 12l16-8-6 16-3-7z" />,
  red: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof P;

export function Icono({ n, size = 18, className = "" }: { n: NombreIcono; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      {P[n]}
    </svg>
  );
}

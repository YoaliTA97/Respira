// Símbolo D · Relevo: dos círculos que se turnan. El cruce queda en blanco: es el respiro.
export function Logo({ size = 28, invertido = false }: { size?: number; invertido?: boolean }) {
  const w = size * 1.6;
  return (
    <svg width={w} height={size} viewBox="0 0 48 30" aria-hidden="true">
      <defs>
        <clipPath id={`cruce-${size}`}>
          <circle cx="17" cy="15" r="12" />
        </clipPath>
      </defs>
      <circle cx="17" cy="15" r="12" fill={invertido ? "#ffffff" : "#2e3f8f"} />
      <circle cx="31" cy="15" r="12" fill={invertido ? "#9fc8de" : "#2f7fa8"} />
      <circle cx="31" cy="15" r="12" fill={invertido ? "#2e3f8f" : "#f9f7f2"} clipPath={`url(#cruce-${size})`} />
    </svg>
  );
}

export function Marca({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Logo size={size} />
      <span className="font-display font-bold tracking-tight text-ink" style={{ fontSize: size * 0.72 }}>
        respira
      </span>
    </span>
  );
}

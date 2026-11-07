export function AppHeader({ sub, titulo, right }: { sub: string; titulo: string; right?: React.ReactNode }) {
  return (
    <header className="glass-canvas sticky top-0 z-20 -mx-4 mb-3 flex min-h-[76px] items-center justify-between gap-3 border-b border-black/5 px-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted">{sub}</span>
        <h1 className="text-[22px] font-semibold tracking-tight">{titulo}</h1>
      </div>
      {right}
    </header>
  );
}

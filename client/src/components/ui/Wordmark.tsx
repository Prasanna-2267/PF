export function Wordmark({ sub }: { sub?: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-display text-lg font-bold tracking-tight text-ink">
        Parallax<span className="text-accent">Flow</span>
      </span>
      {sub && (
        <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
          {sub}
        </span>
      )}
    </span>
  );
}

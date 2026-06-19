export function Spinner({ full = false }: { full?: boolean }) {
  const dot = (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
  );
  if (full) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas">{dot}</div>;
  }
  return dot;
}

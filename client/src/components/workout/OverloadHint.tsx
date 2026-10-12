/** Shown when every set last time reached the top of the rep range. */
export function OverloadHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">Add 2.5 kg today.</p>;
}

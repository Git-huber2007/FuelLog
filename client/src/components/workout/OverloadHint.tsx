/** Shown when every set last time reached the top of the rep range. */
export function OverloadHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <p className="rounded-lg bg-accent px-3 py-1 text-sm font-semibold text-onaccent">Add 2.5 kg today.</p>;
}

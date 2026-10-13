/** Hidden until the streak is worth showing. */
export function StreakBadge({ days }: { days: number | undefined }) {
  if (!days || days <= 1) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm font-medium">
      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
      {days}-day logging streak
    </p>
  );
}

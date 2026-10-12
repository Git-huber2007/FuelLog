/** Hidden until the streak is worth showing. */
export function StreakBadge({ days }: { days: number | undefined }) {
  if (!days || days <= 1) return null;
  return <span className="rounded-full border border-line px-3 py-1 text-sm font-medium">{days}-day streak</span>;
}

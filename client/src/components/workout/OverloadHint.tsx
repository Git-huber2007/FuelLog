import type { ExerciseKind } from '@fuellog/shared';

/** Shown when every set last time reached the top of the rep or hold range. */
export function OverloadHint({ show, kind = 'weight_reps' }: { show: boolean; kind?: ExerciseKind }) {
  if (!show) return null;

  const message =
    kind === 'duration'
      ? 'Hold 10 s longer'
      : kind === 'assisted_bodyweight'
        ? 'Less assistance: try −5 kg'
        : kind === 'bodyweight_reps'
          ? 'Go for 12 reps'
          : 'Try +2.5 kg';

  return (
    <p
      className="inline-flex items-center gap-1.5 rounded-full bg-field px-3 py-1 text-xs font-semibold text-text motion-safe:transition-opacity motion-reduce:transition-none"
      role="status"
      aria-label={`Progressive overload hint: ${message}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

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
      className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent border border-accent/30 motion-safe:transition-opacity motion-reduce:transition-none"
      role="status"
      aria-label={`Progressive overload hint: ${message}`}
    >
      <span aria-hidden>⚡</span>
      <span>{message}</span>
    </p>
  );
}

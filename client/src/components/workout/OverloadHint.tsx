import type { ExerciseKind } from '@fuellog/shared';

/** Shown when every set last time reached the top of the rep or hold range. */
export function OverloadHint({ show, kind = 'weight_reps' }: { show: boolean; kind?: ExerciseKind }) {
  if (!show) return null;
  const message =
    kind === 'duration'
      ? 'Add 10 s today.'
      : kind === 'assisted_bodyweight'
        ? 'Use less assistance today.'
        : kind === 'bodyweight_reps'
          ? 'Add reps or load today.'
          : 'Add 2.5 kg today.';
  return <p className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">{message}</p>;
}

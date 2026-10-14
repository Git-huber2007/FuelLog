import { formatDayLabel, todayISO, type ExerciseKind, type WorkoutExercise } from '@fuellog/shared';

export function LastSessionLine({ last, kind = 'weight_reps', cardio }: { last: WorkoutExercise['last']; kind?: ExerciseKind; cardio?: boolean }) {
  if (!last) return <p className="text-sm text-muted">Last time: no earlier session yet. Today sets your baseline.</p>;
  const isCardio = kind === 'cardio' || Boolean(cardio);
  const sets = last.sets.map((s) => {
    if (isCardio) {
      return [s.weight_kg > 0 && `${s.weight_kg} km`, s.reps > 0 && `${s.reps} min`].filter(Boolean).join(' in ') + (s.incline_pct ? ` at ${s.incline_pct}% incline` : '');
    }
    if (kind === 'duration') {
      return `${s.reps} s`;
    }
    if (kind === 'bodyweight_reps') {
      return `${s.reps} reps`;
    }
    if (kind === 'weighted_bodyweight') {
      return s.weight_kg > 0 ? `+${s.weight_kg} kg × ${s.reps}` : `${s.reps} reps`;
    }
    if (kind === 'assisted_bodyweight') {
      return `−${s.weight_kg} kg × ${s.reps}`;
    }
    return `${s.weight_kg} kg × ${s.reps}`;
  });
  return <p className="text-sm text-muted">Last time ({formatDayLabel(last.date, todayISO())}): {sets.join(', ')}</p>;
}

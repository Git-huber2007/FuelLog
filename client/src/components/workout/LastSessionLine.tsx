import { formatDayLabel, todayISO, type WorkoutExercise } from '@fuellog/shared';

export function LastSessionLine({ last, cardio }: { last: WorkoutExercise['last']; cardio?: boolean }) {
  if (!last) return <p className="text-sm text-muted">Last time: no earlier session yet. Today sets your baseline.</p>;
  const sets = last.sets.map((s) =>
    cardio ? [s.weight_kg > 0 && `${s.weight_kg} km`, s.reps > 0 && `${s.reps} min`].filter(Boolean).join(' in ') : `${s.weight_kg} kg × ${s.reps}`);
  return <p className="text-sm text-muted">Last time ({formatDayLabel(last.date, todayISO())}): {sets.join(', ')}</p>;
}

import { exercisePhotos, type WorkoutExercise } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';
import { ExerciseDemo } from './ExerciseDemo';
import { LastSessionLine } from './LastSessionLine';
import { OverloadHint } from './OverloadHint';
import { SetRow } from './SetRow';

export function ExerciseCard({ date, exercise }: { date: string; exercise: WorkoutExercise }) {
  const qc = useQueryClient();
  const toast = useToast();
  // Timed holds such as the plank count seconds; cardio counts kilometres and minutes.
  const units = exercise.cardio ? (['km', 'min'] as const) : (['kg', exercise.prescription.endsWith(' s') ? 'seconds' : 'reps'] as const);
  const removed = useRef(false);
  const remove = useMutation({
    mutationFn: () => {
      removed.current = true; // stops a pending set save from re-creating the exercise after the delete
      return api<void>(`/days/${date}/exercises/${encodeURIComponent(exercise.key)}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      return qc.invalidateQueries({ queryKey: ['workout', date] });
    },
    onError: (error) => {
      removed.current = false;
      toast(error.message, 'error');
    },
  });

  return (
    <section className="card space-y-3" aria-label={exercise.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base">{exercise.name}</h3>
          {exercise.detail && <p className="text-sm text-muted">{exercise.detail}</p>}
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted">{exercise.prescription}</span>
      </div>
      <ExerciseDemo name={exercise.name} photos={exercisePhotos(exercise.key)} />
      <LastSessionLine last={exercise.last} cardio={exercise.cardio} />
      <OverloadHint show={exercise.overload} />
      <div className={`grid items-center gap-2 text-xs font-medium text-muted ${exercise.sets === 1 ? 'grid-cols-[1fr_1fr_1.5rem]' : 'grid-cols-[2.5rem_1fr_1fr_1.5rem]'}`} aria-hidden="true">
        {exercise.sets !== 1 && <span></span>}
        <span className="px-1">{units[0]}</span>
        <span className="px-1">{units[1]}</span>
        <span></span>
      </div>
      <ul className="space-y-2">
        {Array.from({ length: exercise.sets }, (_, i) => (
          <SetRow key={i} date={date} exerciseKey={exercise.key} setNumber={i + 1} units={units} single={exercise.sets === 1} removed={removed}
            initial={exercise.logged.find((s) => s.set_number === i + 1)} />
        ))}
      </ul>
      {exercise.extra && (
        <button type="button" className="btn w-full text-muted" disabled={remove.isPending} onClick={() => remove.mutate()}>
          {remove.isPending ? 'Removing…' : 'Remove from this workout'}
        </button>
      )}
    </section>
  );
}

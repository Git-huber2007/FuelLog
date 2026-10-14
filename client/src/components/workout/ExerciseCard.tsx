import { exercisePhotos, supportsIncline, type WorkoutExercise } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';
import { ExerciseDemo } from './ExerciseDemo';
import { LastSessionLine } from './LastSessionLine';
import { OverloadHint } from './OverloadHint';
import { SetRow } from './SetRow';

export function ExerciseCard({ date, exercise }: { date: string; exercise: WorkoutExercise }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isCardio = exercise.kind === 'cardio';
  const incline = !!(isCardio && supportsIncline(exercise.name));
  const isSingle = exercise.kind === 'bodyweight_reps' || exercise.kind === 'duration';

  const weightHeader =
    exercise.kind === 'weighted_bodyweight'
      ? '+kg'
      : exercise.kind === 'assisted_bodyweight'
        ? '−kg'
        : isCardio
          ? 'km'
          : 'kg';

  const repsHeader =
    isCardio
      ? 'min'
      : exercise.kind === 'duration'
        ? 'sec'
        : 'reps';

  const colClass = isSingle
    ? exercise.sets === 1
      ? 'grid-cols-[4.5rem_1fr_2.5rem]'
      : 'grid-cols-[2.25rem_4.5rem_1fr_2.5rem]'
    : incline
      ? exercise.sets === 1
        ? 'grid-cols-[4.5rem_1fr_1fr_1fr_2.5rem]'
        : 'grid-cols-[2.25rem_4.5rem_1fr_1fr_1fr_2.5rem]'
      : exercise.sets === 1
        ? 'grid-cols-[4.5rem_1fr_1fr_2.5rem]'
        : 'grid-cols-[2.25rem_4.5rem_1fr_1fr_2.5rem]';

  // Parse default target reps from prescription (e.g. 3×8–12 -> 12, 3×8 -> 8, default 8 or 30s)
  const targetMatch = exercise.prescription?.match(/\d+×(\d+)(?:–(\d+))?/);
  const targetReps = targetMatch
    ? Number(targetMatch[2] ?? targetMatch[1])
    : exercise.kind === 'duration'
      ? 30
      : 8;

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
          <Link
            to={`/exercise/${encodeURIComponent(exercise.key)}`}
            className="group inline-flex items-center gap-1.5 text-lg leading-snug font-semibold hover:text-accent transition-colors"
            title={`View history and charts for ${exercise.name}`}
          >
            <span className="truncate">{exercise.name}</span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
          {exercise.detail && <p className="text-sm text-muted">{exercise.detail}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-bg px-2.5 py-1 text-xs font-medium tabular-nums text-muted">
          {exercise.prescription}
        </span>
      </div>

      <ExerciseDemo name={exercise.name} photos={exercisePhotos(exercise.key)} />
      <LastSessionLine last={exercise.last} kind={exercise.kind} />
      <OverloadHint show={exercise.overload} kind={exercise.kind} />

      {/* Hevy-style Table Column Headers */}
      <div
        className={`grid items-center gap-2 px-2.5 text-xs font-medium text-muted ${colClass}`}
        aria-hidden="true"
      >
        {exercise.sets !== 1 && <span className="text-center uppercase tracking-[0.08em]">Set</span>}
        <span className="text-center uppercase tracking-[0.08em]">Prev</span>
        {isSingle ? (
          <span className="text-center uppercase tracking-[0.08em]">{repsHeader}</span>
        ) : (
          <>
            <span className="text-center uppercase tracking-[0.08em]">{weightHeader}</span>
            <span className="text-center uppercase tracking-[0.08em]">{repsHeader}</span>
            {incline && <span className="text-center uppercase tracking-[0.08em]">incline %</span>}
          </>
        )}
        <span className="text-center uppercase tracking-[0.08em]">✓</span>
      </div>

      <ul className="space-y-1.5">
        {Array.from({ length: exercise.sets }, (_, i) => {
          const prevSet = exercise.last?.sets.find((s) => s.set_number === i + 1);
          return (
            <SetRow
              key={i}
              date={date}
              exerciseKey={exercise.key}
              exerciseName={exercise.name}
              setNumber={i + 1}
              kind={exercise.kind}
              targetReps={targetReps}
              single={exercise.sets === 1}
              incline={incline}
              removed={removed}
              previous={prevSet}
              initial={exercise.logged.find((s) => s.set_number === i + 1)}
            />
          );
        })}
      </ul>

      {incline && (
        <p className="text-sm text-muted">
          Incline is the gradient in percent. Use a minus sign for a decline, for example -3.
        </p>
      )}

      {exercise.extra && (
        <button
          type="button"
          className="btn w-full text-muted hover:text-danger hover:border-danger/40 transition-colors"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          {remove.isPending ? 'Removing…' : 'Remove from this workout'}
        </button>
      )}
    </section>
  );
}

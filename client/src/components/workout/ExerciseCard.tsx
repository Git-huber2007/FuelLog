import { exercisePhotos, restFor, similarExercises, supportsIncline, type WorkoutExercise, type WorkoutResponse } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';
import { TIPS } from './coachingTips';
import { ExerciseDemo } from './ExerciseDemo';
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

  const [customSets, setCustomSets] = useState<number | null>(null);
  const maxLogged = exercise.logged.length > 0 ? Math.max(...exercise.logged.map((s) => s.set_number)) : 0;
  const count = Math.min(10, Math.max(customSets ?? exercise.sets, maxLogged, 1));

  const colClass = isSingle
    ? count === 1
      ? 'grid-cols-[3.75rem_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_2.75rem]'
      : 'grid-cols-[1.75rem_3.75rem_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_2.75rem]'
    : incline
      ? count === 1
        ? 'grid-cols-[3.5rem_1fr_1fr_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_1fr_1fr_2.75rem]'
        : 'grid-cols-[1.5rem_3.5rem_1fr_1fr_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_1fr_1fr_2.75rem]'
      : count === 1
        ? 'grid-cols-[3.75rem_1fr_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_1fr_2.75rem]'
        : 'grid-cols-[1.75rem_3.75rem_1fr_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_1fr_2.75rem]';

  const weightHeaderLabel =
    exercise.kind === 'weighted_bodyweight'
      ? 'Added weight in kg'
      : exercise.kind === 'assisted_bodyweight'
        ? 'Assistance in kg'
        : isCardio
          ? 'Distance in km'
          : 'Weight in kg';

  // Parse default target reps from prescription (e.g. 3×8–12 -> 12, 3×8 -> 8, default 8 or 30s)
  const targetMatch = exercise.prescription?.match(/\d+×(\d+)(?:–(\d+))?/);
  const targetReps = targetMatch
    ? Number(targetMatch[2] ?? targetMatch[1])
    : exercise.kind === 'duration'
      ? 30
      : 8;

  const tip = TIPS[exercise.key];
  const cardio = exercise.kind === 'cardio';
  const rest = tip?.[0] ?? restFor(exercise);
  const alternative = cardio ? '' : tip?.[2] ?? similarExercises(exercise.key, new Set()).slice(0, 2).map((e) => e.name).join(' or ');
  const removed = useRef(false);

  const removeSet = useMutation({
    mutationFn: async (targetSetNumber: number) => {
      if (exercise.logged.some((s) => s.set_number === targetSetNumber)) {
        await api<void>(`/days/${date}/exercises/${encodeURIComponent(exercise.key)}/sets/${targetSetNumber}`, {
          method: 'DELETE',
        });
      }
    },
    onSuccess: (_, targetSetNumber) => {
      qc.setQueryData<WorkoutResponse>(['workout', date], (w) => {
        if (!w) return w;
        return {
          ...w,
          exercises: w.exercises.map((e) => {
            if (e.key !== exercise.key) return e;
            const newLogged = e.logged
              .filter((s) => s.set_number !== targetSetNumber)
              .map((s) => (s.set_number > targetSetNumber ? { ...s, set_number: s.set_number - 1 } : s));
            return {
              ...e,
              logged: newLogged,
            };
          }),
        };
      });
      qc.invalidateQueries({ queryKey: ['progress'] });
    },
    onError: (error) => toast(error.message, 'error'),
  });

  const handleRemoveSet = (targetSetNumber: number, forceConfirm = false) => {
    if (count <= 1) return;
    const targetSet = exercise.logged.find((s) => s.set_number === targetSetNumber);
    const isLogged = Boolean(targetSet && targetSet.reps > 0);
    if (isLogged || forceConfirm) {
      if (!window.confirm(`Delete set ${targetSetNumber} for ${exercise.name}?`)) return;
    }
    setCustomSets(Math.max(1, count - 1));
    removeSet.mutate(targetSetNumber);
  };

  const handleAddSet = () => {
    if (count >= 10) return;
    setCustomSets(count + 1);
  };

  const remove = useMutation({
    mutationFn: () => {
      removed.current = true; // stops a pending set save from re-creating the exercise after the delete
      return api<void>(`/days/${date}/exercises/${encodeURIComponent(exercise.key)}${exercise.extra ? '' : '?skip=1'}`, { method: 'DELETE' });
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
    <section className="card p-3.5 min-[380px]:p-5 space-y-3.5" aria-label={exercise.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/exercise/${encodeURIComponent(exercise.key)}`}
            className="group inline-flex max-w-full items-center gap-1.5 text-lg leading-snug font-semibold hover:text-accent transition-colors"
            title={`View history and charts for ${exercise.name}`}
          >
            <span className="min-w-0 break-words">{exercise.name}</span>
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

      {!cardio && (
        <div className="rounded-2xl bg-bg p-3 text-sm">
          {rest && <p className="font-medium text-text">Rest {rest} between sets</p>}
          {tip && <p className="mt-1 text-muted">{tip[1]}</p>}
          {alternative && <p className="mt-1 text-xs text-muted">Machine busy or missing? {alternative}.</p>}
        </div>
      )}

      {/* Open until the first set is logged, then folded so the set rows sit closer together; open is only re-applied when it changes */}
      <details open={!exercise.logged.some((s) => s.reps > 0)} className="group">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted hover:text-text [&::-webkit-details-marker]:hidden">
          <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current transition-transform group-open:rotate-90" aria-hidden><path d="M4 2l5 4-5 4z" /></svg>
          Form demo
        </summary>
        <ExerciseDemo name={exercise.name} photos={exercisePhotos(exercise.key)} />
      </details>
      {exercise.instructions?.length ? (
        <details className="group/steps">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted hover:text-text [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current transition-transform group-open/steps:rotate-90" aria-hidden><path d="M4 2l5 4-5 4z" /></svg>
            How to do it · {exercise.instructions.length} steps
          </summary>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
            {exercise.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </details>
      ) : null}
      <OverloadHint show={exercise.overload} kind={exercise.kind} />

      {/* Hevy-style Table Column Headers */}
      <div
        className={`grid items-center gap-1.5 min-[380px]:gap-2 px-1.5 min-[380px]:px-2.5 text-xs font-semibold text-muted ${colClass}`}
        aria-hidden="true"
      >
        {count !== 1 && <span className="text-center uppercase tracking-[0.08em]">Set</span>}
        <span className="text-center uppercase tracking-[0.08em]">Prev</span>
        {isSingle ? (
          <span className="text-center uppercase tracking-[0.08em]">{repsHeader}</span>
        ) : (
          <>
            <span className="text-center uppercase tracking-[0.08em]" title={weightHeaderLabel}>
              {weightHeader}
            </span>
            <span className="text-center uppercase tracking-[0.08em]">{repsHeader}</span>
            {incline && <span className="text-center uppercase tracking-[0.08em]">incline %</span>}
          </>
        )}
        <span className="flex justify-center"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12l5 5L20 7" /></svg><span className="sr-only">Done</span></span>
      </div>

      <ul className="space-y-1.5">
        {Array.from({ length: count }, (_, i) => {
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
              single={count === 1}
              incline={incline}
              removed={removed}
              previous={prevSet}
              initial={exercise.logged.find((s) => s.set_number === i + 1)}
              onRemove={count > 1 ? (setNum) => handleRemoveSet(setNum, true) : undefined}
            />
          );
        })}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          className="btn min-h-[40px] flex-1 text-sm font-semibold border-line/60 hover:border-accent hover:text-accent active:scale-[0.98] transition-all"
          onClick={handleAddSet}
          disabled={count >= 10 || removeSet.isPending}
          aria-label={`Add set to ${exercise.name}`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add set
          </span>
        </button>
        {count > 1 && (
          <button
            type="button"
            className="btn min-h-[40px] flex-1 text-sm font-semibold text-muted hover:text-danger hover:border-danger/40 active:scale-[0.98] transition-all"
            onClick={() => handleRemoveSet(count, false)}
            disabled={removeSet.isPending}
            aria-label={`Remove last set from ${exercise.name}`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14" />
              </svg>
              Remove set
            </span>
          </button>
        )}
      </div>

      {incline && (
        <p className="text-sm text-muted">
          Incline is the gradient in percent. Use a minus sign for a decline, for example -3.
        </p>
      )}

      <button
        type="button"
        className="btn min-h-[44px] w-full text-muted hover:text-danger hover:border-danger/40 active:scale-[0.98] transition-all"
        disabled={remove.isPending}
        onClick={() => {
          if (exercise.logged.some((s) => s.reps > 0) && !window.confirm(`Delete the sets you logged for ${exercise.name} today?`)) return;
          remove.mutate();
        }}
      >
        {remove.isPending ? 'Removing…' : exercise.extra ? 'Remove from this workout' : 'Skip today'}
      </button>
    </section>
  );
}

import {
  formatPreviousHint,
  SetInput,
  type ExerciseKind,
  type WorkoutResponse,
  type WorkoutSet,
} from '@fuellog/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { useDebouncedMutation } from '../../hooks/useDebouncedMutation';
import { startRestTimer } from '../../hooks/useRestTimer';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';
import { useToast } from '../ui/Toast';

interface Props {
  date: string;
  exerciseKey: string;
  setNumber: number;
  initial: WorkoutSet | undefined;
  previous?: WorkoutSet | undefined;
  exerciseName?: string;
  kind: ExerciseKind;
  targetReps?: number;
  /** A one-row exercise, such as cardio, needs no "Set 1" label. */
  single?: boolean;
  /** Cardio rows get a third field for the gradient. */
  incline?: boolean;
  /** Set by the card when the exercise is being removed, so a late save cannot put it back. */
  removed?: { current: boolean };
}

/** One prescribed set. Saves itself shortly after typing or upon clicking the ✓ completion button. */
export function SetRow({
  date,
  exerciseKey,
  setNumber,
  initial,
  previous,
  exerciseName,
  kind,
  targetReps,
  single,
  incline,
  removed,
}: Props) {
  const id = useId();
  const qc = useQueryClient();
  const toast = useToast();
  const isSingle = kind === 'bodyweight_reps' || kind === 'duration';

  const [weight, setWeight] = useState(initial?.weight_kg ? String(initial.weight_kg) : '');
  const [reps, setReps] = useState(initial?.reps ? String(initial.reps) : '');
  const [grade, setGrade] = useState(initial?.incline_pct ? String(initial.incline_pct) : '');
  const [invalid, setInvalid] = useState(false);
  const [isPr, setIsPr] = useState(Boolean(initial?.is_pr));

  useEffect(() => {
    setIsPr(Boolean(initial?.is_pr));
  }, [initial?.is_pr]);

  const prevHint = formatPreviousHint(previous, kind);
  const isDone = (numberOrNull(reps) ?? 0) > 0;

  function copyPrevious() {
    if (!previous) return;
    const w = previous.weight_kg ? String(previous.weight_kg) : '';
    const r = previous.reps ? String(previous.reps) : '';
    const g =
      previous.incline_pct !== null && previous.incline_pct !== undefined
        ? String(previous.incline_pct)
        : grade;
    change(w, r, g);
  }

  const { run, status } = useDebouncedMutation(async (value: SetInput, opts) => {
    if (removed?.current) return;
    const saved = await api<WorkoutSet & { is_pr?: boolean }>(`/days/${date}/sets`, {
      method: 'PUT',
      body: value,
      keepalive: opts?.keepalive,
    });
    if (saved.is_pr) {
      setIsPr(true);
      toast(`New PR on ${exerciseName ?? 'exercise'}! 🎉`);
    } else {
      setIsPr(false);
    }
    // Keeps the workout summary (sets done, calories burned) in step with what was just saved.
    qc.setQueryData<WorkoutResponse>(['workout', date], (w) =>
      w && {
        ...w,
        exercises: w.exercises.map((e) =>
          e.key === exerciseKey
            ? { ...e, logged: [...e.logged.filter((s) => s.set_number !== setNumber), saved] }
            : e,
        ),
      },
    );
    qc.invalidateQueries({ queryKey: ['progress'] });
  });

  function change(nextWeight: string, nextReps: string, nextGrade = grade) {
    setWeight(nextWeight);
    setReps(nextReps);
    setGrade(nextGrade);
    const weightVal = isSingle ? 0 : (numberOrNull(nextWeight.replace(/^[+−-]/, '')) ?? 0);
    const repsVal = numberOrNull(nextReps) ?? 0;
    const parsed = SetInput.safeParse({
      exercise_key: exerciseKey,
      set_number: setNumber,
      weight_kg: weightVal,
      reps: repsVal,
      ...(incline && { incline_pct: numberOrNull(nextGrade) }),
    });
    setInvalid(!parsed.success);
    if (parsed.success) run(parsed.data);
  }

  function handleCheck() {
    if (!isDone) {
      // 1. Fill empty row from Previous or Target prescription
      let w = weight;
      let r = reps;
      let g = grade;

      if (previous && (previous.reps > 0 || (previous.weight_kg ?? 0) > 0)) {
        w = previous.weight_kg ? String(previous.weight_kg) : isSingle ? '' : '0';
        r = previous.reps ? String(previous.reps) : String(targetReps ?? (kind === 'duration' ? 30 : 8));
        g =
          previous.incline_pct !== null && previous.incline_pct !== undefined
            ? String(previous.incline_pct)
            : grade;
      } else {
        if (!w && !isSingle) w = '0';
        if (!r) r = String(targetReps ?? (kind === 'duration' ? 30 : 8));
      }

      change(w, r, g);
      startRestTimer();
    } else {
      // Already completed: restart or reset rest timer
      startRestTimer();
    }
  }

  const name = single ? 'Session' : `Set ${setNumber}`;

  const weightPlaceholder =
    kind === 'weighted_bodyweight'
      ? '+kg'
      : kind === 'assisted_bodyweight'
        ? '−kg'
        : kind === 'cardio'
          ? 'km'
          : 'kg';

  const repsPlaceholder =
    kind === 'cardio'
      ? 'min'
      : kind === 'duration'
        ? 'sec'
        : 'reps';

  const colClass = isSingle
    ? single
      ? 'grid-cols-[4.5rem_1fr_2.5rem]'
      : 'grid-cols-[2.25rem_4.5rem_1fr_2.5rem]'
    : incline
      ? single
        ? 'grid-cols-[4.5rem_1fr_1fr_1fr_2.5rem]'
        : 'grid-cols-[2.25rem_4.5rem_1fr_1fr_1fr_2.5rem]'
      : single
        ? 'grid-cols-[4.5rem_1fr_1fr_2.5rem]'
        : 'grid-cols-[2.25rem_4.5rem_1fr_1fr_2.5rem]';

  return (
    <li
      className={`grid items-center gap-2 px-2.5 py-1.5 rounded-2xl border transition-[background-color,border-color] ${colClass} ${
        isDone
          ? 'bg-accent/[0.04] dark:bg-accent/[0.07] border-accent/25'
          : 'border-line/40 hover:border-line'
      }`}
    >
      {!single && (
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-muted">{setNumber}</span>
          {isPr && (
            <span
              className="mt-0.5 rounded px-1 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/30"
              title="Personal Record!"
            >
              PR
            </span>
          )}
        </div>
      )}

      {/* Previous hint pill with tap-to-copy */}
      <button
        type="button"
        disabled={!previous || prevHint === '—'}
        onClick={copyPrevious}
        className="h-10 px-1 text-center text-xs font-medium text-muted rounded-xl bg-bg border border-line/60 hover:border-accent/60 hover:text-text active:scale-95 disabled:pointer-events-none disabled:opacity-40 truncate transition-all"
        title={previous && prevHint !== '—' ? `Previous: ${prevHint}. Tap to copy` : 'No previous set'}
        aria-label={previous && prevHint !== '—' ? `Previous set ${prevHint}. Tap to copy` : 'No previous set'}
      >
        {prevHint}
      </button>

      {/* Kind input fields */}
      {isSingle ? (
        <div>
          <label htmlFor={`${id}-r`} className="sr-only">
            {name} {repsPlaceholder}
          </label>
          <input
            id={`${id}-r`}
            className="input h-10 min-h-0 px-2 text-center text-sm font-semibold tabular-nums rounded-xl"
            inputMode="numeric"
            autoComplete="off"
            placeholder={repsPlaceholder}
            value={reps}
            onChange={(e) => change('', e.target.value)}
            aria-invalid={invalid}
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor={`${id}-w`} className="sr-only">
              {name} {weightPlaceholder}
            </label>
            <input
              id={`${id}-w`}
              className="input h-10 min-h-0 px-2 text-center text-sm font-semibold tabular-nums rounded-xl"
              inputMode="decimal"
              autoComplete="off"
              placeholder={weightPlaceholder}
              value={weight}
              onChange={(e) => change(e.target.value, reps)}
              aria-invalid={invalid}
            />
          </div>
          <div>
            <label htmlFor={`${id}-r`} className="sr-only">
              {name} {repsPlaceholder}
            </label>
            <input
              id={`${id}-r`}
              className="input h-10 min-h-0 px-2 text-center text-sm font-semibold tabular-nums rounded-xl"
              inputMode="numeric"
              autoComplete="off"
              placeholder={repsPlaceholder}
              value={reps}
              onChange={(e) => change(weight, e.target.value)}
              aria-invalid={invalid}
            />
          </div>
        </>
      )}

      {incline && (
        <div>
          <label htmlFor={`${id}-g`} className="sr-only">
            {name} incline in percent, negative for a decline
          </label>
          <input
            id={`${id}-g`}
            className="input h-10 min-h-0 px-2 text-center text-sm font-semibold tabular-nums rounded-xl"
            autoComplete="off"
            placeholder="0"
            value={grade}
            onChange={(e) => change(weight, reps, e.target.value)}
            aria-invalid={invalid}
          />
        </div>
      )}

      {/* Complete Set (✓) Button with status indicator */}
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={handleCheck}
          aria-label={
            isDone
              ? `${name} completed. Tap to restart rest timer`
              : `Complete ${name} and start rest timer`
          }
          className={`h-10 w-10 flex items-center justify-center rounded-xl font-bold transition-all ${
            isDone
              ? 'bg-accent text-onaccent shadow-sm active:scale-95'
              : 'bg-bg text-muted border border-input-line hover:border-accent hover:text-accent active:scale-95'
          }`}
          title={isDone ? 'Completed! Tap to restart rest timer' : 'Tap to log set and start rest timer'}
        >
          {status === 'saving' ? (
            <span className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" aria-hidden />
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </li>
  );
}

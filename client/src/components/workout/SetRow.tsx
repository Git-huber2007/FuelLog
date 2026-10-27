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
  /** Optional callback to remove this specific set. */
  onRemove?: (setNumber: number) => void;
}

/** One prescribed set with Hevy-style logging, auto-fill, PR badge, and auto-focus selection. */
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
  onRemove,
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

  const weightSrLabel =
    kind === 'weighted_bodyweight'
      ? `${name} added weight in kg`
      : kind === 'assisted_bodyweight'
        ? `${name} assistance in kg`
        : kind === 'cardio'
          ? `${name} distance in km`
          : `${name} weight in kg`;

  const repsSrLabel =
    kind === 'cardio'
      ? `${name} duration in minutes`
      : kind === 'duration'
        ? `${name} hold time in seconds`
        : `${name} reps`;

  function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.select();
    setTimeout(() => {
      e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
  }

  const colClass = isSingle
    ? single
      ? 'grid-cols-[3.75rem_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_2.75rem]'
      : 'grid-cols-[1.75rem_3.75rem_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_2.75rem]'
    : incline
      ? single
        ? 'grid-cols-[3.5rem_1fr_1fr_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_1fr_1fr_2.75rem]'
        : 'grid-cols-[1.5rem_3.5rem_1fr_1fr_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_1fr_1fr_2.75rem]'
      : single
        ? 'grid-cols-[3.75rem_1fr_1fr_2.75rem] min-[380px]:grid-cols-[4.5rem_1fr_1fr_2.75rem]'
        : 'grid-cols-[1.75rem_3.75rem_1fr_1fr_2.75rem] min-[380px]:grid-cols-[2.25rem_4.5rem_1fr_1fr_2.75rem]';

  return (
    <li
      className={`grid items-center gap-1.5 min-[380px]:gap-2 px-1.5 min-[380px]:px-2.5 py-1.5 rounded-2xl border transition-[background-color,border-color] ${colClass} ${
        isDone
          ? 'bg-accent/10 border-accent/30'
          : 'border-line/40 hover:border-line'
      }`}
    >
      {!single && (
        <div className="flex flex-col items-center justify-center w-7 min-[380px]:w-9 shrink-0">
          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(setNumber)}
              className="group/num flex h-7 w-7 min-[380px]:h-8 min-[380px]:w-8 items-center justify-center rounded-lg text-sm font-bold text-muted hover:bg-danger/10 hover:text-danger active:scale-95 transition-all"
              title={`Remove set ${setNumber}`}
              aria-label={`Remove set ${setNumber}`}
            >
              <span className="group-hover/num:hidden">{setNumber}</span>
              <svg
                viewBox="0 0 24 24"
                className="hidden h-3.5 w-3.5 stroke-current group-hover/num:block"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <span className="text-sm font-bold text-muted">{setNumber}</span>
          )}
          {isPr && (
            <span
              className="mt-0.5 rounded px-1 min-[380px]:px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider bg-gold/15 text-gold border border-gold/40 motion-safe:animate-rise-in motion-reduce:transition-none motion-reduce:animate-none"
              title="Personal Record!"
              aria-label="Personal record set"
            >
              PR
            </span>
          )}
        </div>
      )}

      {/* Previous hint pill with tap-to-copy (touch target >= 44px, tabIndex -1 so keyboard Tab moves kg -> reps -> ✓) */}
      <button
        type="button"
        tabIndex={-1}
        disabled={!previous || prevHint === '—'}
        onClick={copyPrevious}
        className="h-11 min-h-[44px] min-w-0 px-0.5 min-[380px]:px-1 text-center text-[11px] min-[380px]:text-xs font-semibold text-muted rounded-xl bg-bg border border-line/60 hover:border-accent/60 hover:text-text active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 truncate transition-transform"
        title={previous && prevHint !== '—' ? `Previous: ${prevHint}. Tap to copy` : 'No previous set'}
        aria-label={previous && prevHint !== '—' ? `Previous set ${prevHint}. Tap to copy` : 'No previous set'}
      >
        {prevHint}
      </button>

      {/* Kind input fields (touch targets >= 44px, select contents on focus, centered on mobile keyboard) */}
      {isSingle ? (
        <div>
          <label htmlFor={`${id}-r`} className="sr-only">
            {repsSrLabel}
          </label>
          <input
            id={`${id}-r`}
            aria-label={repsSrLabel}
            className="input h-11 min-h-[44px] px-1 min-[380px]:px-2 text-center text-sm font-semibold tabular-nums rounded-xl transition-[border-color,box-shadow]"
            inputMode="numeric"
            autoComplete="off"
            placeholder={repsPlaceholder}
            value={reps}
            onFocus={handleInputFocus}
            onChange={(e) => change('', e.target.value)}
            aria-invalid={invalid}
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor={`${id}-w`} className="sr-only">
              {weightSrLabel}
            </label>
            <input
              id={`${id}-w`}
              aria-label={weightSrLabel}
              className="input h-11 min-h-[44px] px-1 min-[380px]:px-2 text-center text-sm font-semibold tabular-nums rounded-xl transition-[border-color,box-shadow]"
              inputMode="decimal"
              autoComplete="off"
              placeholder={weightPlaceholder}
              value={weight}
              onFocus={handleInputFocus}
              onChange={(e) => change(e.target.value, reps)}
              aria-invalid={invalid}
            />
          </div>
          <div>
            <label htmlFor={`${id}-r`} className="sr-only">
              {repsSrLabel}
            </label>
            <input
              id={`${id}-r`}
              aria-label={repsSrLabel}
              className="input h-11 min-h-[44px] px-1 min-[380px]:px-2 text-center text-sm font-semibold tabular-nums rounded-xl transition-[border-color,box-shadow]"
              inputMode="numeric"
              autoComplete="off"
              placeholder={repsPlaceholder}
              value={reps}
              onFocus={handleInputFocus}
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
            aria-label={`${name} incline in percent`}
            className="input h-11 min-h-[44px] px-1 min-[380px]:px-2 text-center text-sm font-semibold tabular-nums rounded-xl transition-[border-color,box-shadow]"
            autoComplete="off"
            placeholder="0"
            value={grade}
            onFocus={handleInputFocus}
            onChange={(e) => change(weight, reps, e.target.value)}
            aria-invalid={invalid}
          />
        </div>
      )}

      {/* Complete Set (✓) Button (touch target >= 44px, no layout shift) */}
      <div className="relative flex items-center justify-center w-11 min-w-[44px] shrink-0">
        <button
          type="button"
          onClick={handleCheck}
          aria-label={
            isDone
              ? `${name} completed. Tap to restart rest timer`
              : `Complete ${name} and start rest timer`
          }
          className={`h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl font-bold transition-transform active:scale-[0.96] ${
            isDone
              ? 'bg-accent text-onaccent'
              : 'bg-bg text-muted border border-input-line hover:border-accent hover:text-accent'
          }`}
          title={isDone ? 'Completed! Tap to restart rest timer' : 'Tap to log set and start rest timer'}
        >
          {status === 'saving' ? (
            <span
              className="h-3 w-3 rounded-full bg-current motion-safe:animate-pulse motion-reduce:animate-none"
              aria-hidden
            />
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
        <span className="sr-only" role="status">
          {status === 'saved'
            ? 'Saved'
            : status === 'saving'
              ? 'Saving'
              : status === 'error'
                ? 'Not saved. Edit the value to try again.'
                : ''}
        </span>
      </div>
    </li>
  );
}

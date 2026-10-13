import { SetInput, type WorkoutResponse, type WorkoutSet } from '@fuellog/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useDebouncedMutation } from '../../hooks/useDebouncedMutation';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';

interface Props {
  date: string;
  exerciseKey: string;
  setNumber: number;
  initial: WorkoutSet | undefined;
  /** What the two inputs hold: ['kg', 'reps'] for lifts, ['kg', 'seconds'] for timed holds, ['km', 'min'] for cardio. */
  units: readonly [first: string, second: string];
  /** A one-row exercise, such as cardio, needs no "Set 1" label. */
  single?: boolean;
  /** Cardio rows get a third field for the gradient. */
  incline?: boolean;
  /** Set by the card when the exercise is being removed, so a late save cannot put it back. */
  removed?: { current: boolean };
}

/** One prescribed set. Saves itself shortly after the user stops typing; there is no submit button. */
export function SetRow({ date, exerciseKey, setNumber, initial, units, single, incline, removed }: Props) {
  const id = useId();
  const qc = useQueryClient();
  const [weight, setWeight] = useState(initial?.weight_kg ? String(initial.weight_kg) : '');
  const [reps, setReps] = useState(initial?.reps ? String(initial.reps) : '');
  const [invalid, setInvalid] = useState(false);
  const { run, status } = useDebouncedMutation(async (value: SetInput, opts) => {
    if (removed?.current) return;
    const saved = await api<WorkoutSet>(`/days/${date}/sets`, { method: 'PUT', body: value, keepalive: opts?.keepalive });
    // Keeps the workout summary (sets done, calories burned) in step with what was just saved.
    qc.setQueryData<WorkoutResponse>(['workout', date], (w) => w && {
      ...w,
      exercises: w.exercises.map((e) => (e.key === exerciseKey ? { ...e, logged: [...e.logged.filter((s) => s.set_number !== setNumber), saved] } : e)),
    });
    qc.invalidateQueries({ queryKey: ['progress'] });
  });
  const [grade, setGrade] = useState(initial?.incline_pct ? String(initial.incline_pct) : '');

  function change(nextWeight: string, nextReps: string, nextGrade = grade) {
    setWeight(nextWeight);
    setReps(nextReps);
    setGrade(nextGrade);
    const parsed = SetInput.safeParse({
      exercise_key: exerciseKey, set_number: setNumber, weight_kg: numberOrNull(nextWeight) ?? 0, reps: numberOrNull(nextReps) ?? 0,
      ...(incline && { incline_pct: numberOrNull(nextGrade) }),
    });
    setInvalid(!parsed.success);
    if (parsed.success) run(parsed.data);
  }

  const name = single ? 'Session' : `Set ${setNumber}`;
  return (
    <li className={`grid items-center gap-2 ${incline ? 'grid-cols-[1fr_1fr_1fr_1.5rem]' : single ? 'grid-cols-[1fr_1fr_1.5rem]' : 'grid-cols-[2.5rem_1fr_1fr_1.5rem]'}`}>
      {!single && <span className="text-sm text-muted">{name}</span>}
      <div>
        <label htmlFor={`${id}-w`} className="sr-only">{name} {units[0]}</label>
        <input id={`${id}-w`} className={`input px-2 text-center font-medium tabular-nums ${invalid ? 'border-danger' : ''}`} inputMode="decimal" autoComplete="off" placeholder={units[0]}
          value={weight} onChange={(e) => change(e.target.value, reps)} aria-invalid={invalid} />
      </div>
      <div>
        <label htmlFor={`${id}-r`} className="sr-only">{name} {units[1]}</label>
        <input id={`${id}-r`} className={`input px-2 text-center font-medium tabular-nums ${invalid ? 'border-danger' : ''}`} inputMode="numeric" autoComplete="off" placeholder={units[1]}
          value={reps} onChange={(e) => change(weight, e.target.value)} aria-invalid={invalid} />
      </div>
      {incline && (
        <div>
          <label htmlFor={`${id}-g`} className="sr-only">{name} incline in percent, negative for a decline</label>
          {/* No inputMode: phone number pads have no minus key, and a decline needs one. */}
          <input id={`${id}-g`} className={`input px-2 text-center font-medium tabular-nums ${invalid ? 'border-danger' : ''}`} autoComplete="off" placeholder="0"
            value={grade} onChange={(e) => change(weight, reps, e.target.value)} aria-invalid={invalid} />
        </div>
      )}
      <span className={`text-center text-sm font-semibold ${status === 'error' ? 'text-danger' : 'text-accent'}`} role="status">
        <span aria-hidden>{status === 'saved' ? '✓' : status === 'saving' ? '…' : status === 'error' ? '!' : ''}</span>
        <span className="sr-only">{status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving' : status === 'error' ? 'Not saved. Edit the value to try again.' : ''}</span>
      </span>
    </li>
  );
}

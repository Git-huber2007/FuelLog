import { SetInput, type WorkoutSet } from '@fuellog/shared';
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
  /** Set by the card when the exercise is being removed, so a late save cannot put it back. */
  removed?: { current: boolean };
}

/** One prescribed set. Saves itself shortly after the user stops typing; there is no submit button. */
export function SetRow({ date, exerciseKey, setNumber, initial, units, single, removed }: Props) {
  const id = useId();
  const qc = useQueryClient();
  const [weight, setWeight] = useState(initial?.weight_kg ? String(initial.weight_kg) : '');
  const [reps, setReps] = useState(initial?.reps ? String(initial.reps) : '');
  const [invalid, setInvalid] = useState(false);
  const { run, status } = useDebouncedMutation(async (value: SetInput, opts) => {
    if (removed?.current) return;
    await api(`/days/${date}/sets`, { method: 'PUT', body: value, keepalive: opts?.keepalive });
    qc.invalidateQueries({ queryKey: ['progress'] });
  });

  function change(nextWeight: string, nextReps: string) {
    setWeight(nextWeight);
    setReps(nextReps);
    const parsed = SetInput.safeParse({ exercise_key: exerciseKey, set_number: setNumber, weight_kg: numberOrNull(nextWeight) ?? 0, reps: numberOrNull(nextReps) ?? 0 });
    setInvalid(!parsed.success);
    if (parsed.success) run(parsed.data);
  }

  const name = single ? 'Session' : `Set ${setNumber}`;
  return (
    <li className={`grid items-center gap-2 ${single ? 'grid-cols-[1fr_1fr_1.5rem]' : 'grid-cols-[2.5rem_1fr_1fr_1.5rem]'}`}>
      {!single && <span className="text-sm text-muted">{name}</span>}
      <div>
        <label htmlFor={`${id}-w`} className="sr-only">{name} {units[0]}</label>
        <input id={`${id}-w`} className={`input ${invalid ? 'border-protein' : ''}`} inputMode="decimal" autoComplete="off" placeholder={units[0]}
          value={weight} onChange={(e) => change(e.target.value, reps)} aria-invalid={invalid} />
      </div>
      <div>
        <label htmlFor={`${id}-r`} className="sr-only">{name} {units[1]}</label>
        <input id={`${id}-r`} className={`input ${invalid ? 'border-protein' : ''}`} inputMode="numeric" autoComplete="off" placeholder={units[1]}
          value={reps} onChange={(e) => change(weight, e.target.value)} aria-invalid={invalid} />
      </div>
      <span className={`text-center text-sm font-semibold ${status === 'error' ? 'text-protein' : 'text-accent'}`} role="status">
        <span aria-hidden>{status === 'saved' ? '✓' : status === 'saving' ? '…' : status === 'error' ? '!' : ''}</span>
        <span className="sr-only">{status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving' : status === 'error' ? 'Not saved. Edit the value to try again.' : ''}</span>
      </span>
    </li>
  );
}

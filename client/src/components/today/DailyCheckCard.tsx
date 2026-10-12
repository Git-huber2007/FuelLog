import { CheckInput, stepsKcal, type DayResponse } from '@fuellog/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { dayKey } from '../../hooks/useDay';
import { useDebouncedMutation } from '../../hooks/useDebouncedMutation';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';
import { NumberField } from '../ui/NumberField';
import { WaterCounter } from './WaterCounter';

const EMPTY: CheckInput = { water_ml: 0, sleep_hours: null, creatine: false, protein_shake: false, steps: 0 };
const stepsText = (check: CheckInput | null) => (check?.steps ? String(check.steps) : '');

interface Props {
  date: string;
  initial: CheckInput | null;
  waterTargetMl: number;
  /** Body weight for the walking estimate; null until the profile has loaded. */
  bodyKg: number | null;
}

/** Water, sleep, steps and supplements. Mount with key={date} so each day starts from its own saved values. */
export function DailyCheckCard({ date, initial, waterTargetMl, bodyKg }: Props) {
  const qc = useQueryClient();
  const [check, setCheck] = useState<CheckInput>(initial ?? EMPTY);
  const [sleep, setSleep] = useState(initial?.sleep_hours?.toString() ?? '');
  const [sleepError, setSleepError] = useState<string>();
  const [steps, setSteps] = useState(stepsText(initial));
  const [stepsError, setStepsError] = useState<string>();
  const { run, status, retry, waiting } = useDebouncedMutation(async (value: CheckInput, opts) => {
    const saved = await api<CheckInput>(`/days/${date}/check`, { method: 'PUT', body: value, keepalive: opts?.keepalive });
    qc.setQueryData<DayResponse>(dayKey(date), (day) => day && { ...day, check: saved });
    qc.invalidateQueries({ queryKey: ['progress'] });
  });

  useEffect(() => {
    if (!waiting && (status === 'idle' || status === 'saved')) {
      const current = initial ?? EMPTY;
      setCheck(current);
      setSleep(current.sleep_hours?.toString() ?? '');
      setSleepError(undefined);
      setSteps(stepsText(current));
      setStepsError(undefined);
    }
  }, [initial, status, waiting]);

  function update(patch: Partial<CheckInput>) {
    const next = { ...check, ...patch };
    setCheck(next);
    run(next);
  }

  function changeSleep(text: string) {
    setSleep(text);
    const parsed = CheckInput.shape.sleep_hours.safeParse(numberOrNull(text));
    setSleepError(parsed.success ? undefined : 'Enter 0 to 16 hours');
    if (parsed.success) update({ sleep_hours: parsed.data });
  }

  function changeSteps(text: string) {
    setSteps(text);
    const parsed = CheckInput.shape.steps.safeParse(numberOrNull(text) ?? 0);
    setStepsError(parsed.success ? undefined : 'Enter 0 to 100000 steps');
    if (parsed.success) update({ steps: parsed.data });
  }

  return (
    <section className="card space-y-4" aria-labelledby="check-title">
      <div className="flex items-center justify-between">
        <h2 id="check-title" className="text-base">Daily check</h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${status === 'error' ? 'text-protein' : 'text-muted'}`} role="status">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Not saved' : ''}
          </span>
          {status === 'error' && (
            <button type="button" className="btn px-2 py-0.5 text-xs" onClick={retry}>Retry</button>
          )}
        </div>
      </div>
      <WaterCounter ml={check.water_ml} targetMl={waterTargetMl} onChange={(water_ml) => update({ water_ml })} />
      <NumberField label="Sleep last night" suffix="hours" value={sleep} onChange={changeSleep} error={sleepError} placeholder="7.5" />
      <div>
        <NumberField label="Steps today" inputMode="numeric" value={steps} onChange={changeSteps} error={stepsError} placeholder="8000" />
        {!!check.steps && bodyKg && (
          <p className="mt-1.5 text-sm text-muted">About {stepsKcal(check.steps, bodyKg)} kcal burned walking. An estimate; it does not change your calorie target.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([['creatine', 'Creatine'], ['protein_shake', 'Protein shake']] as const).map(([key, label]) => (
          <label key={key} className="flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-2xl border border-line px-3 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--accent))]" checked={check[key]} onChange={(e) => update({ [key]: e.target.checked })} />
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

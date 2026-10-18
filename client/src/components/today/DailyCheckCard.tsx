import { CheckInput, type DayResponse } from '@fuellog/shared';
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
}

/** Water, sleep, steps and supplements. Mount with key={date} so each day starts from its own saved values. */
export function DailyCheckCard({ date, initial, waterTargetMl }: Props) {
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
        <h2 id="check-title" className="card-title">Daily check</h2>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${status === 'error' ? 'text-danger' : 'text-muted'}`} role="status">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Not saved' : ''}
          </span>
          {status === 'error' && (
            <button type="button" className="link text-xs" onClick={retry}>Retry</button>
          )}
        </div>
      </div>
      <WaterCounter ml={check.water_ml} targetMl={waterTargetMl} onChange={(water_ml) => update({ water_ml })} />
      <NumberField label="Sleep last night" suffix="hours" value={sleep} onChange={changeSleep} error={sleepError} placeholder="7.5" />
      <NumberField label="Steps today" inputMode="numeric" value={steps} onChange={changeSteps} error={stepsError} placeholder="8000" />
      <div className="grid grid-cols-2 gap-2">
        {([['creatine', 'Creatine'], ['protein_shake', 'Protein shake']] as const).map(([key, label]) => (
          <label key={key} className="flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-2xl border border-line px-3.5 text-sm transition-colors duration-200 has-[:checked]:border-accent/60 has-[:checked]:bg-accent/10 has-[:checked]:font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
            <input type="checkbox" className="peer sr-only" checked={check[key]} onChange={(e) => update({ [key]: e.target.checked })} />
            <span className="order-first flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-input-line text-transparent transition-colors duration-200 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-onaccent" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
            </span>
            {label}
          </label>
        ))}
      </div>
    </section>
  );
}

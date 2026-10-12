import { MeasureInput, todayISO, type Measurements } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';
import { NumberField } from '../ui/NumberField';
import { useToast } from '../ui/Toast';

const FIELDS = [
  ['waist_cm', 'Waist', '30 to 250'],
  ['chest_cm', 'Chest', '30 to 250'],
  ['arm_cm', 'Arm', '10 to 100'],
] as const;

/** Today's tape measurements. Any field can be left blank. Mount with a key so it picks up today's saved values. */
export function MeasurementsForm({ initial }: { initial: Measurements | null }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [values, setValues] = useState({
    waist_cm: initial?.waist_cm?.toString() ?? '', chest_cm: initial?.chest_cm?.toString() ?? '', arm_cm: initial?.arm_cm?.toString() ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const save = useMutation({
    mutationFn: (body: MeasureInput) => api(`/days/${todayISO()}/measurements`, { method: 'PUT', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['day'] });
      toast('Measurements saved.');
    },
    onError: (error) => toast(error.message, 'error'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = MeasureInput.safeParse(Object.fromEntries(FIELDS.map(([key]) => [key, numberOrNull(values[key])])));
    setErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    if (!parsed.success) return;
    if (Object.values(parsed.data).every((v) => v === null)) return setErrors({ waist_cm: ['empty'] });
    save.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map(([key, label, range]) => (
          <NumberField key={key} label={label} suffix="cm" value={values[key]} onChange={(v) => setValues({ ...values, [key]: v })}
            error={errors[key] && (errors[key]![0] === 'empty' ? 'Enter at least one' : range)} />
        ))}
      </div>
      <button className="btn w-full" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save today’s measurements'}</button>
    </form>
  );
}

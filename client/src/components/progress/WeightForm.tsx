import { todayISO, WeightInput } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';
import { NumberField } from '../ui/NumberField';
import { useToast } from '../ui/Toast';

export function WeightForm({ todayWeight }: { todayWeight: number | undefined }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [weight, setWeight] = useState(todayWeight?.toString() ?? '');
  const [error, setError] = useState<string>();
  const save = useMutation({
    mutationFn: (body: { weight_kg: number }) => api(`/days/${todayISO()}/weight`, { method: 'PUT', body }),
    onSuccess: () => {
      // Today's weight also updates the profile, which moves every target.
      for (const key of ['progress', 'profile', 'day']) qc.invalidateQueries({ queryKey: [key] });
      toast('Weight logged.');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = WeightInput.safeParse({ weight_kg: numberOrNull(weight) });
    setError(parsed.success ? undefined : 'Enter 30 to 250 kg');
    if (parsed.success) save.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <NumberField label="Weight today" suffix="kg" value={weight} onChange={setWeight} error={error} placeholder="75.0" />
      </div>
      <button className="btn-primary mt-6 shrink-0" disabled={save.isPending}>{todayWeight === undefined ? 'Log' : 'Update'}</button>
    </form>
  );
}

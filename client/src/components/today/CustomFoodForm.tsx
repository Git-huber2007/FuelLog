import { FoodInput, type Food } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../../lib/apiClient';
import { numberOrNull } from '../../lib/entries';
import { NumberField } from '../ui/NumberField';

const MACROS = [
  ['protein_g', 'Protein'],
  ['carbs_g', 'Carbs'],
  ['fat_g', 'Fat'],
  ['fibre_g', 'Fibre'],
] as const;

export function CustomFoodForm({ initialName = '', onCreated, onCancel }: { initialName?: string; onCreated: (food: Food) => void; onCancel: () => void }) {
  const id = useId();
  const qc = useQueryClient();
  const [name, setName] = useState(initialName);
  const [serving, setServing] = useState('');
  const [kcal, setKcal] = useState('');
  const [macros, setMacros] = useState({ protein_g: '', carbs_g: '', fat_g: '', fibre_g: '' });
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const create = useMutation({
    mutationFn: (input: FoodInput) => api<Food>('/foods', { body: input }),
    onSuccess: (food) => {
      qc.invalidateQueries({ queryKey: ['foods'] });
      onCreated(food);
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = FoodInput.safeParse({
      name,
      serving_label: serving.trim() || undefined,
      kcal: numberOrNull(kcal),
      ...Object.fromEntries(MACROS.map(([key]) => [key, numberOrNull(macros[key]) ?? undefined])),
    });
    setErrors(parsed.success ? {} : parsed.error.flatten().fieldErrors);
    if (parsed.success) create.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-2xl border border-line p-3">
      <h3 className="font-semibold">New custom food</h3>
      <div>
        <label htmlFor={`${id}-name`} className="label">Name</label>
        <input id={`${id}-name`} className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        {errors.name && <p className="field-error">Give it a name of up to 80 characters</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-serving`} className="label">Serving</label>
          <input id={`${id}-serving`} className="input" maxLength={40} placeholder="1 bowl" value={serving} onChange={(e) => setServing(e.target.value)} />
        </div>
        <NumberField label="Calories" suffix="kcal" value={kcal} onChange={setKcal} error={errors.kcal && 'Enter 0 to 5000'} />
        {MACROS.map(([key, label]) => (
          <NumberField key={key} label={label} suffix="g" placeholder="0" value={macros[key]} onChange={(v) => setMacros({ ...macros, [key]: v })} error={errors[key] && 'Enter 0 to 1000'} />
        ))}
      </div>
      {create.isError && <p role="alert" className="field-error">{create.error.message}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn flex-1" onClick={onCancel}>Cancel</button>
        <button className="btn-primary flex-1" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save food'}</button>
      </div>
    </form>
  );
}

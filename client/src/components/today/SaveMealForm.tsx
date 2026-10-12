import { SavedMealBody } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent } from 'react';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** Names everything logged on this day as a meal that can be logged again in one tap. */
export function SaveMealForm({ date }: { date: string }) {
  const id = useId();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const save = useMutation({
    mutationFn: (body: { name: string; date: string }) => api('/saved-meals', { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-meals'] });
      toast(`Saved “${name.trim()}”. Find it under Saved meals.`);
      setName('');
    },
    onError: (err) => setError(err.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = SavedMealBody.safeParse({ name, date });
    if (!parsed.success) return setError('Give the meal a name of up to 40 characters.');
    setError(undefined);
    save.mutate(parsed.data);
  }

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="label">Save these foods as a meal</label>
      <div className="flex gap-2">
        <input id={id} className="input" maxLength={40} placeholder="Usual breakfast" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn shrink-0" disabled={save.isPending}>Save</button>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </form>
  );
}

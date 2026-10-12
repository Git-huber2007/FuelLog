import type { Food } from '@fuellog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { api } from '../../lib/apiClient';
import { EmptyState } from '../ui/EmptyState';
import { useToast } from '../ui/Toast';

export function FoodSearchInput({ onPick, onCreate }: { onPick: (food: Food) => void; onCreate: (name: string) => void }) {
  const id = useId();
  const qc = useQueryClient();
  const toast = useToast();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [text]);

  const results = useQuery({ queryKey: ['foods', query], queryFn: () => api<Food[]>(`/foods?q=${encodeURIComponent(query)}`), enabled: query.length > 0 });
  const remove = useMutation({
    mutationFn: (food: Food) => api<void>(`/foods/${food.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <div>
      <label htmlFor={id} className="label">Search foods</label>
      <input id={id} className="input" type="search" autoComplete="off" placeholder="Roti, dal, chicken…" value={text} onChange={(e) => setText(e.target.value)} />
      {query && results.data && (
        <p role="status" className="sr-only">
          {results.data.length} {results.data.length === 1 ? 'result' : 'results'} found
        </p>
      )}
      {query && results.data && (
        results.data.length ? (
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {results.data.map((food) => (
              <li key={food.id} className="flex items-stretch">
                <button type="button" className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 text-left"
                  onClick={() => { onPick(food); setText(''); }}>
                  <span className="min-w-0">
                    <span className="block truncate" title={food.name}>{food.name}</span>
                    <span className="block text-sm text-muted">{food.serving_label} · {food.protein_g} g protein</span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">{Math.round(food.kcal)} kcal</span>
                </button>
                {food.owner_id && (
                  <button type="button" className="min-w-[44px] border-l border-line px-2 text-sm text-muted" aria-label={`Delete custom food ${food.name}`}
                    disabled={remove.isPending} onClick={() => remove.mutate(food)}>✕</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2">
            <EmptyState title={`Nothing called “${query}” yet`} hint="Create it once and it will show up in search from then on."
              action={<button type="button" className="btn" onClick={() => onCreate(query)}>Create custom food</button>} />
          </div>
        )
      )}
      {results.isError && <p className="field-error">{results.error.message}</p>}
    </div>
  );
}

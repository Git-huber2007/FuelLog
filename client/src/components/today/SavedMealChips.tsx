import type { Meal, SavedMeal } from '@fuellog/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateLogs } from '../../hooks/useDay';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** Saved meals: tap the name to log every item in it, tap the cross to delete the saved meal. */
export function SavedMealChips({ date, meal }: { date: string; meal: Meal }) {
  const qc = useQueryClient();
  const toast = useToast();
  const meals = useQuery({ queryKey: ['saved-meals'], queryFn: () => api<SavedMeal[]>('/saved-meals') });
  const log = useMutation({
    mutationFn: (saved: SavedMeal) => api(`/saved-meals/${saved.id}/log`, { body: { date, meal } }),
    onSuccess: (_data, saved) => {
      invalidateLogs(qc, date);
      toast(`Logged ${saved.name}.`);
    },
    onError: (error) => toast(error.message, 'error'),
  });
  const remove = useMutation({
    mutationFn: (saved: SavedMeal) => api<void>(`/saved-meals/${saved.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-meals'] }),
    onError: (error) => toast(error.message, 'error'),
  });

  if (!meals.data?.length) return null;
  return (
    <div>
      <h3 className="label">Saved meals</h3>
      <ul className="flex flex-wrap gap-2">
        {meals.data.map((saved) => (
          <li key={saved.id} className="flex max-w-full overflow-hidden rounded-full border border-line bg-bg">
            <button type="button" className="min-h-[44px] min-w-0 truncate pl-4 pr-2 text-sm" disabled={log.isPending} onClick={() => log.mutate(saved)}>
              {saved.name} · {Math.round(saved.items.reduce((sum, item) => sum + item.kcal, 0))} kcal
            </button>
            <button type="button" className="min-h-[44px] min-w-[44px] text-sm text-muted" aria-label={`Delete saved meal ${saved.name}`}
              disabled={remove.isPending} onClick={() => remove.mutate(saved)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

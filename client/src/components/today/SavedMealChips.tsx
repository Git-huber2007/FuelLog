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

  if (meals.isPending) {
    return (
      <div role="status" aria-label="Loading saved meals">
        <h3 className="label">Saved meals</h3>
        <div className="flex flex-wrap gap-2">
          {[140, 160].map((w, i) => (
            <div key={i} className="h-11 shrink-0 rounded-sm bg-line/20 animate-pulse" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!meals.data?.length) return null;
  return (
    <div>
      <h3 className="label">Saved meals</h3>
      <ul className="flex flex-wrap gap-2">
        {meals.data.map((saved) => (
          <li key={saved.id} className="flex max-w-full rounded-sm border border-line bg-bg">
            <button type="button" className="min-h-[44px] min-w-0 truncate rounded-l-full pl-4 pr-2 text-sm disabled:opacity-50" disabled={log.isPending} onClick={() => log.mutate(saved)}
              title={`${saved.name} · ${Math.round(saved.items.reduce((sum, item) => sum + item.kcal, 0))} kcal`}>
              {saved.name} · {Math.round(saved.items.reduce((sum, item) => sum + item.kcal, 0))} kcal
            </button>
            <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-r-full text-muted transition-colors hover:text-text disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4" aria-label={`Delete saved meal ${saved.name}`}
              disabled={remove.isPending} onClick={() => remove.mutate(saved)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </li>
        ))}
      </ul>
    </div>
  );
}

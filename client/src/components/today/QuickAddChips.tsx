import type { Meal, RecentFood } from '@fuellog/shared';
import { useQuery } from '@tanstack/react-query';
import { useAddFood } from '../../hooks/useDay';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

/** The six most recent distinct foods. One tap logs one serving to the chosen meal. */
export function QuickAddChips({ date, meal }: { date: string; meal: Meal }) {
  const toast = useToast();
  const recent = useQuery({ queryKey: ['recent-foods'], queryFn: () => api<RecentFood[]>('/recent-foods') });
  const add = useAddFood(date);
  if (recent.isPending) {
    return (
      <div role="status" aria-label="Loading recent foods">
        <h3 className="label">Recent</h3>
        <div className="flex flex-wrap gap-2">
          {[80, 110, 95, 120].map((w, i) => (
            <div key={i} className="h-9 shrink-0 rounded-sm bg-line/20 animate-pulse" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>
    );
  }
  if (!recent.data?.length) return <p className="text-sm text-muted">Foods you log will appear here for one-tap adding.</p>;
  return (
    <div>
      <h3 className="label">Recent</h3>
      <ul className="flex flex-wrap gap-2">
        {recent.data.map((food) => (
          <li key={food.name} className="max-w-full">
            <button
              type="button"
              className="chip max-w-full py-1.5 text-left"
              aria-label={`Add ${food.name}, ${Math.round(food.kcal)} kcal`}
              onClick={() => {
                add.mutate([{ ...food, food_id: food.food_id ?? undefined, meal, servings: 1 }]);
                toast(`Added ${food.name}.`);
              }}
            >
              <span className="line-clamp-2" title={food.name}>{food.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

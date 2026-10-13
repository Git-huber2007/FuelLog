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
  if (!recent.data) return null;
  if (!recent.data.length) return <p className="text-sm text-muted">Foods you log will appear here for one-tap adding.</p>;
  return (
    <div>
      <h3 className="label">Recent</h3>
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
        {recent.data.map((food) => (
          <li key={food.name} className="shrink-0">
            <button type="button" className="chip" aria-label={`Add ${food.name}, ${Math.round(food.kcal)} kcal`}
              onClick={() => {
                add.mutate([{ ...food, food_id: food.food_id ?? undefined, meal, servings: 1 }]);
                toast(`Added ${food.name}`);
              }}>
              <span className="whitespace-nowrap">{food.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

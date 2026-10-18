import { Meal, type FoodLog } from '@fuellog/shared';
import { useDeleteLog } from '../../hooks/useDay';
import { EmptyState } from '../ui/EmptyState';
import { CopyYesterdayButton } from './CopyYesterdayButton';
import { EatenListItem } from './EatenListItem';
import { MEAL_LABELS } from './MealSlotPicker';
import { SaveMealForm } from './SaveMealForm';

export function EatenList({ date, logs }: { date: string; logs: FoodLog[] }) {
  const remove = useDeleteLog(date);
  return (
    <section className="card space-y-3" aria-labelledby="eaten-title">
      <h2 id="eaten-title" tabIndex={-1} className="card-title outline-none">Eaten</h2>
      {logs.length === 0 && (
        <EmptyState title="Nothing logged for this day" hint="Tap a recent food, search the list, or scan a barcode above. Each entry shows up here." />
      )}
      {Meal.options.map((meal) => {
        const entries = logs.filter((l) => l.meal === meal);
        if (!entries.length) return null;
        return (
          <div key={meal}>
            <h3 className="cond flex justify-between border-b border-line pb-1 text-sm font-bold uppercase tracking-[0.06em] text-muted">
              <span>{MEAL_LABELS[meal]}</span>
              <span className="text-text">{Math.round(entries.reduce((sum, l) => sum + l.kcal, 0))} kcal</span>
            </h3>
            <ul className="divide-y divide-line">
              {entries.map((log) => <EatenListItem key={log.id} log={log} onDelete={() => remove.mutate(log.id)} />)}
            </ul>
          </div>
        );
      })}
      {logs.length > 0 && <SaveMealForm date={date} />}
      {logs.length === 0 && <CopyYesterdayButton date={date} />}
    </section>
  );
}

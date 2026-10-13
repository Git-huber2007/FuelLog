import { Meal } from '@fuellog/shared';

export const MEAL_LABELS: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function MealSlotPicker({ value, onChange }: { value: Meal; onChange: (meal: Meal) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Meal</legend>
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-bg p-1">
        {Meal.options.map((meal) => (
          <label key={meal} className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl text-sm transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${value === meal ? 'bg-card font-semibold shadow-sm' : 'text-muted'}`}>
            <input type="radio" name="meal" className="sr-only" checked={value === meal} onChange={() => onChange(meal)} />
            {MEAL_LABELS[meal]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

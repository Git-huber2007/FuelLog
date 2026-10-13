import { Meal } from '@fuellog/shared';

export const MEAL_LABELS: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function MealSlotPicker({ value, onChange }: { value: Meal; onChange: (meal: Meal) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Meal</legend>
      <div className="segmented grid-cols-4">
        {Meal.options.map((meal) => (
          <label key={meal} className="segmented-option">
            <input type="radio" name="meal" className="sr-only" checked={value === meal} onChange={() => onChange(meal)} />
            {MEAL_LABELS[meal]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

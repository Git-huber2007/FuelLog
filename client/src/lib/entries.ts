import type { Food, LogEntryInput, Meal } from '@fuellog/shared';

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A log entry for some servings of a food. Totals are snapshotted so later edits to the food do not rewrite history. */
export const entryFromFood = (food: Food, servings: number, meal: Meal): LogEntryInput => ({
  meal,
  food_id: food.id,
  name: food.name,
  servings,
  kcal: round1(food.kcal * servings),
  protein_g: round1(food.protein_g * servings),
  carbs_g: round1(food.carbs_g * servings),
  fat_g: round1(food.fat_g * servings),
  fibre_g: round1(food.fibre_g * servings),
  source: food.barcode ? 'barcode' : food.owner_id ? 'custom' : 'list',
});

/** Parses a form field: blank becomes null, anything unparseable becomes NaN so the schema rejects it. */
export const numberOrNull = (text: string): number | null => (text.trim() === '' ? null : Number(text.replace(',', '.')));

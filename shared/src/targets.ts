import type { Goal, ProfileInput } from './schemas';
import { weekdayOf } from './dates';

export interface Targets {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  water_ml: number;
}

export type TargetProfile = ProfileInput & { kcal_adjust?: number };

export const MIN_KCAL = 1500;
const GOAL_DELTA: Record<Goal, number> = { cut: -400, maintain: 0, gain: 300 };

export const round10 = (n: number) => Math.round(n / 10) * 10;

/** Monday to Saturday are gym days (+30 kcal), Sunday is rest (-180 kcal). */
export const dayDeltaFor = (iso: string) => (weekdayOf(iso) === 0 ? -180 : 30);

export function computeTargets(p: TargetProfile, dayDelta = 0): Targets {
  const bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const kcal = Math.max(MIN_KCAL, round10(bmr * 1.4 + GOAL_DELTA[p.goal] + (p.kcal_adjust ?? 0) + dayDelta));
  const protein_g = Math.round(p.weight_kg * (p.goal === 'cut' ? 2.0 : 1.8));
  const fat_g = Math.round(p.weight_kg * 0.9);
  return {
    kcal,
    protein_g,
    fat_g,
    carbs_g: Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4)),
    fibre_g: 30,
    water_ml: Math.round(p.weight_kg * 35),
  };
}

export interface MacroTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
}

export function sumMacros(rows: readonly MacroTotals[]): MacroTotals {
  const t = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0 };
  for (const r of rows) {
    t.kcal += r.kcal;
    t.protein_g += r.protein_g;
    t.carbs_g += r.carbs_g;
    t.fat_g += r.fat_g;
    t.fibre_g += r.fibre_g;
  }
  return t;
}

import type { Goal, ProfileInput } from './schemas';
import { splitFor, type ProgramKey } from './split';

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

const PROGRAM_DELTAS: Record<ProgramKey, { train: number; rest: number }> = {
  six_day: { train: 30, rest: -180 },
  upper_lower: { train: 45, rest: -60 },
  full_body: { train: 60, rest: -45 },
  custom: { train: 0, rest: 0 },
};

/**
 * Lowers the calorie target on rest days and raises it on training days for the user's program.
 * Sized so the weekly total stays net 0 (same as the six-day 6 × 30 − 180 = 0).
 */
export const dayDeltaFor = (iso: string, program: ProgramKey = 'six_day'): number => {
  const isRest = splitFor(iso, program).exercises.length === 0;
  return isRest ? PROGRAM_DELTAS[program].rest : PROGRAM_DELTAS[program].train;
};

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

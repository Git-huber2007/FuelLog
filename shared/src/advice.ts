import type { Goal } from './schemas';
import type { Targets } from './targets';
import { addDays, daysBetween } from './dates';

export interface Weigh {
  log_date: string;
  weight_kg: number;
}

export interface Advice {
  status: 'insufficient' | 'cooldown' | 'on_track' | 'adjust';
  /** kcal to add to the daily target; 0 unless status is 'adjust'. */
  delta: number;
  /** kg per week, last 7 days against the 7 before. */
  rate: number | null;
  message: string;
}

/** Healthy weekly weight change per goal, in kg. */
const BANDS: Record<Goal, [number, number]> = { cut: [-0.75, -0.25], maintain: [-0.25, 0.25], gain: [0.1, 0.4] };
export const ADJUST_STEP = 150;
export const clampAdjust = (n: number) => Math.max(-600, Math.min(600, n));

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function weeklyRate(weights: readonly Weigh[], today: string): number | null {
  const window = (from: number, to: number) =>
    weights.filter((w) => w.log_date >= addDays(today, from) && w.log_date <= addDays(today, to)).map((w) => w.weight_kg);
  const recent = window(-6, 0);
  const before = window(-13, -7);
  return recent.length && before.length ? avg(recent) - avg(before) : null;
}

export function adjustmentAdvice(i: { weights: readonly Weigh[]; goal: Goal; today: string; lastAdjustedOn: string | null }): Advice {
  const dates = i.weights.map((w) => w.log_date).filter((d) => d <= i.today).sort();
  const lastTwoWeeks = dates.filter((d) => d >= addDays(i.today, -13));
  const rate = weeklyRate(i.weights, i.today);
  if (lastTwoWeeks.length < 8 || daysBetween(dates[0], dates[dates.length - 1]) < 13 || rate === null) {
    return { status: 'insufficient', delta: 0, rate: null, message: 'Weigh in on at least 8 of 14 days and your calorie target will tune itself to your trend.' };
  }
  if (i.lastAdjustedOn && daysBetween(i.lastAdjustedOn, i.today) < 7) {
    return { status: 'cooldown', delta: 0, rate, message: 'Target adjusted recently. Give it a week before the next change.' };
  }
  const [lo, hi] = BANDS[i.goal];
  const shown = `${rate > 0 ? '+' : ''}${rate.toFixed(2)} kg per week`;
  if (rate < lo) return { status: 'adjust', delta: ADJUST_STEP, rate, message: `Your weight is moving ${shown}, faster down than planned. Add ${ADJUST_STEP} kcal a day.` };
  if (rate > hi) return { status: 'adjust', delta: -ADJUST_STEP, rate, message: `Your weight is moving ${shown}, faster up than planned. Remove ${ADJUST_STEP} kcal a day.` };
  return { status: 'on_track', delta: 0, rate, message: `On track at ${shown}. Keep your current target.` };
}

export interface NudgeInput {
  isToday: boolean;
  /** Local hour, 0 to 23. */
  hour: number;
  targets: Pick<Targets, 'kcal' | 'protein_g' | 'water_ml'>;
  eaten: { kcal: number; protein_g: number };
  water_ml: number;
  hasWeighIn: boolean;
  foods: readonly { name: string; kcal: number; protein_g: number }[];
}

export function nudge(i: NudgeInput): string | null {
  if (!i.isToday) return null;
  const protein = Math.round(i.targets.protein_g - i.eaten.protein_g);
  const kcal = i.targets.kcal - i.eaten.kcal;
  if (protein > 15 && kcal > 100) {
    const fits = i.foods
      .filter((f) => f.protein_g >= 8 && f.kcal > 0 && f.kcal <= kcal)
      .sort((a, b) => b.protein_g / b.kcal - a.protein_g / a.kcal)
      .slice(0, 3)
      .map((f) => f.name);
    return `${protein} g protein to go.${fits.length ? ` Good fits: ${fits.join(', ')}` : ''}`;
  }
  if (i.hour >= 16 && i.water_ml < 0.6 * i.targets.water_ml) return 'You are behind on water. Drink a glass now.';
  if (!i.hasWeighIn) return 'No weigh-in today. Log your weight on the Progress tab.';
  if (protein <= 15) return 'Protein target reached.';
  return null;
}

/** Days with a food log, walking back from today. One missed day is forgiven; two in a row end the streak. */
export function streak(loggedDates: Iterable<string>, today: string): number {
  const logged = new Set(loggedDates);
  let count = 0;
  let missed = 0;
  for (let d = today; missed < 2; d = addDays(d, -1)) {
    if (logged.has(d)) {
      count++;
      missed = 0;
    } else {
      missed++;
    }
  }
  return count;
}

export function overloadHint(lastSets: readonly { weight_kg: number; reps: number }[], exercise: { sets: number; topReps: number }): boolean {
  return lastSets.length >= exercise.sets && lastSets.every((s) => s.weight_kg > 0 && s.reps >= exercise.topReps);
}

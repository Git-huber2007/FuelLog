import type { WorkoutSet } from './api';

type Logged = Pick<WorkoutSet, 'weight_kg' | 'reps' | 'incline_pct'>;

const KCAL_PER_ML_O2 = 0.005;
const MIN_PER_LIFT_SET = 3; // the set itself plus the rest after it
const LIFT_MET = 3.5;
const CARDIO_MET = 7; // used when only minutes are logged

/** Oxygen cost in ml per kg per minute from the ACSM walking and running equations. Speed in metres per minute, grade as a fraction. */
function vo2(speed: number, grade: number): number {
  const running = speed >= 134; // 8 km/h
  const slope = grade < 0 ? grade / 2 : grade; // going downhill saves less than the same climb costs
  return Math.max(3.5, (running ? 0.2 : 0.1) * speed + (running ? 0.9 : 1.8) * speed * slope + 3.5);
}

/**
 * Estimated energy burned by walking a number of steps, in kcal: about 0.04 kcal a step at 70 kg.
 * shortcut: ignores stride length and pace, so brisk walkers and runners burn more than shown; replace with device data if the app ever reads a pedometer.
 */
export const stepsKcal = (steps: number, bodyKg: number): number => Math.round(steps * bodyKg * 0.00057);

/**
 * Estimated energy burned by the sets logged in one workout, in kcal.
 * shortcut: lifting is a flat 3.5 MET for three minutes a set and all cardio uses the walking and running equations,
 * so cycling, rowing and very heavy lifting are rough; use heart-rate data if the app ever reads a wearable.
 */
export function workoutKcal(exercises: readonly { cardio?: boolean; logged: readonly Logged[] }[], bodyKg: number): number {
  let kcal = 0;
  for (const exercise of exercises) {
    for (const set of exercise.logged) {
      if (set.reps <= 0) continue;
      // Cardio rows hold kilometres in weight_kg and minutes in reps.
      const perMinute = !exercise.cardio ? LIFT_MET * 3.5
        : set.weight_kg > 0 ? vo2((set.weight_kg * 1000) / set.reps, (set.incline_pct ?? 0) / 100) : CARDIO_MET * 3.5;
      kcal += perMinute * bodyKg * KCAL_PER_ML_O2 * (exercise.cardio ? set.reps : MIN_PER_LIFT_SET);
    }
  }
  return Math.round(kcal);
}

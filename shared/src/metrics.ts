import type { ExerciseKind } from './split';
import type { WorkoutSet } from './api';

/**
 * Estimated 1 Rep Max using the Epley formula: weight * (1 + reps / 30).
 * For weighted bodyweight exercises, total load = bodyweight + added load.
 * For 1 rep, e1RM equals the weight lifted.
 * For 0 reps or non-positive weight, returns 0.
 */
export function e1RM(
  weight_kg: number,
  reps: number,
  bodyweight_kg: number = 70,
  kind: ExerciseKind = 'weight_reps'
): number {
  if (reps <= 0) return 0;
  const load = kind === 'weighted_bodyweight' ? bodyweight_kg + Math.max(0, weight_kg) : weight_kg;
  if (load <= 0) return 0;
  if (reps === 1) return Math.round(load * 10) / 10;
  const val = load * (1 + reps / 30);
  return Math.round(val * 10) / 10;
}

/**
 * Calculates total session volume (sum of weight_kg * reps).
 * Bodyweight-only and duration exercises contribute 0 kg volume.
 */
export function sessionVolume(sets: readonly WorkoutSet[]): number {
  return sets.reduce((sum, s) => {
    if (s.reps > 0 && s.weight_kg > 0) {
      return sum + s.weight_kg * s.reps;
    }
    return sum;
  }, 0);
}

/**
 * Scalar metric score for a set used for sorting and PR comparisons.
 * Higher is always better in this scalar representation:
 * - weight_reps / weighted_bodyweight: e1RM in kg
 * - bodyweight_reps: reps count
 * - duration: duration in seconds
 * - assisted_bodyweight: negative assistance weight (e.g. -20kg > -30kg)
 * - cardio: distance in km (or reps in min if no distance)
 */
export function calculateKindMetric(
  set: WorkoutSet,
  kind: ExerciseKind,
  bodyweight_kg: number = 70
): number {
  if (set.reps <= 0 && kind !== 'assisted_bodyweight') return 0;

  switch (kind) {
    case 'weight_reps':
    case 'weighted_bodyweight':
      return e1RM(set.weight_kg, set.reps, bodyweight_kg, kind);
    case 'bodyweight_reps':
    case 'duration':
      return set.reps;
    case 'assisted_bodyweight':
      // For assisted bodyweight, lower weight is better; if reps > 0, return -weight_kg
      return set.reps > 0 ? -set.weight_kg : -Infinity;
    case 'cardio':
      return set.weight_kg > 0 ? set.weight_kg : set.reps;
    default:
      return set.reps;
  }
}

/**
 * Finds the best set in a group of sets based on the exercise kind's primary metric.
 */
export function bestSet(
  sets: readonly WorkoutSet[],
  kind: ExerciseKind,
  bodyweight_kg: number = 70,
  targetReps: number = 8
): WorkoutSet | null {
  const valid = sets.filter((s) => s.reps > 0);
  if (!valid.length) return null;

  if (kind === 'assisted_bodyweight') {
    // For assisted: lowest assistance among sets that reached at least targetReps,
    // or lowest assistance overall if none reached target.
    const qualified = valid.filter((s) => s.reps >= targetReps);
    const pool = qualified.length ? qualified : valid;
    return pool.reduce((best, s) => (s.weight_kg < best.weight_kg ? s : best));
  }

  let best = valid[0];
  let bestScore = calculateKindMetric(best, kind, bodyweight_kg);

  for (let i = 1; i < valid.length; i++) {
    const score = calculateKindMetric(valid[i], kind, bodyweight_kg);
    if (score > bestScore) {
      bestScore = score;
      best = valid[i];
    }
  }

  return best;
}

/**
 * Determines whether a newly logged set beats the historical personal record (PR).
 * Edge cases:
 * - First-ever session: returns false (no previous record was beaten; today sets the baseline).
 * - Ties: returns false (must strictly beat previous all-time best).
 * - Assisted bodyweight: lower assistance weight at >= target reps beats previous.
 */
export function isNewPR(
  newSet: WorkoutSet,
  previousSets: readonly WorkoutSet[],
  kind: ExerciseKind,
  targetReps: number = 8,
  bodyweight_kg: number = 70
): boolean {
  if (newSet.reps <= 0) return false;

  const validPrev = previousSets.filter((s) => s.reps > 0);
  if (!validPrev.length) {
    // First-ever session sets the baseline; it doesn't beat an existing record
    return false;
  }

  if (kind === 'assisted_bodyweight') {
    // Assisted bodyweight: must achieve target reps (or newSet.reps) with strictly LOWER assistance weight
    const previousQualified = validPrev.filter((s) => s.reps >= targetReps);
    if (!previousQualified.length) {
      // If no past set achieved target reps and new set does, it's a PR
      return newSet.reps >= targetReps;
    }
    const lowestPrevAssistance = Math.min(...previousQualified.map((s) => s.weight_kg));
    return newSet.reps >= targetReps && newSet.weight_kg < lowestPrevAssistance;
  }

  const newScore = calculateKindMetric(newSet, kind, bodyweight_kg);
  if (newScore <= 0) return false;

  const maxPrevScore = Math.max(...validPrev.map((s) => calculateKindMetric(s, kind, bodyweight_kg)));

  // Strict greater than - ties do not count as a PR
  return newScore > maxPrevScore;
}

/**
 * Formats the previous session's performance into a concise, readable hint for the set row.
 * e.g. "60×10", "+10×8", "−20×8", "15 reps", "45 s", "5km in 30m"
 */
export function formatPreviousHint(set: WorkoutSet | undefined, kind: ExerciseKind): string {
  if (!set || (set.reps <= 0 && set.weight_kg <= 0)) return '—';

  switch (kind) {
    case 'duration':
      return `${set.reps} s`;
    case 'bodyweight_reps':
      return `${set.reps} reps`;
    case 'weighted_bodyweight':
      return set.weight_kg > 0 ? `+${set.weight_kg}×${set.reps}` : `${set.reps} reps`;
    case 'assisted_bodyweight':
      return `−${set.weight_kg}×${set.reps}`;
    case 'cardio':
      if (set.weight_kg > 0 && set.reps > 0) return `${set.weight_kg}km in ${set.reps}m`;
      if (set.weight_kg > 0) return `${set.weight_kg} km`;
      return `${set.reps} min`;
    case 'weight_reps':
    default:
      return set.weight_kg > 0 ? `${set.weight_kg}×${set.reps}` : `${set.reps} reps`;
  }
}

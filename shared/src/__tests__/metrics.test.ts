import { describe, expect, it } from 'vitest';
import {
  bestSet,
  calculateKindMetric,
  e1RM,
  formatPreviousHint,
  isNewPR,
  sessionVolume,
  type WorkoutSet,
} from '../index';

describe('e1RM (Epley formula)', () => {
  it('calculates e1RM for normal weight_reps', () => {
    // 1 rep equals the weight lifted
    expect(e1RM(100, 1)).toBe(100);
    // 100 kg for 10 reps -> 100 * (1 + 10/30) = 133.3
    expect(e1RM(100, 10)).toBe(133.3);
    // 60 kg for 6 reps -> 60 * (1 + 6/30) = 72
    expect(e1RM(60, 6)).toBe(72);
    // 0 reps or non-positive weight returns 0
    expect(e1RM(100, 0)).toBe(0);
    expect(e1RM(0, 10)).toBe(0);
    expect(e1RM(-10, 5)).toBe(0);
  });

  it('calculates e1RM for weighted_bodyweight using bodyweight + added load', () => {
    // Bodyweight 70kg + 10kg added for 6 reps: (70+10) * (1 + 6/30) = 80 * 1.2 = 96
    expect(e1RM(10, 6, 70, 'weighted_bodyweight')).toBe(96);
    // 1 rep of +20kg on 80kg bodyweight = 100
    expect(e1RM(20, 1, 80, 'weighted_bodyweight')).toBe(100);
  });
});

describe('sessionVolume', () => {
  it('sums weight_kg * reps across completed sets', () => {
    const sets: WorkoutSet[] = [
      { log_date: '2026-10-14', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null },
      { log_date: '2026-10-14', exercise_key: 'mon-bench-press', set_number: 2, weight_kg: 70, reps: 8, incline_pct: null },
      { log_date: '2026-10-14', exercise_key: 'mon-bench-press', set_number: 3, weight_kg: 80, reps: 0, incline_pct: null }, // incomplete
    ];
    // (60 * 10) + (70 * 8) = 600 + 560 = 1160
    expect(sessionVolume(sets)).toBe(1160);
  });

  it('returns 0 for bodyweight-only or duration sets with 0 kg', () => {
    const sets: WorkoutSet[] = [
      { log_date: '2026-10-14', exercise_key: 'Push-up', set_number: 1, weight_kg: 0, reps: 25, incline_pct: null },
      { log_date: '2026-10-14', exercise_key: 'Plank', set_number: 1, weight_kg: 0, reps: 60, incline_pct: null },
    ];
    expect(sessionVolume(sets)).toBe(0);
  });
});

describe('bestSet', () => {
  it('selects the set that maximizes e1RM for weight_reps', () => {
    const s1: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 1, weight_kg: 80, reps: 5, incline_pct: null }; // e1RM = 93.3
    const s2: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 2, weight_kg: 70, reps: 12, incline_pct: null }; // e1RM = 98.0
    const s3: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 3, weight_kg: 85, reps: 3, incline_pct: null }; // e1RM = 93.5

    expect(bestSet([s1, s2, s3], 'weight_reps')).toBe(s2);
  });

  it('selects the set with max reps for bodyweight_reps and duration', () => {
    const s1: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'pushup', set_number: 1, weight_kg: 0, reps: 20, incline_pct: null };
    const s2: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'pushup', set_number: 2, weight_kg: 0, reps: 25, incline_pct: null };
    expect(bestSet([s1, s2], 'bodyweight_reps')).toBe(s2);

    const d1: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 45, incline_pct: null };
    const d2: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'plank', set_number: 2, weight_kg: 0, reps: 60, incline_pct: null };
    expect(bestSet([d1, d2], 'duration')).toBe(d2);
  });

  it('selects lowest assistance at target reps for assisted_bodyweight', () => {
    // Target reps = 8
    const s1: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'pullup', set_number: 1, weight_kg: 30, reps: 8, incline_pct: null };
    const s2: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'pullup', set_number: 2, weight_kg: 20, reps: 8, incline_pct: null }; // Lower assistance at target reps!
    const s3: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'pullup', set_number: 3, weight_kg: 10, reps: 4, incline_pct: null }; // Lower assistance but short of target

    expect(bestSet([s1, s2, s3], 'assisted_bodyweight', 70, 8)).toBe(s2);
  });
});

describe('isNewPR', () => {
  const pastSets: WorkoutSet[] = [
    { log_date: '2026-10-07', exercise_key: 'bench', set_number: 1, weight_kg: 80, reps: 6, incline_pct: null }, // e1RM = 96.0
    { log_date: '2026-10-07', exercise_key: 'bench', set_number: 2, weight_kg: 80, reps: 6, incline_pct: null },
  ];

  it('first-ever session does not trigger a PR (baseline only)', () => {
    const firstSet: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 1, weight_kg: 100, reps: 10, incline_pct: null };
    expect(isNewPR(firstSet, [], 'weight_reps')).toBe(false);
  });

  it('detects a strict improvement as a PR', () => {
    // 85kg x 6 -> e1RM = 102.0 > 96.0
    const prSet: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 1, weight_kg: 85, reps: 6, incline_pct: null };
    expect(isNewPR(prSet, pastSets, 'weight_reps')).toBe(true);
  });

  it('ties do not count as PRs', () => {
    // Same performance: 80kg x 6 -> e1RM = 96.0
    const tieSet: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'bench', set_number: 1, weight_kg: 80, reps: 6, incline_pct: null };
    expect(isNewPR(tieSet, pastSets, 'weight_reps')).toBe(false);
  });

  it('handles assisted bodyweight where lower assistance is better', () => {
    const pastAssisted: WorkoutSet[] = [
      { log_date: '2026-10-07', exercise_key: 'assisted-pullup', set_number: 1, weight_kg: 25, reps: 8, incline_pct: null },
    ];

    // Dropping assistance from 25kg to 20kg at 8 reps is a PR!
    const improvedAssisted: WorkoutSet = {
      log_date: '2026-10-14', exercise_key: 'assisted-pullup', set_number: 1, weight_kg: 20, reps: 8, incline_pct: null,
    };
    expect(isNewPR(improvedAssisted, pastAssisted, 'assisted_bodyweight', 8)).toBe(true);

    // Higher assistance (30kg) is NOT a PR
    const worseAssisted: WorkoutSet = {
      log_date: '2026-10-14', exercise_key: 'assisted-pullup', set_number: 1, weight_kg: 30, reps: 8, incline_pct: null,
    };
    expect(isNewPR(worseAssisted, pastAssisted, 'assisted_bodyweight', 8)).toBe(false);

    // Lower assistance but failing to reach target reps (e.g. 15kg for 5 reps) is NOT a PR
    const shortAssisted: WorkoutSet = {
      log_date: '2026-10-14', exercise_key: 'assisted-pullup', set_number: 1, weight_kg: 15, reps: 5, incline_pct: null,
    };
    expect(isNewPR(shortAssisted, pastAssisted, 'assisted_bodyweight', 8)).toBe(false);
  });

  it('handles duration holds', () => {
    const pastHolds: WorkoutSet[] = [
      { log_date: '2026-10-07', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 45, incline_pct: null },
    ];
    // 60s hold beats 45s
    const prHold: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 60, incline_pct: null };
    expect(isNewPR(prHold, pastHolds, 'duration')).toBe(true);

    // 40s hold does not beat 45s
    const worseHold: WorkoutSet = { log_date: '2026-10-14', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 40, incline_pct: null };
    expect(isNewPR(worseHold, pastHolds, 'duration')).toBe(false);
  });
});

describe('formatPreviousHint', () => {
  it('formats previous hints appropriately per exercise kind', () => {
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'bench', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null }, 'weight_reps')).toBe('60×10');
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'dip', set_number: 1, weight_kg: 10, reps: 8, incline_pct: null }, 'weighted_bodyweight')).toBe('+10×8');
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'pullup', set_number: 1, weight_kg: 20, reps: 8, incline_pct: null }, 'assisted_bodyweight')).toBe('−20×8');
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'pushup', set_number: 1, weight_kg: 0, reps: 25, incline_pct: null }, 'bodyweight_reps')).toBe('25 reps');
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 45, incline_pct: null }, 'duration')).toBe('45 s');
    expect(formatPreviousHint({ log_date: '2026-10-07', exercise_key: 'run', set_number: 1, weight_kg: 5, reps: 30, incline_pct: null }, 'cardio')).toBe('5km in 30m');
    expect(formatPreviousHint(undefined, 'weight_reps')).toBe('—');
  });
});describe('calculateKindMetric', () => {
  it('computes correct primary metric across all kinds', () => {
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'bench', set_number: 1, weight_kg: 80, reps: 6, incline_pct: null }, 'weight_reps')).toBe(96);
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'dip', set_number: 1, weight_kg: 10, reps: 6, incline_pct: null }, 'weighted_bodyweight', 70)).toBe(96);
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'pushup', set_number: 1, weight_kg: 0, reps: 30, incline_pct: null }, 'bodyweight_reps')).toBe(30);
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'plank', set_number: 1, weight_kg: 0, reps: 75, incline_pct: null }, 'duration')).toBe(75);
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'pullup', set_number: 1, weight_kg: 15, reps: 8, incline_pct: null }, 'assisted_bodyweight')).toBe(-15);
    expect(calculateKindMetric({ log_date: '2026-10-14', exercise_key: 'run', set_number: 1, weight_kg: 5.5, reps: 25, incline_pct: null }, 'cardio')).toBe(5.5);
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LEAN_SIX_DAY_TEMPLATE, lookupExerciseKind } from '@fuellog/shared';
import { TIPS } from '../components/workout/coachingTips';

test('every lean-template exercise except cardio has a coaching tip', () => {
  const missing = LEAN_SIX_DAY_TEMPLATE.days.flatMap((d) => d.exercises)
    .filter((e) => lookupExerciseKind(e.key) !== 'cardio' && !TIPS[e.key])
    .map((e) => e.key);
  assert.deepEqual(missing, []);
});

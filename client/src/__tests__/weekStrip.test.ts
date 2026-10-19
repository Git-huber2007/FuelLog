import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayState } from '../components/today/WeekStrip';

test('dayState uses the 10% target band', () => {
  const t = 2000;
  assert.equal(dayState({ date: '', kcal: 0, target: t }), 'empty');
  assert.equal(dayState({ date: '', kcal: 1700, target: t }), 'under');
  assert.equal(dayState({ date: '', kcal: 1800, target: t }), 'on');
  assert.equal(dayState({ date: '', kcal: 2200, target: t }), 'on');
  assert.equal(dayState({ date: '', kcal: 2201, target: t }), 'over');
});

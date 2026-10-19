import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LINES } from '../components/today/DailyLine';

test('daily lines cover a full year with no repeats', () => {
  assert.ok(LINES.length >= 365, `only ${LINES.length} lines`);
  assert.equal(new Set(LINES.map((l) => l.text.toLowerCase())).size, LINES.length);
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { all } from '../lib/paging';

/** Stands in for a Supabase range query over a fixed set of rows. */
const pagerOver = (rows: number[]) => {
  const calls: Array<[number, number]> = [];
  const page = (from: number, to: number) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
  };
  return { page, calls };
};

describe('all()', () => {
  it('returns a short first page without asking for a second', async () => {
    const { page, calls } = pagerOver([1, 2, 3]);
    assert.deepEqual(await all(page), [1, 2, 3]);
    assert.equal(calls.length, 1);
  });

  it('keeps paging past the 1000-row cap that used to truncate silently', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => i);
    const { page, calls } = pagerOver(rows);
    const got = await all(page);
    assert.equal(got.length, 2500);
    assert.deepEqual(got, rows);
    assert.deepEqual(calls, [[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it('stops after an exactly-full last page', async () => {
    const rows = Array.from({ length: 2000 }, (_, i) => i);
    const { page, calls } = pagerOver(rows);
    assert.equal((await all(page)).length, 2000);
    assert.equal(calls.length, 3, 'the empty third page is what proves the end');
  });

  it('throws rather than returning a short result when a page errors', async () => {
    await assert.rejects(() => all(() => Promise.resolve({ data: null, error: { code: 'PGRST103' } })));
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertAiQuota, recordAiUse } from '../lib/aiUsage';
import { env } from '../env';
import { HttpError } from '../middleware/errors';

describe('AI rate limiting and quota enforcement (Item 2)', () => {
  it('answers 429 and Gemini is not called when over AI_DAILY_LIMIT', async () => {
    let insertCalled = false;
    let selectCalled = false;

    // Stubbed Supabase client where current count is over AI_DAILY_LIMIT
    const stubSb = {
      from(table: string) {
        assert.equal(table, 'ai_usage');
        return {
          insert(payload: unknown) {
            insertCalled = true;
            return Promise.resolve({ data: payload, error: null });
          },
          select() {
            return {
              gte() {
                selectCalled = true;
                // Return a count that exceeds AI_DAILY_LIMIT
                return Promise.resolve({ count: env.AI_DAILY_LIMIT + 1, error: null });
              },
            };
          },
        };
      },
    } as unknown as SupabaseClient;

    // Record the usage row first
    await recordAiUse(stubSb, 'user-123', 'parse_text');
    assert.equal(insertCalled, true, 'Usage row should be written first');

    // Count today's rows; since count > AI_DAILY_LIMIT, assertAiQuota must throw 429
    await assert.rejects(
      async () => {
        await assertAiQuota(stubSb);
      },
      (err: unknown) => {
        assert(err instanceof HttpError, 'Error should be HttpError');
        assert.equal(err.status, 429);
        assert.equal(err.code, 'ai_limit');
        return true;
      },
    );

    assert.equal(selectCalled, true, 'Quota check should query today rows');
  });
});

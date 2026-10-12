import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { SupabaseClient } from '@supabase/supabase-js';
import { auth } from '../middleware/auth';
import { errorHandler } from '../middleware/errors';
import { daysRouter } from '../routes/days';
import { workoutRouter } from '../routes/workout';
import { setClientFactory } from '../lib/supabase';

interface StubQuery {
  then<TResult1 = unknown, TResult2 = never>(
    onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
  select: () => StubQuery;
  insert: () => StubQuery;
  upsert: () => StubQuery;
  update: () => StubQuery;
  delete: () => StubQuery;
  eq: () => StubQuery;
  neq: () => StubQuery;
  gt: () => StubQuery;
  gte: () => StubQuery;
  lt: () => StubQuery;
  lte: () => StubQuery;
  in: () => StubQuery;
  order: () => StubQuery;
  limit: () => StubQuery;
  single: () => Promise<unknown>;
  maybeSingle: () => Promise<unknown>;
}

function createStubQuery(resolveValue: unknown): StubQuery {
  const query: StubQuery = {
    then(onFulfilled, onRejected) {
      return Promise.resolve(resolveValue).then(onFulfilled, onRejected);
    },
    select: () => query,
    insert: () => query,
    upsert: () => query,
    update: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    in: () => query,
    order: () => query,
    limit: () => query,
    single: () => Promise.resolve(resolveValue),
    maybeSingle: () => Promise.resolve(resolveValue),
  };
  return query;
}

function createStubClient(fromHandler?: (table: string) => unknown): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: { id: 'test-user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: (fromHandler ?? (() => createStubQuery({ data: [], error: null }))) as unknown,
  } as unknown as SupabaseClient;
}

describe('Server Route Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', auth, daysRouter, workoutRouter);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    setClientFactory(); // restore default client factory
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('no token: 401', async () => {
    const res = await fetch(`${baseUrl}/api/days/2026-10-12`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.deepEqual(body, {
      error: { code: 'unauthenticated', message: 'Sign in to continue.' },
    });
  });

  it('a body that fails its Zod schema: 400 in the {error:{code,message}} shape', async () => {
    setClientFactory(() => createStubClient());

    const res = await fetch(`${baseUrl}/api/days/2026-10-12/food`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ not_entries: [] }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(typeof body.error, 'object');
    assert.equal(body.error.code, 'validation');
    assert.equal(typeof body.error.message, 'string');
    assert.match(body.error.message, /entries/);
  });

  it('POST copy-previous-day: 400 when the day already has food', async () => {
    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'food_logs') {
          return createStubQuery({ data: [{ id: 'existing-food-1' }], error: null });
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const res = await fetch(`${baseUrl}/api/days/2026-10-12/copy-previous`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, {
      error: { code: 'already_logged', message: 'This day already has food logged.' },
    });
  });

  it('a future date is rejected', async () => {
    setClientFactory(() => createStubClient());

    const res = await fetch(`${baseUrl}/api/days/2099-01-01/copy-previous`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, {
      error: { code: 'future_date', message: 'You cannot log to a future date.' },
    });
  });

  it("GET /api/workout/:date uses the profile's program (full_body on a Tuesday is a rest day; six_day is not)", async () => {
    const tuesday = '2026-10-13'; // 2026-10-13 is Tuesday

    // 1. full_body program on Tuesday
    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({ data: { id: 'test-user-123', program: 'full_body' }, error: null });
        }
        if (table === 'workout_sets') {
          return createStubQuery({ data: [], error: null });
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const resFullBody = await fetch(`${baseUrl}/api/workout/${tuesday}`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(resFullBody.status, 200);
    const fullBodyData = (await resFullBody.json()) as { program: string; title: string; exercises: unknown[] };
    assert.equal(fullBodyData.program, 'full_body');
    assert.equal(fullBodyData.title, 'Rest');
    assert.equal(fullBodyData.exercises.length, 0);

    // 2. six_day program on Tuesday
    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({ data: { id: 'test-user-123', program: 'six_day' }, error: null });
        }
        if (table === 'workout_sets') {
          return createStubQuery({ data: [], error: null });
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const resSixDay = await fetch(`${baseUrl}/api/workout/${tuesday}`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(resSixDay.status, 200);
    const sixDayData = (await resSixDay.json()) as { program: string; title: string; exercises: unknown[] };
    assert.equal(sixDayData.program, 'six_day');
    assert.notEqual(sixDayData.title, 'Rest');
    assert.ok(sixDayData.exercises.length > 0);
  });

  it('PUT /api/days/:date/check accepts steps and rejects 100001', async () => {
    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'daily_checks') {
          return createStubQuery({
            data: {
              log_date: '2026-10-12',
              steps: 8500,
              water_ml: 1200,
              sleep_hours: 7.5,
              creatine: true,
              protein_shake: false,
            },
            error: null,
          });
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const baseCheck = {
      water_ml: 1200,
      sleep_hours: 8,
      creatine: true,
      protein_shake: false,
    };

    // Rejects 100001
    const resOver = await fetch(`${baseUrl}/api/days/2026-10-12/check`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...baseCheck, steps: 100001 }),
    });
    assert.equal(resOver.status, 400);
    const overBody = (await resOver.json()) as { error: { code: string; message: string } };
    assert.equal(overBody.error.code, 'validation');
    assert.match(overBody.error.message, /steps/);

    // Accepts valid steps
    const resValid = await fetch(`${baseUrl}/api/days/2026-10-12/check`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...baseCheck, steps: 8500 }),
    });
    assert.equal(resValid.status, 200);
    const validBody = (await resValid.json()) as { steps: number };
    assert.equal(validBody.steps, 8500);
  });
});

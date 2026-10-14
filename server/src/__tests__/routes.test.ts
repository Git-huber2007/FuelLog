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
import { routineRouter } from '../routes/routine';
import { exercisesRouter } from '../routes/exercises';
import { progressRouter } from '../routes/progress';
import { profileRouter } from '../routes/profile';
import { aiRouter } from '../routes/ai';
import { setClientFactory } from '../lib/supabase';
import { env } from '../env';

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

function createStubClient(
  fromHandler?: (table: string) => unknown,
  storageHandler?: unknown,
  rpcHandler?: (fn: string, params?: unknown) => unknown,
): SupabaseClient {
  return {
    auth: {
      getUser: async () => ({
        data: { user: { id: 'test-user-123', email: 'test@example.com' } },
        error: null,
      }),
    },
    from: (fromHandler ?? (() => createStubQuery({ data: [], error: null }))) as unknown,
    storage: (storageHandler ?? {
      from: () => ({
        list: () => Promise.resolve({ data: [], error: null }),
        remove: () => Promise.resolve({ data: [], error: null }),
      }),
    }) as unknown,
    rpc: (rpcHandler ?? (() => Promise.resolve({ data: null, error: null }))) as unknown,
  } as unknown as SupabaseClient;
}

describe('Server Route Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const app = express();
    app.use('/api/ai/parse-photo', express.json({ limit: '6mb' }));
    app.use(express.json({ limit: '100kb' }));
    app.use('/api', auth, profileRouter, daysRouter, workoutRouter, routineRouter, exercisesRouter, progressRouter, aiRouter);
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
    server.closeAllConnections();
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

  it('account deletion: files removed before the function is called', async () => {
    const callOrder: string[] = [];
    let removedPaths: string[] = [];

    const stubStorage = {
      from(bucket: string) {
        assert.equal(bucket, 'progress-photos');
        return {
          list(folder: string) {
            assert.equal(folder, 'test-user-123');
            return Promise.resolve({
              data: [{ name: 'pic1.jpg' }, { name: 'pic2.jpg' }],
              error: null,
            });
          },
          remove(paths: string[]) {
            callOrder.push('storage.remove');
            removedPaths = paths;
            return Promise.resolve({ data: paths, error: null });
          },
        };
      },
    };

    const stubRpc = (fnName: string) => {
      callOrder.push(`rpc.${fnName}`);
      return Promise.resolve({ data: null, error: null });
    };

    setClientFactory(() => createStubClient(undefined, stubStorage, stubRpc));

    const res = await fetch(`${baseUrl}/api/account`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(res.status, 204);
    assert.deepEqual(removedPaths, ['test-user-123/pic1.jpg', 'test-user-123/pic2.jpg']);
    assert.deepEqual(callOrder, ['storage.remove', 'rpc.delete_my_account']);
  });

  it('account deletion: a storage failure means the function is never called', async () => {
    let rpcCalled = false;

    const stubStorage = {
      from(bucket: string) {
        assert.equal(bucket, 'progress-photos');
        return {
          list(folder: string) {
            assert.equal(folder, 'test-user-123');
            return Promise.resolve({
              data: null,
              error: { message: 'Storage bucket unavailable' },
            });
          },
          remove() {
            return Promise.resolve({ data: null, error: null });
          },
        };
      },
    };

    const stubRpc = () => {
      rpcCalled = true;
      return Promise.resolve({ data: null, error: null });
    };

    setClientFactory(() => createStubClient(undefined, stubStorage, stubRpc));

    const res = await fetch(`${baseUrl}/api/account`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(res.status, 500);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'storage_error');
    assert.equal(rpcCalled, false, 'delete_my_account must never be called if storage fails');
  });

  it('the AI route at the limit inserts nothing', async () => {
    let insertCalled = false;
    const origKey = env.GEMINI_API_KEY;
    (env as { GEMINI_API_KEY: string }).GEMINI_API_KEY = 'test-gemini-key';

    try {
      setClientFactory(() =>
        createStubClient((table) => {
          if (table === 'ai_usage') {
            return {
              select() {
                return {
                  gte() {
                    // Current count is at limit (40)
                    return Promise.resolve({ count: env.AI_DAILY_LIMIT, error: null });
                  },
                };
              },
              insert() {
                insertCalled = true;
                return Promise.resolve({ data: [], error: null });
              },
            };
          }
          return createStubQuery({ data: [], error: null });
        }),
      );

      const res = await fetch(`${baseUrl}/api/ai/parse-text`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '2 eggs and toast',
          date: '2026-10-12',
          meal: 'breakfast',
        }),
      });

      assert.equal(res.status, 429);
      const body = (await res.json()) as { error: { code: string } };
      assert.equal(body.error.code, 'ai_limit');
      assert.equal(insertCalled, false, 'AI route at limit must not insert usage rows');
    } finally {
      (env as { GEMINI_API_KEY: string }).GEMINI_API_KEY = origKey;
    }
  });

  it('a 200 kB body on a normal route is refused', async () => {
    const largePayload = {
      entries: [
        {
          meal: 'breakfast',
          name: 'x'.repeat(200 * 1024),
          servings: 1,
          kcal: 100,
          protein_g: 10,
          carbs_g: 10,
          fat_g: 0,
          fibre_g: 0,
          source: 'list',
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/days/2026-10-12/food`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(largePayload),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'too_large');
  });

  it('GET /api/workout/:date returns custom day for program=custom, and rest if not configured', async () => {
    const tuesday = '2026-10-13'; // weekday 2
    const wednesday = '2026-10-14'; // weekday 3

    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({ data: { id: 'test-user-123', program: 'custom' }, error: null });
        }
        if (table === 'workout_sets') {
          return createStubQuery({ data: [], error: null });
        }
        if (table === 'routine_days') {
          return {
            select() {
              return {
                eq(_col: string, val: number) {
                  return {
                    maybeSingle() {
                      if (val === 2) {
                        return Promise.resolve({
                          data: {
                            weekday: 2,
                            title: 'My Custom Leg Day',
                            exercises: [{ key: 'sat-squat-or-leg-press', sets: 4, reps_low: 6, reps_high: 8 }],
                          },
                          error: null,
                        });
                      }
                      return Promise.resolve({ data: null, error: null });
                    },
                  };
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    // Tuesday has a custom routine configured
    const resTue = await fetch(`${baseUrl}/api/workout/${tuesday}`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(resTue.status, 200);
    const dataTue = (await resTue.json()) as { program: string; title: string; exercises: Array<{ key: string; sets: number; topReps: number; prescription: string }>; muscles: string[] };
    assert.equal(dataTue.program, 'custom');
    assert.equal(dataTue.title, 'My Custom Leg Day');
    assert.equal(dataTue.exercises.length, 1);
    assert.equal(dataTue.exercises[0].key, 'sat-squat-or-leg-press');
    assert.equal(dataTue.exercises[0].sets, 4);
    assert.equal(dataTue.exercises[0].topReps, 8);
    assert.equal(dataTue.exercises[0].prescription, '4×6–8');
    assert.ok(dataTue.muscles.includes('quads'));

    // Wednesday has no routine row -> treated as Rest day
    const resWed = await fetch(`${baseUrl}/api/workout/${wednesday}`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(resWed.status, 200);
    const dataWed = (await resWed.json()) as { program: string; title: string; exercises: unknown[] };
    assert.equal(dataWed.program, 'custom');
    assert.equal(dataWed.title, 'Rest');
    assert.equal(dataWed.exercises.length, 0);
  });

  it('PUT /api/routine/:weekday validates body with RoutineDayInput (rejects unknown keys and >15 exercises)', async () => {
    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'routine_days') {
          return {
            upsert(payload: unknown) {
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: payload, error: null });
                    },
                  };
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    // 1. Rejects unknown exercise key
    const resUnknown = await fetch(`${baseUrl}/api/routine/1`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Chest day',
        exercises: [{ key: 'nonexistent-lift-123', sets: 3, reps_low: 8, reps_high: 12 }],
      }),
    });
    assert.equal(resUnknown.status, 400);
    const errUnknown = (await resUnknown.json()) as { error: { code: string } };
    assert.equal(errUnknown.error.code, 'validation');

    // 2. Rejects >15 exercises
    const sixteenExercises = Array.from({ length: 16 }, () => ({
      key: 'mon-bench-press',
      sets: 3,
      reps_low: 8,
      reps_high: 12,
    }));
    const resTooMany = await fetch(`${baseUrl}/api/routine/1`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Overloaded day',
        exercises: sixteenExercises,
      }),
    });
    assert.equal(resTooMany.status, 400);
    const errTooMany = (await resTooMany.json()) as { error: { code: string } };
    assert.equal(errTooMany.error.code, 'validation');

    // 3. Accepts valid routine day
    const resValid = await fetch(`${baseUrl}/api/routine/1`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Push day',
        exercises: [{ key: 'mon-bench-press', sets: 3, reps_low: 8, reps_high: 12 }],
      }),
    });
    assert.equal(resValid.status, 200);
  });

  it("RLS stops user A reading user B's routine and enforces user_id on upsert", async () => {
    let upsertedRow: Record<string, unknown> | null = null;
    const userADatabaseRows = [
      { user_id: 'user-a', weekday: 1, title: "User A's Push Day", exercises: [] },
    ];
    const userBDatabaseRows = [
      { user_id: 'user-b', weekday: 1, title: "User B's Secret Routine", exercises: [] },
    ];

    // Simulate Supabase client authenticated as user-a (where RLS policy user_id = auth.uid() applies)
    setClientFactory(() => ({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'user-a', email: 'user-a@example.com' } },
          error: null,
        }),
      },
      from: (table: string) => {
        if (table === 'routine_days') {
          return {
            select() {
              return {
                order() {
                  // RLS filters table to auth.uid() == 'user-a'
                  const rlsFiltered = [...userADatabaseRows, ...userBDatabaseRows].filter(
                    (row) => row.user_id === 'user-a',
                  );
                  return Promise.resolve({ data: rlsFiltered, error: null });
                },
                eq() {
                  return {
                    maybeSingle() {
                      // Under RLS, user A querying cannot see user B's rows
                      return Promise.resolve({ data: userADatabaseRows[0], error: null });
                    },
                  };
                },
              };
            },
            upsert(payload: Record<string, unknown>) {
              upsertedRow = payload;
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: payload, error: null });
                    },
                  };
                },
              };
            },
            delete() {
              return {
                eq() {
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      },
      storage: {
        from: () => ({
          list: () => Promise.resolve({ data: [], error: null }),
          remove: () => Promise.resolve({ data: [], error: null }),
        }),
      },
      rpc: () => Promise.resolve({ data: null, error: null }),
    } as unknown as SupabaseClient));

    // User A fetches all routines
    const res = await fetch(`${baseUrl}/api/routine`, {
      headers: { Authorization: 'Bearer user-a-token' },
    });
    assert.equal(res.status, 200);
    const routineList = (await res.json()) as Array<{ title: string; user_id?: string }>;
    // User A sees their own routine, but never sees User B's routine
    assert.equal(routineList.length, 1);
    assert.equal(routineList[0].title, "User A's Push Day");
    assert.ok(!routineList.some((r) => r.title === "User B's Secret Routine"));

    // User A performs a PUT: verify server enforces user_id = req.userId ('user-a')
    const putRes = await fetch(`${baseUrl}/api/routine/1`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer user-a-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated title',
        exercises: [],
      }),
    });
    assert.equal(putRes.status, 200);
    assert.equal(upsertedRow?.['user_id'], 'user-a', 'upsert must bind user_id to authenticated req.userId');
  });

  it('PUT /api/days/:date/sets evaluates is_pr against history and returns flag', async () => {
    const pastSets = [
      { log_date: '2026-10-01', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 80, reps: 5, incline_pct: null }, // e1RM = 93.3
    ];

    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({ data: { id: 'test-user-123', weight_kg: 75, program: 'six_day' }, error: null });
        }
        if (table === 'workout_sets') {
          return {
            upsert(payload: unknown) {
              return {
                select() {
                  return {
                    single() {
                      return Promise.resolve({ data: payload, error: null });
                    },
                  };
                },
              };
            },
            select() {
              return {
                eq() {
                  return {
                    lt() {
                      return {
                        gt() {
                          return Promise.resolve({ data: pastSets, error: null });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    // 1. A set that beats past best (90kg x 5 -> e1RM = 105.0 > 93.3)
    const resPR = await fetch(`${baseUrl}/api/days/2026-10-12/sets`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exercise_key: 'mon-bench-press',
        set_number: 1,
        weight_kg: 90,
        reps: 5,
      }),
    });
    assert.equal(resPR.status, 200);
    const bodyPR = (await resPR.json()) as { is_pr: boolean };
    assert.equal(bodyPR.is_pr, true, 'Beating past e1RM must return is_pr = true');

    // 2. A set that fails to beat past best (70kg x 5 -> e1RM = 81.7 < 93.3)
    const resNoPR = await fetch(`${baseUrl}/api/days/2026-10-12/sets`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exercise_key: 'mon-bench-press',
        set_number: 2,
        weight_kg: 70,
        reps: 5,
      }),
    });
    assert.equal(resNoPR.status, 200);
    const bodyNoPR = (await resNoPR.json()) as { is_pr: boolean };
    assert.equal(bodyNoPR.is_pr, false, 'Inferior performance must return is_pr = false');
  });

  it('GET /api/exercises/:key/history returns time-series chart points, PR milestones, and recent sessions', async () => {
    const historyRows = [
      { log_date: '2026-09-01', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null },
      { log_date: '2026-09-08', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 70, reps: 8, incline_pct: null },
      { log_date: '2026-09-15', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 80, reps: 6, incline_pct: null },
    ];

    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({ data: { id: 'test-user-123', weight_kg: 75, program: 'six_day' }, error: null });
        }
        if (table === 'workout_sets') {
          return {
            select() {
              return {
                eq() {
                  return {
                    gt() {
                      return {
                        order() {
                          return {
                            order() {
                              return Promise.resolve({ data: historyRows, error: null });
                            },
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const res = await fetch(`${baseUrl}/api/exercises/mon-bench-press/history`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      key: string;
      name: string;
      kind: string;
      chartPoints: Array<{ date: string; metric: number }>;
      prs: Array<{ date: string; value: number }>;
      recentSessions: Array<{ date: string }>;
    };

    assert.equal(data.key, 'mon-bench-press');
    assert.equal(data.name, 'Bench press');
    assert.equal(data.kind, 'weight_reps');
    assert.equal(data.chartPoints.length, 3);
    assert.equal(data.recentSessions.length, 3);
    assert.ok(data.prs.length >= 1);
  });

  it('GET /api/progress includes topLifts with 4-session trend analysis', async () => {
    const mockSets = [
      { exercise_key: 'mon-bench-press', log_date: '2026-09-01', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null },
      { exercise_key: 'mon-bench-press', log_date: '2026-09-08', set_number: 1, weight_kg: 65, reps: 10, incline_pct: null },
      { exercise_key: 'mon-bench-press', log_date: '2026-09-15', set_number: 1, weight_kg: 70, reps: 10, incline_pct: null },
      { exercise_key: 'mon-bench-press', log_date: '2026-09-22', set_number: 1, weight_kg: 75, reps: 10, incline_pct: null },
    ];

    setClientFactory(() =>
      createStubClient((table) => {
        if (table === 'profiles') {
          return createStubQuery({
            data: {
              id: 'test-user-123',
              sex: 'male',
              age: 28,
              height_cm: 180,
              weight_kg: 75,
              program: 'six_day',
              goal: 'maintain',
              kcal_adjust: 0,
              onboarded: true,
            },
            error: null,
          });
        }
        if (table === 'weight_logs') {
          return createStubQuery({ data: [], error: null });
        }
        if (table === 'food_logs') {
          return {
            select() {
              return {
                gte() {
                  return {
                    lte() {
                      return Promise.resolve({ data: [], error: null });
                    },
                  };
                },
                lte() {
                  return {
                    order() {
                      return {
                        limit() {
                          return Promise.resolve({ data: [], error: null });
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'daily_checks') {
          return {
            select() {
              return {
                gte() {
                  return {
                    lte() {
                      return Promise.resolve({ data: [], error: null });
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'workout_sets') {
          return {
            select() {
              return {
                gte() {
                  return {
                    lte() {
                      return {
                        gt() {
                          return Promise.resolve({ data: [], error: null });
                        },
                      };
                    },
                  };
                },
                lte() {
                  return {
                    gt() {
                      return {
                        order() {
                          return {
                            limit() {
                              return Promise.resolve({ data: mockSets, error: null });
                            },
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'measurements') {
          return {
            select() {
              return {
                order() {
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
          };
        }
        return createStubQuery({ data: [], error: null });
      }),
    );

    const res = await fetch(`${baseUrl}/api/progress`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 200);
    const data = (await res.json()) as { topLifts?: Array<{ key: string; name: string; trend: string; trendDelta: string }> };
    assert.ok(Array.isArray(data.topLifts));
    assert.equal(data.topLifts.length, 1);
    assert.equal(data.topLifts[0].key, 'mon-bench-press');
    assert.equal(data.topLifts[0].trend, 'up', 'Bench press increased across 4 sessions -> trend up');
  });
});


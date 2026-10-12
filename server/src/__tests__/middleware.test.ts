import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { errorHandler, HttpError, notFound, unwrap } from '../middleware/errors';

function createMockRes() {
  const state: { statusCode: number; body: unknown } = { statusCode: 0, body: null };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, state };
}

describe('Server error handling and unwrap utilities', () => {
  it('unwraps successful database results', () => {
    const data = [{ id: '1', name: 'Eggs' }];
    const result = unwrap({ data, error: null });
    assert.deepEqual(result, data);
  });

  it('translates PGRST116 database error to HttpError 404', () => {
    assert.throws(
      () => unwrap({ data: null, error: { code: 'PGRST116' } }),
      (err: unknown) => err instanceof HttpError && err.status === 404 && err.code === 'not_found',
    );
  });

  it('translates unique violation 23505 to HttpError 400', () => {
    assert.throws(
      () => unwrap({ data: null, error: { code: '23505' } }),
      (err: unknown) => err instanceof HttpError && err.status === 400 && err.code === 'duplicate',
    );
  });

  it('translates unhandled database errors to 500 server_error', () => {
    assert.throws(
      () => unwrap({ data: null, error: { code: '42P01' } }),
      (err: unknown) => err instanceof HttpError && err.status === 500 && err.code === 'server_error',
    );
  });

  it('handles 404 not found middleware properly', () => {
    const { res, state } = createMockRes();
    const req = {} as Request;

    notFound(req, res, () => {});
    assert.equal(state.statusCode, 404);
    assert.deepEqual(state.body, { error: { code: 'not_found', message: 'No such route.' } });
  });

  it('errorHandler formats HttpError correctly', () => {
    const { res, state } = createMockRes();
    const req = {} as Request;
    const err = new HttpError(403, 'forbidden', 'Access denied.');

    errorHandler(err, req, res, () => {});
    assert.equal(state.statusCode, 403);
    assert.deepEqual(state.body, { error: { code: 'forbidden', message: 'Access denied.' } });
  });

  it('errorHandler formats ZodError correctly', () => {
    const { res, state } = createMockRes();
    const req = {} as Request;
    const zodErr = new ZodError([]);

    errorHandler(zodErr, req, res, () => {});
    assert.equal(state.statusCode, 400);
    const body = state.body as { error?: { code?: string } };
    assert.equal(body?.error?.code, 'validation');
  });
});

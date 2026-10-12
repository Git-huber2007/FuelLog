import { todayISO } from '@fuellog/shared';
import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Calls the FuelLog API as the signed-in user. A body makes it a POST unless a method is given. */
export async function api<T>(path: string, opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
      headers: {
        Authorization: `Bearer ${data.session?.access_token ?? ''}`,
        'X-Local-Date': todayISO(),
        ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(0, 'offline', 'You seem to be offline. Check your connection and try again.');
  }
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new ApiError(res.status, json?.error?.code ?? 'error', json?.error?.message ?? 'Something went wrong. Try again.');
  }
  if (res.status === 204) return undefined as T;
  return (res.headers.get('content-type')?.includes('json') ? res.json() : res.blob()) as Promise<T>;
}

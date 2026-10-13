import { todayISO } from '@fuellog/shared';
import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

let slowRequestCount = 0;
const slowListeners = new Set<() => void>();

function notifySlowListeners() {
  for (const listener of slowListeners) {
    listener();
  }
}

export function subscribeSlowRequests(listener: () => void): () => void {
  slowListeners.add(listener);
  return () => {
    slowListeners.delete(listener);
  };
}

export function getSlowRequestCount(): number {
  return slowRequestCount;
}

/** Calls the FuelLog API as the signed-in user. A body makes it a POST unless a method is given. */
export async function api<T>(path: string, opts: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; keepalive?: boolean } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const method = opts.method ?? (opts.body === undefined ? 'GET' : 'POST');
  const timeoutMs = method === 'GET' ? 75_000 : 30_000;

  let isSlow = false;
  const slowTimer = setTimeout(() => {
    isSlow = true;
    slowRequestCount += 1;
    notifySlowListeners();
  }, 4000);

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    let res: Response;
    try {
      res = await fetch(BASE + path, {
        method,
        signal: controller.signal,
        keepalive: opts.keepalive,
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
  } finally {
    clearTimeout(timeoutTimer);
    clearTimeout(slowTimer);
    if (isSlow) {
      slowRequestCount = Math.max(0, slowRequestCount - 1);
      notifySlowListeners();
    }
  }
}


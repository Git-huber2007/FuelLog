import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || '/api';
const APP_VERSION = '1.0.0';

export function reportClientError(err: unknown) {
  try {
    let name = 'Error';
    let message = 'Unknown error';

    if (err instanceof Error) {
      name = err.name || 'Error';
      message = err.message || 'Error without message';
    } else if (err && typeof err === 'object') {
      const maybeErr = (err as { error?: unknown; reason?: unknown }).error ?? (err as { reason?: unknown }).reason;
      if (maybeErr instanceof Error) {
        name = maybeErr.name || 'Error';
        message = maybeErr.message || 'Error without message';
      } else if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
        message = (err as { message: string }).message;
        if ('name' in err && typeof (err as { name?: unknown }).name === 'string') {
          name = (err as { name: string }).name;
        }
      } else {
        message = String(err);
      }
    } else if (err !== undefined && err !== null) {
      message = String(err);
    }

    const route = typeof window !== 'undefined' ? window.location.pathname : '/';

    const sendPayload = (token?: string) => {
      fetch(`${BASE}/client-errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.slice(0, 100),
          message: message.slice(0, 500),
          route: route.slice(0, 200),
          version: APP_VERSION,
        }),
        keepalive: true,
      }).catch(() => {
        // Silently swallow reporting failure so it never causes a secondary crash
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      sendPayload(data.session?.access_token);
    }).catch(() => {
      sendPayload();
    });
  } catch {
    // Silently ignore
  }
}

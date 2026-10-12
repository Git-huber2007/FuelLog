import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/ui/Toast';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveOptions {
  keepalive?: boolean;
}

/**
 * Saves the latest value once the user pauses, running saves one at a time so the newest value always lands last.
 * Pending saves are flushed with keepalive when navigating away or closing the page.
 */
export function useDebouncedMutation<T extends object>(
  save: (value: T, opts?: SaveOptions) => Promise<unknown>,
  delay = 600,
) {
  const toast = useToast();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<number>();
  const pending = useRef<T>();
  const lastFailed = useRef<T>();
  const inFlight = useRef(false);
  const keepalivePending = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback((opts?: SaveOptions) => {
    window.clearTimeout(timer.current);
    if (opts?.keepalive) keepalivePending.current = true;

    if (inFlight.current) return;
    if (pending.current === undefined) return;

    const value = pending.current;
    pending.current = undefined;
    const keepalive = keepalivePending.current;
    keepalivePending.current = false;

    inFlight.current = true;
    setStatus('saving');

    saveRef.current(value, { keepalive }).then(
      () => {
        inFlight.current = false;
        if (pending.current !== undefined) {
          flush();
        } else {
          lastFailed.current = undefined;
          setStatus('saved');
        }
      },
      (error: Error) => {
        inFlight.current = false;
        if (pending.current !== undefined) {
          flush();
        } else {
          lastFailed.current = value;
          setStatus('error');
          toast(error.message, 'error');
        }
      },
    );
  }, [toast]);

  const run = useCallback((value: T) => {
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => flush(), delay);
  }, [flush, delay]);

  const retry = useCallback(() => {
    if (lastFailed.current !== undefined) {
      pending.current = lastFailed.current;
      flush();
    }
  }, [flush]);

  useEffect(() => {
    const onHide = () => flush({ keepalive: true });
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush({ keepalive: true });
    };

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      flush();
    };
  }, [flush]);

  return { run, status, retry, flush };
}

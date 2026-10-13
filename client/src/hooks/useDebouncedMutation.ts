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
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<number>();
  const pending = useRef<T>();
  const lastFailed = useRef<T>();
  const lastFailedCode = useRef<string | undefined>();
  const inFlightCount = useRef(0);
  const keepalivePending = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback((opts?: SaveOptions) => {
    window.clearTimeout(timer.current);
    if (opts?.keepalive) keepalivePending.current = true;

    if (inFlightCount.current > 0 && !opts?.keepalive) return;
    if (pending.current === undefined) return;

    const value = pending.current;
    pending.current = undefined;
    const keepalive = !!opts?.keepalive || keepalivePending.current;
    keepalivePending.current = false;

    inFlightCount.current += 1;
    setStatus('saving');

    saveRef.current(value, { keepalive }).then(
      () => {
        inFlightCount.current -= 1;
        if (inFlightCount.current === 0) {
          if (pending.current !== undefined) {
            flush();
          } else {
            setWaiting(false);
            lastFailed.current = undefined;
            lastFailedCode.current = undefined;
            setStatus('saved');
          }
        }
      },
      (error: Error) => {
        inFlightCount.current -= 1;
        if (inFlightCount.current === 0) {
          if (pending.current !== undefined) {
            flush();
          } else {
            setWaiting(false);
            lastFailed.current = value;
            lastFailedCode.current = (error as { code?: string }).code;
            setStatus('error');
            toast(error.message, 'error');
          }
        }
      },
    );
  }, [toast]);

  const run = useCallback((value: T) => {
    pending.current = value;
    setWaiting(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => flush(), delay);
  }, [flush, delay]);

  const retry = useCallback(() => {
    if (lastFailed.current !== undefined) {
      lastFailedCode.current = undefined;
      pending.current = lastFailed.current;
      setWaiting(true);
      flush();
    }
  }, [flush]);

  useEffect(() => {
    const onOnline = () => {
      if (lastFailedCode.current === 'offline' && lastFailed.current !== undefined) {
        lastFailedCode.current = undefined;
        retry();
      }
    };

    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [retry]);

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

  return { run, status, retry, flush, waiting };

}

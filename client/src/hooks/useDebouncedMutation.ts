import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/ui/Toast';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Saves the latest value once the user pauses, so inputs persist as they type without a submit button.
 * A pending save is flushed when the component unmounts, so leaving the page never drops an edit.
 */
export function useDebouncedMutation<T extends object>(save: (value: T) => Promise<unknown>, delay = 600) {
  const toast = useToast();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<number>();
  const pending = useRef<T>();
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const value = pending.current;
    if (!value) return;
    pending.current = undefined;
    setStatus('saving');
    saveRef.current(value).then(
      () => setStatus('saved'),
      (error: Error) => {
        setStatus('error');
        toast(error.message, 'error');
      },
    );
  }, [toast]);

  const run = useCallback((value: T) => {
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, delay);
  }, [flush, delay]);

  useEffect(() => flush, [flush]);

  return { run, status };
}

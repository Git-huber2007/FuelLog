import { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Toast';

const DEFAULT_REST_SECONDS = 90;

// Shared timer state across the session (SetRow, RestTimer, and mobile bottom bar)
let activeEndsAt: number | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function startRestTimer(seconds = DEFAULT_REST_SECONDS) {
  activeEndsAt = Date.now() + seconds * 1000;
  notify();
}

export function stopRestTimer() {
  activeEndsAt = null;
  notify();
}

export function addRestSeconds(seconds = 30) {
  if (activeEndsAt === null || activeEndsAt < Date.now()) {
    activeEndsAt = Date.now() + seconds * 1000;
  } else {
    activeEndsAt += seconds * 1000;
  }
  notify();
}

export function useRestTimer() {
  const toast = useToast();
  const [endsAt, setEndsAtState] = useState<number | null>(activeEndsAt);
  const [left, setLeft] = useState<number>(() =>
    activeEndsAt ? Math.max(0, Math.ceil((activeEndsAt - Date.now()) / 1000)) : DEFAULT_REST_SECONDS,
  );

  useEffect(() => {
    const handleUpdate = () => {
      setEndsAtState(activeEndsAt);
      if (activeEndsAt) {
        setLeft(Math.max(0, Math.ceil((activeEndsAt - Date.now()) / 1000)));
      } else {
        setLeft(DEFAULT_REST_SECONDS);
      }
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (endsAt === null) return;

    const tick = () => {
      const remaining = Math.ceil((endsAt - Date.now()) / 1000);
      if (remaining > 0) {
        setLeft(remaining);
      } else {
        activeEndsAt = null;
        setEndsAtState(null);
        setLeft(DEFAULT_REST_SECONDS);
        notify();
        navigator.vibrate?.([200, 100, 200]);
        toast('Rest over. Next set.');
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [endsAt, toast]);

  const running = endsAt !== null && left > 0;

  return {
    endsAt,
    left,
    running,
    start: startRestTimer,
    stop: stopRestTimer,
    addSeconds: addRestSeconds,
  };
}

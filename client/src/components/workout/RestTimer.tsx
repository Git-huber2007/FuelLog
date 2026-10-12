import { useEffect, useState } from 'react';
import { useToast } from '../ui/Toast';

const REST_SECONDS = 90;

export function RestTimer() {
  const toast = useToast();
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(REST_SECONDS);

  useEffect(() => {
    if (endsAt === null) return;
    // Counting from a fixed end time stays accurate when the phone throttles a backgrounded tab.
    const tick = () => {
      const remaining = Math.ceil((endsAt - Date.now()) / 1000);
      if (remaining > 0) return setLeft(remaining);
      setEndsAt(null);
      navigator.vibrate?.([200, 100, 200]);
      toast('Rest over. Next set.');
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [endsAt, toast]);

  const running = endsAt !== null;
  return (
    <section className="card flex items-center justify-between gap-3" aria-label="Rest timer">
      <div>
        <p className="text-sm text-muted">Rest timer</p>
        <p className="text-2xl font-semibold tabular-nums" role="timer" aria-live="off">
          {running ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : '1:30'}
        </p>
      </div>
      {running
        ? <button type="button" className="btn" onClick={() => setEndsAt(null)}>Stop</button>
        : <button type="button" className="btn-primary" onClick={() => setEndsAt(Date.now() + REST_SECONDS * 1000)}>Start 90 s rest</button>}
    </section>
  );
}

import { useRestTimer } from '../../hooks/useRestTimer';

export function RestTimer() {
  const { running, left, start, stop, addSeconds } = useRestTimer();

  const formatted = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;

  return (
    <section className="card flex items-center justify-between gap-3" aria-label="Rest timer">
      <div>
        <p className="card-title">Rest timer</p>
        <p className="stat mt-1.5" role="timer" aria-live="off">
          {running ? formatted : '1:30'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {running ? (
          <>
            <button
              type="button"
              className="btn px-3 text-xs font-semibold text-muted hover:text-text"
              onClick={() => addSeconds(30)}
              title="Add 30 seconds"
            >
              +30s
            </button>
            <button type="button" className="btn text-danger hover:border-danger/40" onClick={stop}>
              Stop
            </button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => start(90)}>
            Start 90 s rest
          </button>
        )}
      </div>
    </section>
  );
}

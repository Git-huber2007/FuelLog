import { useRestTimer } from '../../hooks/useRestTimer';

const DEFAULT_REST = 90;
const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimer() {
  const { running, left, start, stop, addSeconds } = useRestTimer();

  const formatted = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  // Progress fraction (1.0 down to 0.0)
  const fraction = running ? Math.max(0, Math.min(1, left / DEFAULT_REST)) : 1;
  const strokeDashoffset = CIRCUMFERENCE * (1 - fraction);

  return (
    <section className="card p-3.5 min-[380px]:p-5 flex items-center justify-between gap-3 min-[380px]:gap-4" aria-label="Rest timer">
      <div className="flex items-center gap-3.5">
        {/* Circular Progress Ring */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 52 52" aria-hidden="true">
            {/* Background track */}
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              className="stroke-line/70"
              strokeWidth="3.5"
              fill="none"
            />
            {/* Animated progress circle */}
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              className={`stroke-accent transition-[stroke-dashoffset] duration-250 ease-linear motion-reduce:transition-none ${
                running ? 'opacity-100' : 'opacity-40'
              }`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span
            className={`absolute h-2 w-2 rounded-full ${
              running
                ? 'bg-accent motion-safe:animate-pulse motion-reduce:animate-none'
                : 'bg-muted/40'
            }`}
            aria-hidden="true"
          />
        </div>

        <div>
          <p className="card-title">Rest timer</p>
          <p className="stat mt-1" role="timer" aria-live="off">
            {running ? formatted : '1:30'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {running ? (
          <>
            <button
              type="button"
              className="btn min-h-[44px] min-w-[44px] px-3.5 text-xs font-bold text-muted hover:text-text active:scale-[0.96] transition-transform"
              onClick={() => addSeconds(30)}
              title="Add 30 seconds"
              aria-label="Add 30 seconds of rest"
            >
              +30s
            </button>
            <button
              type="button"
              className="btn min-h-[44px] min-w-[44px] px-4 text-xs font-semibold text-danger hover:border-danger/40 active:scale-[0.96] transition-transform"
              onClick={stop}
              aria-label="Stop rest timer"
            >
              Stop
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-primary min-h-[44px] min-w-[44px] px-5 text-sm font-semibold active:scale-[0.96] transition-transform"
            onClick={() => start(DEFAULT_REST)}
            aria-label="Start 90 seconds of rest"
          >
            Start 90 s
          </button>
        )}
      </div>
    </section>
  );
}

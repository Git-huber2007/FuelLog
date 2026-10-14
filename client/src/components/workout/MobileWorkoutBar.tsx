import { useRestTimer } from '../../hooks/useRestTimer';

interface Props {
  setsDone: number;
  totalSets: number;
}

export function MobileWorkoutBar({ setsDone, totalSets }: Props) {
  const { running, left, start, addSeconds } = useRestTimer();

  const formattedRest = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const percent = totalSets > 0 ? Math.min(100, Math.round((setsDone / totalSets) * 100)) : 0;

  return (
    <aside
      aria-label="Workout status bar"
      className="md:hidden fixed bottom-[calc(4.85rem+env(safe-area-inset-bottom))] inset-x-0 z-20 px-3 pointer-events-none"
    >
      <div className="glass pointer-events-auto mx-auto flex max-w-[26rem] items-center justify-between gap-3 rounded-full px-4 py-2 shadow-xl border border-line">
        {/* Rest Timer display */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              running ? 'bg-accent animate-pulse' : 'bg-muted/60'
            }`}
            aria-hidden
          />
          <span className="text-xs font-semibold tabular-nums text-text">
            {running ? `⏱ ${formattedRest}` : '⏱ 1:30'}
          </span>
        </div>

        {/* Workout Progress */}
        <div className="text-xs text-muted tabular-nums font-medium truncate">
          {setsDone} / {totalSets} sets ({percent}%)
        </div>

        {/* Quick action button */}
        {running ? (
          <button
            type="button"
            onClick={() => addSeconds(30)}
            className="rounded-full bg-accent/15 text-accent px-2.5 py-1 text-xs font-bold active:scale-95 transition-all hover:bg-accent/25"
            title="Add 30 seconds of rest"
          >
            +30s
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start(90)}
            className="rounded-full bg-accent text-onaccent px-3 py-1 text-xs font-bold active:scale-95 transition-all hover:brightness-110 shadow-sm"
            title="Start 90 seconds of rest"
          >
            Rest
          </button>
        )}
      </div>
    </aside>
  );
}

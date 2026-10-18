import { useRestTimer } from '../../hooks/useRestTimer';

interface Props {
  setsDone: number;
  totalSets: number;
}

export function MobileWorkoutBar({ setsDone, totalSets }: Props) {
  const { running, left, start, addSeconds } = useRestTimer();

  const formattedRest = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const percent = totalSets > 0 ? Math.min(100, Math.round((setsDone / totalSets) * 100)) : 0;

  // Idle: only a small Rest button, so the bar does not sit on top of the tab bar for the whole workout
  if (!running) {
    return (
      <aside aria-label="Workout status bar" className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-20">
        <button
          type="button"
          onClick={() => start(90)}
          className="board inline-flex min-h-[44px] items-center gap-1.5 rounded-md px-4 text-sm font-bold uppercase [font-stretch:75%] active:scale-[0.96] transition-transform"
          aria-label="Start 90 seconds of rest"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></svg>
          Rest
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Workout status bar"
      className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 z-20 px-2 min-[360px]:px-3 pointer-events-none"
    >
      <div className="board pointer-events-auto mx-auto flex max-w-[26rem] items-center justify-between gap-1.5 min-[360px]:gap-3 rounded-md px-2.5 min-[360px]:px-4 py-1.5">
        {/* Rest Timer display */}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-digit motion-safe:animate-pulse motion-reduce:animate-none" aria-hidden />
          <span className="cond text-xl font-extrabold leading-none text-digit">{formattedRest}</span>
        </div>

        {/* Workout Progress */}
        <div className="text-xs text-board-muted font-medium truncate">
          {setsDone} / {totalSets} sets ({percent}%)
        </div>

        {/* Quick action button (min 44px tap target) */}
        <button
          type="button"
          onClick={() => addSeconds(30)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm bg-on-board/10 px-3 py-1 text-xs font-bold text-on-board active:scale-[0.96] transition-transform hover:bg-on-board/20"
          title="Add 30 seconds of rest"
          aria-label="Add 30 seconds of rest"
        >
          +30s
        </button>
      </div>
    </aside>
  );
}

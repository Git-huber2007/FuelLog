import { addDays, formatDayLabel } from '@fuellog/shared';
import { useSelectedDate } from '../../hooks/useSelectedDate';

export function DateSwitcher() {
  const { date, today, isToday, setDate } = useSelectedDate();
  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <button className="btn min-w-[36px] border-transparent bg-transparent px-1 sm:min-w-[44px] sm:px-0" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
        <span aria-hidden>‹</span>
      </button>
      <span className="min-w-[5.5rem] text-center text-xs font-medium sm:min-w-[6.5rem] sm:text-sm" aria-live="polite">{formatDayLabel(date, today)}</span>
      <button className="btn min-w-[36px] border-transparent bg-transparent px-1 sm:min-w-[44px] sm:px-0" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}

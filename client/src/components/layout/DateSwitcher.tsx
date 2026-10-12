import { addDays, formatDayLabel } from '@fuellog/shared';
import { useSelectedDate } from '../../hooks/useSelectedDate';

export function DateSwitcher() {
  const { date, today, isToday, setDate } = useSelectedDate();
  return (
    <div className="flex items-center gap-1">
      <button className="btn border-transparent bg-transparent px-0" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
        <span aria-hidden>‹</span>
      </button>
      <span className="min-w-[6.5rem] text-center text-sm font-medium" aria-live="polite">{formatDayLabel(date, today)}</span>
      <button className="btn border-transparent bg-transparent px-0" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}

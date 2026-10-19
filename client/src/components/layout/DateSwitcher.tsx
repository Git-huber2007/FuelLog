import { addDays, formatDayLabel } from '@fuellog/shared';
import { useSelectedDate } from '../../hooks/useSelectedDate';

export function DateSwitcher() {
  const { date, today, isToday, setDate } = useSelectedDate();
  return (
    <div className="flex flex-1 w-full max-w-[26rem] mx-auto items-center justify-between">
      <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
      </button>
      <span className="text-center text-base font-bold" aria-live="polite">{formatDayLabel(date, today)}</span>
      <button className="icon-btn" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

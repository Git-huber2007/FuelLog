import type { ProgressResponse } from '@fuellog/shared';
import { Rings, ringsFor } from '../ui/Rings';

type Day = ProgressResponse['calories'][number];

/** Same 10% band the 14-day chart uses for "on target". */
export function dayState({ kcal, target }: Pick<Day, 'kcal' | 'target'>): 'empty' | 'on' | 'over' | 'under' {
  if (!kcal) return 'empty';
  if (kcal > target * 1.1) return 'over';
  return kcal < target * 0.9 ? 'under' : 'on';
}

const WORD = { empty: 'nothing logged', under: 'under target', on: 'on target', over: 'over target' } as const;

/** Spoken summary of one day's rings, shared by the week strip and the activity calendar. */
export const dayLabel = (d: Day) =>
  `${new Date(`${d.date}T00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}: calories ${WORD[dayState(d)]}, ${d.protein} of ${d.proteinTarget} g protein${d.trained ? ', trained' : ''}`;

/** The last 7 days as Apple-style rings; tap a day to open it. */
export function WeekStrip({ days, selected, onSelect }: { days: Day[]; selected: string; onSelect: (date: string) => void }) {
  return (
    <nav aria-label="Last 7 days" className="grid grid-cols-7 gap-1 px-1">
      {days.slice(-7).map((d) => {
        const at = new Date(`${d.date}T00:00`);
        const isSelected = d.date === selected;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelect(d.date)}
            aria-current={isSelected ? 'date' : undefined}
            aria-label={dayLabel(d)}
            className={`flex min-h-12 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors ${isSelected ? 'bg-card shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'hover:bg-field'}`}
          >
            <span className={`text-[0.6875rem] font-semibold ${isSelected ? 'text-text' : 'text-muted'}`}>{at.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            <Rings rings={ringsFor(d)} size={34} />
          </button>
        );
      })}
    </nav>
  );
}

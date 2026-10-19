import type { ProgressResponse } from '@fuellog/shared';

type Day = ProgressResponse['calories'][number];

/** Same 10% band the 14-day chart uses for "on target". */
export function dayState({ kcal, target }: Day): 'empty' | 'on' | 'over' | 'under' {
  if (!kcal) return 'empty';
  if (kcal > target * 1.1) return 'over';
  return kcal < target * 0.9 ? 'under' : 'on';
}

const DOT = {
  empty: 'border border-dashed border-input-line text-muted',
  under: 'bg-field text-text',
  on: 'bg-accent text-onaccent',
  over: 'bg-fat text-white',
} as const;

const WORD = { empty: 'not logged', under: 'under target', on: 'on target', over: 'over target' } as const;

/** The last 7 days at a glance; tap a day to open it. */
export function WeekStrip({ days, selected, onSelect }: { days: Day[]; selected: string; onSelect: (date: string) => void }) {
  return (
    <nav aria-label="Last 7 days" className="grid grid-cols-7 gap-1 px-1">
      {days.slice(-7).map((d) => {
        const state = dayState(d);
        const at = new Date(`${d.date}T00:00`);
        const isSelected = d.date === selected;
        return (
          <button
            key={d.date}
            type="button"
            onClick={() => onSelect(d.date)}
            aria-current={isSelected ? 'date' : undefined}
            aria-label={`${at.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}: ${WORD[state]}`}
            className={`flex min-h-12 flex-col items-center gap-1 rounded-xl py-1 transition-colors ${isSelected ? 'bg-card shadow-[0_1px_3px_rgb(0_0_0/0.12)]' : 'hover:bg-field'}`}
          >
            <span className="text-[0.6875rem] font-semibold text-muted">{at.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${DOT[state]}`}>{at.getDate()}</span>
          </button>
        );
      })}
    </nav>
  );
}

import { Rings } from '../ui/Rings';

/** Today's scoreboard, the app's one signature: what is still to get, then the target, eaten and burned columns. */
export function Scoreboard({ eaten, target, burned = 0, streak, rings }: {
  eaten: number; target: number; burned?: number; streak?: number;
  /** When given, Apple-style rings for calories, protein and training sit beside the figure. */
  rings?: { protein: number; proteinTarget: number; trained: boolean };
}) {
  const left = Math.round(target - eaten);
  const over = left < 0;
  const columns = [['Target', target], ['Eaten', Math.round(eaten)], ['Burned', burned]] as const;
  return (
    <section className="board rounded-2xl p-5" aria-label="Calories">
      <div className="flex items-baseline justify-between gap-3">
        <p className="cond text-sm font-bold uppercase tracking-[0.08em] text-board-muted">{over ? 'Over by' : 'To get'}</p>
        {!!streak && (
          <p className="cond text-sm font-bold uppercase tracking-[0.06em] text-board-muted">
            <span className="text-on-board">{streak}</span>-day streak
          </p>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
      <p className="flex items-baseline gap-2">
        {/* key: a new value remounts the figure, which plays its roll once */}
        <span key={left} className={`digit-roll cond text-[4.5rem] font-extrabold leading-[0.85] tracking-[-0.02em] min-[360px]:text-[5.25rem] ${over ? 'text-board-alert' : 'text-digit'}`}>
          {Math.abs(left).toLocaleString()}
        </span>
        <span className="cond text-lg font-bold uppercase text-board-muted">kcal</span>
      </p>
      {rings && (
        // Below 360px the 76px rings push past the card beside the big figure, so they scale down there.
        <span className="shrink-0 max-[359px]:[&>svg]:size-12">
          <Rings
            size={76}
            rings={[
              { value: target ? eaten / target : 0, className: eaten > target * 1.1 ? 'stroke-board-alert' : 'stroke-digit' },
              { value: rings.proteinTarget ? rings.protein / rings.proteinTarget : 0, className: 'stroke-protein' },
              { value: rings.trained ? 1 : 0, className: 'stroke-carbs' },
            ]}
          />
        </span>
      )}
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x divide-board-line border-t border-board-line pt-3">
        {columns.map(([label, value]) => (
          <div key={label} className="px-3 first:pl-0">
            <dt className="cond text-xs font-bold uppercase tracking-[0.08em] text-board-muted">{label}</dt>
            <dd className="cond mt-1 text-2xl font-bold leading-none text-on-board">
              {value.toLocaleString()}
              <span className="sr-only"> kcal</span>
            </dd>
          </div>
        ))}
      </dl>
      {rings && (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-board-muted">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-digit" aria-hidden />Calories</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-protein" aria-hidden />Protein {Math.round(rings.protein)} / {rings.proteinTarget} g</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-carbs" aria-hidden />{rings.trained ? 'Trained' : 'No workout yet'}</span>
        </p>
      )}
    </section>
  );
}

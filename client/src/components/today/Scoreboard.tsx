/** Today's board, read like a run chase: what is still required, then the target, eaten and burned columns. */
export function Scoreboard({ eaten, target, burned = 0, streak }: { eaten: number; target: number; burned?: number; streak?: number }) {
  const left = Math.round(target - eaten);
  const over = left < 0;
  const columns = [['Target', target], ['Eaten', Math.round(eaten)], ['Burned', burned]] as const;
  return (
    <section className="board rounded-md p-4" aria-label="Calories">
      <div className="flex items-baseline justify-between gap-3">
        <p className="cond text-sm font-bold uppercase tracking-[0.08em] text-board-muted">{over ? 'Over by' : 'To get'}</p>
        {!!streak && (
          <p className="cond text-sm font-bold uppercase tracking-[0.06em] text-board-muted">
            <span className="text-on-board">{streak}</span>-day streak
          </p>
        )}
      </div>
      <p className="mt-1 flex items-baseline gap-2">
        {/* key: a new value remounts the figure, which plays its roll once */}
        <span key={left} className={`digit-roll cond text-[4.5rem] font-extrabold leading-[0.85] tracking-[-0.02em] min-[360px]:text-[5.25rem] ${over ? 'text-board-alert' : 'text-digit'}`}>
          {Math.abs(left).toLocaleString()}
        </span>
        <span className="cond text-lg font-bold uppercase text-board-muted">kcal</span>
      </p>
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
    </section>
  );
}

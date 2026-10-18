import type { ProgressResponse } from '@fuellog/shared';

export function WeekSummaryCard({ summary }: { summary: ProgressResponse['summary'] }) {
  const stats: [string, string][] = [
    ['Average calories', summary?.avgKcal != null ? `${summary.avgKcal} kcal` : '–'],
    ['Protein target hit', summary?.daysLogged ? `${summary.proteinHitDays ?? 0} of ${summary.daysLogged} days` : '–'],
    ['Workouts logged', String(summary?.workouts ?? 0)],
    ['Average sleep', summary?.avgSleep != null ? `${summary.avgSleep} h` : '–'],
    ['Average steps', summary?.avgSteps != null ? `${summary.avgSteps.toLocaleString()} steps` : '–'],
  ];
  return (
    <section className="card" aria-labelledby="week-title">
      <h2 id="week-title" className="card-title">Last 7 days</h2>
      {/* Scorecard rows: head on the left, figure on the right, a hairline between */}
      <dl className="mt-2 divide-y divide-line">
        {stats.map(([label, value], i) => (
          <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="tile-label">{label}</dt>
            <dd className={`cond font-bold leading-none ${i === 0 ? 'text-[2rem]' : 'text-2xl'}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {summary.daysLogged === 0 && <p className="mt-3 text-sm text-muted">Log food on the Today tab and your weekly averages will fill in here.</p>}
    </section>
  );
}

import type { ProgressResponse } from '@fuellog/shared';

export function WeekSummaryCard({ summary }: { summary: ProgressResponse['summary'] }) {
  const stats: [string, string][] = [
    ['Average calories', summary.avgKcal === null ? '–' : `${summary.avgKcal} kcal`],
    ['Protein target hit', summary.daysLogged ? `${summary.proteinHitDays} of ${summary.daysLogged} days` : '–'],
    ['Workouts logged', String(summary.workouts)],
    ['Average sleep', summary.avgSleep === null ? '–' : `${summary.avgSleep} h`],
  ];
  return (
    <section className="card" aria-labelledby="week-title">
      <h2 id="week-title" className="text-base">Last 7 days</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-bg p-3.5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {summary.daysLogged === 0 && <p className="mt-3 text-sm text-muted">Log food on the Today tab and your weekly averages will fill in here.</p>}
    </section>
  );
}

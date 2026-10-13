import type { ProgressResponse } from '@fuellog/shared';

export function WeekSummaryCard({ summary }: { summary: ProgressResponse['summary'] }) {
  const stats: [string, string][] = [
    ['Average calories', summary.avgKcal === null ? '–' : `${summary.avgKcal} kcal`],
    ['Protein target hit', summary.daysLogged ? `${summary.proteinHitDays} of ${summary.daysLogged} days` : '–'],
    ['Workouts logged', String(summary.workouts)],
    ['Average sleep', summary.avgSleep === null ? '–' : `${summary.avgSleep} h`],
    ['Average steps', summary.avgSteps === null ? '–' : `${summary.avgSteps.toLocaleString()} steps`],
  ];
  return (
    <section className="card" aria-labelledby="week-title">
      <h2 id="week-title" className="card-title">Last 7 days</h2>
      {/* The first figure spans the row, so five tiles never leave an orphan. */}
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {stats.map(([label, value], i) => (
          <div key={label} className={`tile ${i === 0 ? 'col-span-2' : ''}`}>
            <dt className="tile-label">{label}</dt>
            <dd className={i === 0 ? 'stat mt-1.5' : 'tile-value'}>{value}</dd>
          </div>
        ))}
      </dl>
      {summary.daysLogged === 0 && <p className="mt-3 text-sm text-muted">Log food on the Today tab and your weekly averages will fill in here.</p>}
    </section>
  );
}

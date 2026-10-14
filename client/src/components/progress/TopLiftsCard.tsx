import { exercisePhotos, type TopLiftSummary } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { ExercisePhoto } from '../workout/ExercisePhoto';

export function TopLiftsCard({ topLifts }: { topLifts?: TopLiftSummary[] }) {
  if (!topLifts || topLifts.length === 0) {
    return (
      <section className="card space-y-2" aria-labelledby="lifts-title">
        <h2 id="lifts-title" className="card-title">Top Lifts</h2>
        <p className="text-sm text-muted">
          No workout history yet. As you log sets, your 5 most-trained lifts and their trends will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="card space-y-4" aria-labelledby="lifts-title">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="lifts-title" className="card-title">Lifts · Top 5</h2>
          <p className="text-xs text-muted mt-0.5">Trend across your last 4 sessions</p>
        </div>
      </div>

      <ul className="divide-y divide-line/60" role="list">
        {topLifts.map((lift) => {
          const isUp = lift.trend === 'up';
          const isDown = lift.trend === 'down';

          return (
            <li key={lift.key}>
              <Link
                to={`/exercise/${encodeURIComponent(lift.key)}`}
                className="group flex items-center justify-between gap-3 py-3 transition-colors hover:text-accent"
                aria-label={`View ${lift.name} history. Trend: ${lift.trendDelta}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ExercisePhoto
                    src={exercisePhotos(lift.key)[0]}
                    alt=""
                    loading="lazy"
                    width={48}
                    height={36}
                    className="h-9 w-12 shrink-0 rounded-lg bg-line object-cover border border-line"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm text-text group-hover:text-accent transition-colors">
                      {lift.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {lift.totalSessions} {lift.totalSessions === 1 ? 'session' : 'sessions'} · Latest: {lift.latestMetric}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isUp
                        ? 'bg-accent/15 text-accent'
                        : isDown
                          ? 'bg-danger/15 text-danger'
                          : 'bg-line/60 text-muted'
                    }`}
                  >
                    {isUp && '↑'}
                    {isDown && '↓'}
                    {!isUp && !isDown && '→'}
                    <span>{lift.trendDelta}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { exercisePhotos, type TopLiftSummary } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { ExercisePhoto } from '../workout/ExercisePhoto';

function Sparkline({ points = [], trend }: { points?: number[]; trend: 'up' | 'flat' | 'down' }) {
  if (points.length < 2) return null;

  const width = 48;
  const height = 20;
  const pad = 2;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const strokeColor =
    trend === 'up'
      ? 'stroke-accent'
      : trend === 'down'
        ? 'stroke-danger'
        : 'stroke-muted';

  const fillColor =
    trend === 'up'
      ? 'fill-accent'
      : trend === 'down'
        ? 'fill-danger'
        : 'fill-muted';

  const pts = points.map((val, idx) => {
    const x = pad + (idx / (points.length - 1)) * (width - pad * 2);
    const y = pad + ((max - val) / range) * (height - pad * 2);
    return { x, y };
  });

  const polylineStr = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-5 w-12 shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeColor}
        vectorEffect="non-scaling-stroke"
        points={polylineStr}
      />
      <circle cx={last.x} cy={last.y} r="2" className={fillColor} />
    </svg>
  );
}

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
                className="group flex items-center justify-between gap-2 min-[380px]:gap-3 py-3 transition-colors hover:text-accent"
                aria-label={`View ${lift.name} history. Trend: ${lift.trendDelta}`}
              >
                <div className="flex items-center gap-2.5 min-[380px]:gap-3 min-w-0 flex-1">
                  <ExercisePhoto
                    src={exercisePhotos(lift.key)[0]}
                    alt=""
                    loading="lazy"
                    width={48}
                    height={36}
                    className="h-8 w-11 min-[380px]:h-9 min-[380px]:w-12 shrink-0 rounded-lg bg-line object-cover border border-line"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm text-text group-hover:text-accent transition-colors">
                      {lift.name}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {lift.totalSessions} {lift.totalSessions === 1 ? 'session' : 'sessions'} · Latest: {lift.latestMetric}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 min-[380px]:gap-2.5 shrink-0">
                  {/* Sparkline visualization */}
                  <div className="hidden min-[400px]:block">
                    <Sparkline points={lift.sparkline} trend={lift.trend} />
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold ${
                      isUp
                        ? 'bg-accent/15 text-accent'
                        : isDown
                          ? 'bg-danger/15 text-danger'
                          : 'bg-line/60 text-muted'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={isUp ? 'M12 19V5M6 11l6-6 6 6' : isDown ? 'M12 5v14M6 13l6 6 6-6' : 'M5 12h14M13 6l6 6-6 6'} />
                    </svg>
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


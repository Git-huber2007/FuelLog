import {
  daysBetween,
  exercisePhotos,
  formatDayLabel,
  formatPreviousHint,
  todayISO,
  type ExerciseHistoryPoint,
  type ExerciseHistoryResponse,
  type ExercisePRMilestone,
} from '@fuellog/shared';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ExercisePhoto } from '../components/workout/ExercisePhoto';
import { api } from '../lib/apiClient';

const W = 340;
const H = 180;
const PAD = { left: 42, right: 14, top: 16, bottom: 16 };

function MetricLineChart({
  points,
  unit,
  metricName,
  prs = [],
}: {
  points: ExerciseHistoryPoint[];
  unit: string;
  metricName: string;
  prs?: ExercisePRMilestone[];
}) {
  if (points.length === 0) {
    return (
      <EmptyState
        title="No logged data yet"
        hint="Log sets for this exercise during a workout to visualize your progress over time."
      />
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const span = Math.max(1, daysBetween(first.date, last.date));
  const values = points.map((p) => p.metric);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = Math.max(0, Math.floor(rawMin * 0.95));
  const max = Math.ceil(rawMax * 1.05) || 1;

  const x = (date: string) =>
    points.length === 1
      ? W / 2
      : PAD.left + (daysBetween(first.date, date) / span) * (W - PAD.left - PAD.right);

  const y = (val: number) =>
    PAD.top + ((max - val) / Math.max(1, max - min)) * (H - PAD.top - PAD.bottom);

  const today = todayISO();
  const mid = Math.round(((min + max) / 2) * 10) / 10;
  const prDates = new Set(prs.map((p) => p.date));
  const summaryId = useId();

  const delta = last.metric - first.metric;
  const pctChange = first.metric > 0 ? Math.round((delta / first.metric) * 100) : 0;
  const trendDescription =
    delta > 0
      ? `improved by ${delta.toFixed(1)} ${unit} (+${pctChange}%)`
      : delta < 0
        ? `decreased by ${Math.abs(delta).toFixed(1)} ${unit} (${pctChange}%)`
        : 'remained steady';
  const prSummary = prs && prs.length > 0 ? ` All-time personal record is ${prs[0].formatted}.` : '';
  const textSummary = `Chart tracking ${metricName} across ${points.length} ${
    points.length === 1 ? 'session' : 'sessions'
  } from ${formatDayLabel(first.date, today)} (${first.formatted}) to ${formatDayLabel(
    last.date,
    today
  )} (${last.formatted}). Performance has ${trendDescription}.${prSummary}`;

  return (
    <div>
      <p id={summaryId} className="sr-only">
        {textSummary}
      </p>

      <div className="sr-only">
        <table>
          <caption>{metricName} progression over time</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{metricName} ({unit})</th>
              <th scope="col">Performance</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date}>
                <td>{p.date}</td>
                <td>{p.metric}</td>
                <td>{p.formatted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-h-[180px] overflow-visible"
        role="img"
        aria-label={`${metricName} chart over ${points.length} sessions. Latest: ${last.formatted}.`}
        aria-describedby={summaryId}
      >
        {/* Horizontal grid guide lines and labels */}
        {[min, mid, max].map((val) => (
          <g key={val}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(val)}
              y2={y(val)}
              className="stroke-line"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD.left - 6}
              y={y(val) + 4}
              textAnchor="end"
              className="fill-muted text-[11px] font-medium"
            >
              {val}
            </text>
          </g>
        ))}

        {/* Progression Polyline */}
        {points.length > 1 && (
          <polyline
            fill="none"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="stroke-accent"
            vectorEffect="non-scaling-stroke"
            points={points.map((p) => `${x(p.date)},${y(p.metric)}`).join(' ')}
          />
        )}

        {/* Data points */}
        {points.map((p, i) => {
          const isLatest = i === points.length - 1;
          const isPr = prDates.has(p.date);
          const cx = x(p.date);
          const cy = y(p.metric);

          return (
            <g key={p.date}>
              {/* Outer halo for PR (gold) or Latest (accent) */}
              {isPr ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill="none"
                  strokeWidth="2"
                  className="stroke-gold motion-safe:animate-pulse motion-reduce:animate-none"
                  vectorEffect="non-scaling-stroke"
                />
              ) : isLatest ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill="none"
                  strokeWidth="2"
                  className="stroke-accent"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={isPr ? 4.5 : 4}
                className={
                  isPr
                    ? 'fill-gold'
                    : isLatest
                      ? 'fill-accent'
                      : 'fill-muted hover:fill-accent transition-colors'
                }
              >
                <title>{`${isPr ? '🏆 PR on ' : ''}${formatDayLabel(p.date, today)}: ${p.formatted} (${p.metric} ${unit})`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{formatDayLabel(first.date, today)}</span>
        {prDates.size > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-gold font-medium">
            <span className="h-2 w-2 rounded-full bg-gold inline-block" aria-hidden="true" />
            PR milestone
          </span>
        )}
        <span>{formatDayLabel(last.date, today)}</span>
      </div>
    </div>
  );
}

export default function ExerciseHistory() {
  const { key } = useParams<{ key: string }>();

  const { data, isPending, error, refetch } = useQuery<ExerciseHistoryResponse>({
    queryKey: ['exercise-history', key],
    queryFn: () => api<ExerciseHistoryResponse>(`/exercises/${encodeURIComponent(key!)}/history`),
    enabled: Boolean(key),
  });

  if (isPending) return <LoadingSkeleton />;
  if (error || !data) return <ErrorState error={error ?? new Error('Exercise not found')} onRetry={() => refetch()} />;

  const { name, kind, metricName, metricUnit } = data;
  const chartPoints = data.chartPoints ?? [];
  const prs = data.prs ?? [];
  const recentSessions = data.recentSessions ?? [];
  const bestAllTime = prs.length ? prs[0] : null;
  const latestSession = recentSessions.length ? recentSessions[0] : null;
  const today = todayISO();

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-3 min-[380px]:px-4">
      {/* Back Link & Header */}
      <div>
        <Link to="/workout" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text transition-colors">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Workout
        </Link>

        <div className="mt-3 flex items-start gap-4">
          <ExercisePhoto
            src={exercisePhotos(data.key)[0]}
            alt=""
            loading="lazy"
            width={72}
            height={52}
            className="h-14 w-20 shrink-0 rounded-2xl bg-line object-cover border border-line"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-text leading-tight">{name}</h1>
            <p className="mt-1 text-xs text-muted capitalize">
              {kind.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="tile p-3.5">
          <span className="tile-label">All-time best</span>
          <p className="tile-value text-accent truncate" title={bestAllTime?.formatted ?? 'None'}>
            {bestAllTime?.formatted ?? '—'}
          </p>
        </div>
        <div className="tile p-3.5">
          <span className="tile-label">Latest session</span>
          <p className="tile-value truncate" title={latestSession ? formatDayLabel(latestSession.date, today) : 'None'}>
            {latestSession ? formatDayLabel(latestSession.date, today) : '—'}
          </p>
        </div>
        <div className="tile p-3.5 col-span-2 sm:col-span-1">
          <span className="tile-label">Total sessions</span>
          <p className="tile-value">{chartPoints.length}</p>
        </div>
      </div>

      {/* Line Chart Section */}
      <section className="card space-y-4" aria-labelledby="chart-title">
        <div className="flex items-center justify-between">
          <h2 id="chart-title" className="card-title">
            {metricName} ({metricUnit})
          </h2>
          {chartPoints.length > 0 && (
            <span className="text-xs text-muted font-medium">
              Latest: {chartPoints[chartPoints.length - 1].formatted}
            </span>
          )}
        </div>
        <MetricLineChart points={chartPoints} unit={metricUnit} metricName={metricName} prs={prs} />
      </section>

      {/* Personal Records History */}
      {prs.length > 0 && (
        <section className="card space-y-3" aria-labelledby="prs-title">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34c2.84-.48 5-2.94 5-5.92V4H6v4.74c0 2.98 2.16 5.44 5 5.92z" />
            </svg>
            <h2 id="prs-title" className="card-title">Personal Records</h2>
          </div>
          <ul className="divide-y divide-line/60" role="list">
            {prs.map((pr, index) => (
              <li key={`${pr.date}-${index}`} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-semibold text-sm text-text">{pr.formatted}</span>
                  <p className="text-xs text-muted">{formatDayLabel(pr.date, today)}</p>
                </div>
                {index === 0 && (
                  <span className="rounded-full bg-field px-2.5 py-0.5 text-xs font-semibold text-text">
                    Current PR
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent Sessions List */}
      <section className="card space-y-3" aria-labelledby="sessions-title">
        <h2 id="sessions-title" className="card-title">Recent Sessions (Last 10)</h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-muted">No completed sessions logged yet.</p>
        ) : (
          <ul className="space-y-3" role="list">
            {recentSessions.map((session) => (
              <li key={session.date} className="rounded-2xl border border-line bg-bg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-text">
                    {formatDayLabel(session.date, today)}
                  </span>
                  {session.volumeKg > 0 && (
                    <span className="text-xs text-muted tabular-nums">
                      {session.volumeKg.toLocaleString()} kg volume
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {session.sets.map((s) => (
                    <span
                      key={s.set_number}
                      className="rounded-lg bg-card border border-line px-2 py-1 text-xs font-medium tabular-nums text-text"
                    >
                      Set {s.set_number}: {formatPreviousHint(s, kind)}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

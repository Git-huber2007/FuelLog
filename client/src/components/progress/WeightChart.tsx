import { daysBetween, formatDayLabel, todayISO, type ProgressResponse } from '@fuellog/shared';
import { EmptyState } from '../ui/EmptyState';

const W = 320;
const H = 170;
const PAD = { left: 34, right: 10, top: 10, bottom: 22 };

/** Daily weigh-ins as dots, with the 7-day average as a line so day-to-day noise does not mislead. */
export function WeightChart({ weights }: { weights: ProgressResponse['weights'] }) {
  if (!weights.length) {
    return <EmptyState title="No weigh-ins yet" hint="Log your weight above. After a few days you will see each weigh-in and your 7-day average here." />;
  }
  const first = weights[0];
  const last = weights[weights.length - 1];
  const span = Math.max(1, daysBetween(first.log_date, last.log_date));
  const values = weights.flatMap((w) => [w.weight_kg, w.avg7]);
  const min = Math.floor(Math.min(...values) - 0.5);
  const max = Math.ceil(Math.max(...values) + 0.5);
  const x = (date: string) => PAD.left + (daysBetween(first.log_date, date) / span) * (W - PAD.left - PAD.right);
  const y = (kg: number) => PAD.top + ((max - kg) / (max - min)) * (H - PAD.top - PAD.bottom);
  const today = todayISO();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Weight over ${weights.length} weigh-ins. Latest ${last.weight_kg} kg, 7-day average ${last.avg7} kg.`}>
      {[min, (min + max) / 2, max].map((kg) => (
        <g key={kg}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(kg)} y2={y(kg)} className="stroke-line" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(kg) + 4} textAnchor="end" className="fill-muted text-[10px]">{kg}</text>
        </g>
      ))}
      <polyline fill="none" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="stroke-accent"
        points={weights.map((w) => `${x(w.log_date)},${y(w.avg7)}`).join(' ')} />
      {weights.map((w) => <circle key={w.log_date} cx={x(w.log_date)} cy={y(w.weight_kg)} r="3" className="fill-muted" />)}
      <text x={PAD.left} y={H - 6} className="fill-muted text-[10px]">{formatDayLabel(first.log_date, today)}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">{formatDayLabel(last.log_date, today)}</text>
    </svg>
  );
}

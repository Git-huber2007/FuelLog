import { formatDayLabel, todayISO, type ProgressResponse } from '@fuellog/shared';
import { EmptyState } from '../ui/EmptyState';

const W = 320;
const H = 170;
const PAD = { left: 34, right: 6, top: 10, bottom: 22 };

/** Calories eaten on each of the last 14 days as bars, with each day's target as a stepped line. */
export function CalorieBarsChart({ days }: { days: ProgressResponse['calories'] }) {
  const logged = days.filter((d) => d.kcal > 0);
  if (!logged.length) {
    return <EmptyState title="No calories logged in the last 14 days" hint="Log food on the Today tab. Each day becomes a bar here, set against your target." />;
  }
  const max = Math.ceil((Math.max(...days.flatMap((d) => [d.kcal, d.target])) * 1.1) / 500) * 500;
  const slot = (W - PAD.left - PAD.right) / days.length;
  const y = (kcal: number) => PAD.top + (1 - kcal / max) * (H - PAD.top - PAD.bottom);
  const today = todayISO();
  const onTarget = logged.filter((d) => Math.abs(d.kcal - d.target) <= d.target * 0.1).length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Calories for the last 14 days. ${logged.length} days logged, ${onTarget} within 10 percent of target.`}>
      {[0, max / 2, max].map((kcal) => (
        <g key={kcal}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(kcal)} y2={y(kcal)} className="stroke-line" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(kcal) + 4} textAnchor="end" className="fill-muted text-[10px]">{kcal}</text>
        </g>
      ))}
      {days.map((d, i) => (
        <rect key={d.date} x={PAD.left + i * slot + slot * 0.15} width={slot * 0.7} y={y(d.kcal)} height={y(0) - y(d.kcal)} rx="2"
          className={d.kcal > d.target * 1.1 ? 'fill-fat' : 'fill-kcal'} />
      ))}
      <polyline fill="none" strokeWidth="1.5" strokeDasharray="4 3" className="stroke-text"
        points={days.flatMap((d, i) => [`${PAD.left + i * slot},${y(d.target)}`, `${PAD.left + (i + 1) * slot},${y(d.target)}`]).join(' ')} />
      <text x={PAD.left} y={H - 6} className="fill-muted text-[10px]">{formatDayLabel(days[0].date, today)}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[10px]">Today · dashed line is your target</text>
    </svg>
  );
}

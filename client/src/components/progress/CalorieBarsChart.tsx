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
    <div>
      <div className="sr-only">
        <table>
          <caption>Calories eaten over the last 14 days</caption>
          <thead>
            <tr><th scope="col">Date</th><th scope="col">Calories</th><th scope="col">Target</th></tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.kcal ? `${Math.round(d.kcal)} kcal` : 'Not logged'}</td>
                <td>{d.target} kcal</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-h-[170px]" role="img"
        aria-label={`Calories for the last 14 days. ${logged.length} days logged, ${onTarget} within 10 percent of target.`}>
        <defs>
          <pattern id="over-target-stripes" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.5" className="text-white/40 dark:text-black/40" />
          </pattern>
        </defs>
        {[0, max / 2, max].map((kcal) => (
          <g key={kcal}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(kcal)} y2={y(kcal)} className="stroke-line" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(kcal) + 4} textAnchor="end" className="fill-muted text-[11px] font-medium">{kcal}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const isOver = d.kcal > d.target * 1.1;
          const barX = PAD.left + i * slot + slot * 0.15;
          const barW = slot * 0.7;
          const barY = y(d.kcal);
          const barH = Math.max(0, y(0) - barY);
          return (
            <g key={d.date}>
              <rect x={barX} width={barW} y={barY} height={barH} rx="2" className={isOver ? 'fill-fat' : 'fill-kcal'} />
              {isOver && (
                <>
                  <rect x={barX} width={barW} y={barY} height={barH} rx="2" fill="url(#over-target-stripes)" />
                  <circle cx={barX + barW / 2} cy={barY - 3} r="1.5" className="fill-fat" />
                </>
              )}
            </g>
          );
        })}
        <polyline fill="none" strokeWidth="1.5" strokeDasharray="4 3" className="stroke-text"
          points={days.flatMap((d, i) => [`${PAD.left + i * slot},${y(d.target)}`, `${PAD.left + (i + 1) * slot},${y(d.target)}`]).join(' ')} />
        <text x={PAD.left} y={H - 6} className="fill-muted text-[11px] font-medium">{formatDayLabel(days[0].date, today)}</text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted text-[11px] font-medium">Today · dashed line is your target</text>
      </svg>
    </div>
  );
}

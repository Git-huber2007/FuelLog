import type { ProgressResponse } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { dayLabel, dayState } from '../today/WeekStrip';
import { Rings, ringsFor } from '../ui/Rings';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Five weeks of rings, Monday first, like Apple Fitness history. Each day opens on Today. */
export function ActivityCalendar({ days }: { days: ProgressResponse['calories'] }) {
  const lead = (new Date(`${days[0].date}T00:00`).getDay() + 6) % 7;
  const week = days.slice(-7);
  const legend = [
    { label: 'Calories', dot: 'bg-accent', value: `${week.filter((d) => dayState(d) === 'on').length} of 7 on target` },
    { label: 'Protein', dot: 'bg-protein', value: `${week.filter((d) => d.protein >= d.proteinTarget * 0.9).length} of 7 hit` },
    { label: 'Training', dot: 'bg-carbs', value: `${week.filter((d) => d.trained).length} days` },
  ];
  return (
    <section className="card space-y-4" aria-labelledby="activity-title">
      <h2 id="activity-title" className="card-title">Activity</h2>
      <dl className="grid grid-cols-3 gap-2">
        {legend.map((l) => (
          <div key={l.label}>
            <dt className="flex items-center gap-1.5 text-sm text-muted"><span className={`h-2 w-2 rounded-full ${l.dot}`} aria-hidden />{l.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold">{l.value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAYS.map((w, i) => <span key={i} className="text-[0.6875rem] font-semibold text-muted" aria-hidden>{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} />)}
        {days.map((d) => (
          <Link key={d.date} to={`/?date=${d.date}`} aria-label={dayLabel(d)} className="flex flex-col items-center gap-0.5 rounded-xl py-1 hover:bg-field">
            <Rings rings={ringsFor(d)} size={30} />
            <span className="text-[0.6875rem] text-muted">{new Date(`${d.date}T00:00`).getDate()}</span>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">Outer ring calories, middle protein, inner a logged workout. Last 7 days above.</p>
    </section>
  );
}

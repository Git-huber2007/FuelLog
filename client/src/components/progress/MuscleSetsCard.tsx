import { MUSCLE_GROUPS, MUSCLE_LABELS, type ProgressResponse } from '@fuellog/shared';

/** Commonly cited weekly aim for growth; shown as a guide, not a rule. */
const AIM = 10;

export function MuscleSetsCard({ muscleSets }: { muscleSets: ProgressResponse['muscleSets'] }) {
  const count = new Map(muscleSets.map((m) => [m.muscle, m.sets]));
  const rows = [...MUSCLE_GROUPS].sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0));
  const max = Math.max(AIM * 1.5, ...muscleSets.map((m) => m.sets));
  return (
    <section className="card space-y-3" aria-labelledby="muscle-title">
      <div>
        <h2 id="muscle-title" className="card-title">Sets per muscle</h2>
        <p className="mt-0.5 text-xs text-muted">Last 7 days. About {AIM} sets a week is a good aim for each muscle.</p>
      </div>
      {muscleSets.length === 0 ? (
        <p className="text-sm text-muted">No sets this week yet. Log a workout and each muscle you train fills in here.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => {
            const sets = count.get(m) ?? 0;
            return (
              <li key={m} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                <span className={sets ? 'text-text' : 'text-muted'}>{MUSCLE_LABELS[m]}</span>
                <span className="relative h-2.5 rounded-full bg-field" aria-hidden>
                  <span className="absolute inset-y-0 left-0 rounded-full bg-carbs" style={{ width: `${(sets / max) * 100}%` }} />
                  <span className="absolute -inset-y-1 w-px bg-input-line" style={{ left: `${(AIM / max) * 100}%` }} />
                </span>
                <span className={`text-right font-semibold ${sets ? '' : 'text-muted'}`}>{sets} {sets === 1 ? 'set' : 'sets'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

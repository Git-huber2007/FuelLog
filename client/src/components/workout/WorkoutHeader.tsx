import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { MuscleFigure } from './MuscleFigure';

interface Props {
  title: string;
  muscles: MuscleGroup[];
  programName: string;
  program?: string;
  setsDone?: number;
  totalSets?: number;
}

export function WorkoutHeader({
  title,
  muscles,
  programName,
  program,
  setsDone = 0,
  totalSets = 0,
}: Props) {
  const percent = totalSets > 0 ? Math.min(100, Math.round((setsDone / totalSets) * 100)) : 0;

  return (
    <section className="card p-3.5 min-[380px]:p-5 space-y-4" aria-labelledby="workout-title">
      <div>
        <h1 id="workout-title" className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.02em] text-text">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          <span>{programName}</span>
          {program === 'custom' && (
            <>
              {' · '}
              <Link to="/routine" className="link font-medium">
                Edit routine
              </Link>
            </>
          )}
          {' · '}
          <Link to="/profile" className="link inline-flex min-h-6 items-center">
            Change
          </Link>
        </p>
      </div>

      {/* Progress Bar for Sets Done / Sets Planned */}
      {totalSets > 0 && (
        <div className="space-y-1.5" aria-label={`Workout progress: ${setsDone} of ${totalSets} sets done`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted">Workout progress</span>
            <span className="text-text tabular-nums font-semibold">
              {setsDone} of {totalSets} sets ({percent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg border border-line/60">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-spring motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {muscles.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Muscles worked">
          {muscles.map((m) => (
            <li
              key={m}
              className="rounded-full bg-field px-2.5 py-1 text-xs font-medium text-muted"
            >
              {MUSCLE_LABELS[m]}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-center gap-8 rounded-2xl bg-bg py-4 border border-line/40">
        <MuscleFigure view="front" highlighted={muscles} />
        <MuscleFigure view="back" highlighted={muscles} />
      </div>
    </section>
  );
}

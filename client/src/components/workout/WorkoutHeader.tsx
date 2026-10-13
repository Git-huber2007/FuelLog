import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { MuscleFigure } from './MuscleFigure';

export function WorkoutHeader({ title, muscles, programName }: { title: string; muscles: MuscleGroup[]; programName: string }) {
  return (
    <section className="card" aria-labelledby="workout-title">
      <p className="text-sm text-muted">
        <span>{programName}</span> · <Link to="/profile" className="link">Change</Link>
      </p>
      <h2 id="workout-title" className="mt-1 text-[1.75rem] leading-tight">{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Muscles worked">
        {muscles.map((m) => <li key={m} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{MUSCLE_LABELS[m]}</li>)}
      </ul>
      <div className="mt-4 flex justify-center gap-8 rounded-2xl bg-bg py-4">
        <MuscleFigure view="front" highlighted={muscles} />
        <MuscleFigure view="back" highlighted={muscles} />
      </div>
    </section>
  );
}

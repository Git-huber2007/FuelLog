import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';
import { Link } from 'react-router-dom';
import { MuscleFigure } from './MuscleFigure';

export function WorkoutHeader({ title, muscles, programName }: { title: string; muscles: MuscleGroup[]; programName: string }) {
  return (
    <section className="card" aria-labelledby="workout-title">
      <h2 id="workout-title" className="text-xl">{title}</h2>
      <p className="text-sm text-muted">
        <span>{programName}</span> · <Link to="/profile" className="font-medium text-accent underline">Change</Link>
      </p>
      <p className="mt-1 text-sm text-muted">{muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')}</p>
      <div className="mt-3 flex justify-center gap-6">
        <MuscleFigure view="front" highlighted={muscles} />
        <MuscleFigure view="back" highlighted={muscles} />
      </div>
    </section>
  );
}

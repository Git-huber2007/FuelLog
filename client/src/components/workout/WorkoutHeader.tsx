import { MUSCLE_LABELS, type MuscleGroup } from '@fuellog/shared';
import { MuscleFigure } from './MuscleFigure';

export function WorkoutHeader({ title, muscles }: { title: string; muscles: MuscleGroup[] }) {
  return (
    <section className="card" aria-labelledby="workout-title">
      <h2 id="workout-title" className="text-xl">{title}</h2>
      <p className="text-sm text-muted">{muscles.map((m) => MUSCLE_LABELS[m]).join(' · ')}</p>
      <div className="mt-3 flex justify-center gap-6">
        <MuscleFigure view="front" highlighted={muscles} />
        <MuscleFigure view="back" highlighted={muscles} />
      </div>
    </section>
  );
}

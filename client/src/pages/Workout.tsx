import { weekdayOf, workoutKcal } from '@fuellog/shared';
import { useState } from 'react';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { RestDayCard } from '../components/workout/RestDayCard';
import { RestTimer } from '../components/workout/RestTimer';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { useProfile } from '../hooks/useProfile';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { useWorkout } from '../hooks/useWorkout';

export default function Workout() {
  const { date } = useSelectedDate();
  const workout = useWorkout(date);
  const profile = useProfile();
  const [picking, setPicking] = useState(false);

  if (workout.isPending) return <LoadingSkeleton />;
  // A failed background refresh keeps the last good data on screen; only a first load with nothing to show is an error page.
  if (!workout.data) return <ErrorState error={workout.error!} onRetry={() => workout.refetch()} />;

  const { title, muscles, exercises } = workout.data;
  const restDay = muscles.length === 0;
  const setsDone = exercises.reduce((n, e) => n + e.logged.filter((s) => s.reps > 0).length, 0);
  const bodyKg = profile.data?.profile.weight_kg;
  return (
    <>
      {workout.isError && <p role="alert" className="field-error">Could not refresh this workout. Showing the last loaded version.</p>}
      {restDay ? <RestDayCard sunday={weekdayOf(date) === 0} /> : <WorkoutHeader title={title} muscles={muscles} />}
      {exercises.length > 0 && <RestTimer />}
      {exercises.map((exercise) => <ExerciseCard key={`${date}-${exercise.key}`} date={date} exercise={exercise} />)}
      {setsDone > 0 && bodyKg && (
        <section className="card" aria-labelledby="burn-title">
          <h2 id="burn-title" className="text-base">Workout summary</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {workoutKcal(exercises, bodyKg)} <span className="text-base font-normal text-muted">kcal burned</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            An estimate from {setsDone} logged {setsDone === 1 ? 'set' : 'sets'}, your body weight, and the distance, time and incline of any cardio.
            It does not change your calorie target.
          </p>
        </section>
      )}
      <section className="card space-y-3" aria-labelledby="more-title">
        <div>
          <h2 id="more-title" className="text-base">{restDay ? 'Feel like moving?' : 'Want more?'}</h2>
          <p className="text-sm text-muted">Add cardio, stretching or any lift from the library, filtered by level and muscle.</p>
        </div>
        <button type="button" className="btn-primary w-full" onClick={() => setPicking(true)}>Add exercise or cardio</button>
      </section>
      {picking && <ExercisePicker date={date} onDay={new Set(exercises.map((e) => e.key))} onClose={() => setPicking(false)} />}
    </>
  );
}

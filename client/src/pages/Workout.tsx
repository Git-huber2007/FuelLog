import { dayDeltaFor, weekdayOf, workoutKcal } from '@fuellog/shared';
import { useState } from 'react';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { MobileWorkoutBar } from '../components/workout/MobileWorkoutBar';
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

  const { title, muscles, exercises, program, programName } = workout.data;
  const restDay = muscles.length === 0;
  const delta = dayDeltaFor(date, program);
  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const setsDone = exercises.reduce((n, e) => n + e.logged.filter((s) => s.reps > 0).length, 0);
  const bodyKg = profile.data?.profile.weight_kg;

  return (
    <>
      {workout.isError && (
        <p role="alert" className="field-error mb-4">
          Could not refresh this workout. Showing the last loaded version.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6 items-start space-y-5 md:space-y-0 pb-40 md:pb-6">
        {/* Main Column: Header and Sequential Exercise Cards */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          {restDay ? (
            <RestDayCard
              programName={programName}
              program={program}
              delta={delta}
              sunday={weekdayOf(date) === 0}
            />
          ) : (
            <WorkoutHeader
              title={title}
              muscles={muscles}
              programName={programName}
              program={program}
              setsDone={setsDone}
              totalSets={totalSets}
            />
          )}

          {/* Sequential exercises in a single column */}
          {exercises.map((exercise) => (
            <ExerciseCard key={`${date}-${exercise.key}`} date={date} exercise={exercise} />
          ))}

          {/* Mobile-only bottom section for Summary and Extras */}
          <div className="md:hidden space-y-5">
            {setsDone > 0 && bodyKg && (
              <section className="card" aria-labelledby="burn-title-mobile">
                <h2 id="burn-title-mobile" className="card-title">
                  Workout summary
                </h2>
                <p className="stat mt-2">
                  {workoutKcal(exercises, bodyKg)}
                  <span className="stat-unit">kcal burned</span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  An estimate from {setsDone} logged {setsDone === 1 ? 'set' : 'sets'}, your body
                  weight, and the distance, time and incline of any cardio. It does not change your
                  calorie target.
                </p>
              </section>
            )}

            <section className="card space-y-3" aria-labelledby="more-title-mobile">
              <div>
                <h2 id="more-title-mobile" className="card-title">
                  {restDay ? 'Feel like moving?' : 'Extras'}
                </h2>
                <p className="text-sm text-muted">
                  Add cardio, stretching or any lift from the library, filtered by level and muscle.
                </p>
              </div>
              <button
                type="button"
                className="btn min-h-[44px] w-full active:scale-[0.98] transition-transform"
                onClick={() => setPicking(true)}
              >
                Add exercise or cardio
              </button>
            </section>
          </div>
        </div>

        {/* Right Rail (Desktop only, sticky top-20) */}
        <div className="hidden md:block md:col-span-5 lg:col-span-4 space-y-5 sticky top-20 self-start">
          {exercises.length > 0 && <RestTimer />}

          {setsDone > 0 && bodyKg && (
            <section className="card" aria-labelledby="burn-title-desktop">
              <h2 id="burn-title-desktop" className="card-title">
                Workout summary
              </h2>
              <p className="stat mt-2">
                {workoutKcal(exercises, bodyKg)}
                <span className="stat-unit">kcal burned</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                An estimate from {setsDone} logged {setsDone === 1 ? 'set' : 'sets'}, your body
                weight, and the distance, time and incline of any cardio. It does not change your
                calorie target.
              </p>
            </section>
          )}

          <section className="card space-y-3" aria-labelledby="more-title-desktop">
            <div>
              <h2 id="more-title-desktop" className="card-title">
                {restDay ? 'Feel like moving?' : 'Extras'}
              </h2>
              <p className="text-sm text-muted">
                Add cardio, stretching or any lift from the library, filtered by level and muscle.
              </p>
            </div>
            <button
              type="button"
              className="btn min-h-[44px] w-full active:scale-[0.98] transition-transform"
              onClick={() => setPicking(true)}
            >
              Add exercise or cardio
            </button>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      {!restDay && exercises.length > 0 && (
        <MobileWorkoutBar setsDone={setsDone} totalSets={totalSets} />
      )}

      {picking && (
        <ExercisePicker
          date={date}
          onDay={new Set(exercises.map((e) => e.key))}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}

import { type WorkoutExercise } from '@fuellog/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { MobileWorkoutBar } from '../components/workout/MobileWorkoutBar';
import { RestTimer } from '../components/workout/RestTimer';
import { WorkoutHeader } from '../components/workout/WorkoutHeader';
import { startRestTimer } from '../hooks/useRestTimer';

const MOCK_EXERCISES: WorkoutExercise[] = [
  {
    key: 'mon-bench-press',
    name: 'Bench press',
    prescription: '3×8–12',
    detail: 'Barbell bench press on flat bench',
    sets: 3,
    topReps: 12,
    kind: 'weight_reps',
    extra: false,
    logged: [
      { log_date: '2026-10-14', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null },
      { log_date: '2026-10-14', exercise_key: 'mon-bench-press', set_number: 2, weight_kg: 65, reps: 8, incline_pct: null, is_pr: true },
    ],
    last: {
      date: '2026-10-07',
      sets: [
        { log_date: '2026-10-07', exercise_key: 'mon-bench-press', set_number: 1, weight_kg: 60, reps: 10, incline_pct: null },
        { log_date: '2026-10-07', exercise_key: 'mon-bench-press', set_number: 2, weight_kg: 60, reps: 8, incline_pct: null },
        { log_date: '2026-10-07', exercise_key: 'mon-bench-press', set_number: 3, weight_kg: 60, reps: 8, incline_pct: null },
      ],
    },
    overload: true,
  },
  {
    key: 'wed-weighted-dips',
    name: 'Weighted dips',
    prescription: '3×6–10',
    detail: 'Chest dip with added dumbbell/belt load',
    sets: 3,
    topReps: 10,
    kind: 'weighted_bodyweight',
    extra: false,
    logged: [
      { log_date: '2026-10-14', exercise_key: 'wed-weighted-dips', set_number: 1, weight_kg: 10, reps: 8, incline_pct: null },
    ],
    last: {
      date: '2026-10-07',
      sets: [
        { log_date: '2026-10-07', exercise_key: 'wed-weighted-dips', set_number: 1, weight_kg: 10, reps: 8, incline_pct: null },
        { log_date: '2026-10-07', exercise_key: 'wed-weighted-dips', set_number: 2, weight_kg: 10, reps: 7, incline_pct: null },
      ],
    },
    overload: false,
  },
  {
    key: 'fri-plank',
    name: 'Plank hold',
    prescription: '2×45–60s',
    detail: 'Standard isometric elbow plank',
    sets: 2,
    topReps: 60,
    kind: 'duration',
    extra: false,
    logged: [],
    last: {
      date: '2026-10-07',
      sets: [
        { log_date: '2026-10-07', exercise_key: 'fri-plank', set_number: 1, weight_kg: 0, reps: 60, incline_pct: null },
        { log_date: '2026-10-07', exercise_key: 'fri-plank', set_number: 2, weight_kg: 0, reps: 50, incline_pct: null },
      ],
    },
    overload: true,
  },
  {
    key: 'fri-assisted-pullup',
    name: 'Assisted pull-up',
    prescription: '3×8–12',
    detail: 'Machine counterweight assistance',
    sets: 3,
    topReps: 12,
    kind: 'assisted_bodyweight',
    extra: false,
    logged: [],
    last: {
      date: '2026-10-07',
      sets: [
        { log_date: '2026-10-07', exercise_key: 'fri-assisted-pullup', set_number: 1, weight_kg: 20, reps: 12, incline_pct: null },
      ],
    },
    overload: true,
  },
];

export default function WorkoutPreview() {
  const [params] = useSearchParams();
  const theme = params.get('theme') ?? 'light';
  const [exercises] = useState(MOCK_EXERCISES);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
    // Set 74s rest so timer ring shows circular progress
    startRestTimer(74);
  }, [theme]);

  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const setsDone = exercises.reduce((n, e) => n + e.logged.filter((s) => s.reps > 0).length, 0);

  return (
    <div className="mx-auto min-h-dvh max-w-[1120px] px-4 py-6 md:px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 md:gap-6 items-start space-y-5 md:space-y-0 pb-28 md:pb-6">
        {/* Main Column */}
        <div className="md:col-span-7 lg:col-span-8 space-y-5">
          <WorkoutHeader
            title="Push & Core Day"
            muscles={['chest', 'triceps', 'shoulders', 'core']}
            programName="Six-day PPL"
            program="custom"
            setsDone={setsDone}
            totalSets={totalSets}
          />

          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.key} date="2026-10-14" exercise={exercise} />
          ))}

          {/* Mobile Summary & Extras */}
          <div className="md:hidden space-y-5">
            <section className="card" aria-labelledby="burn-title-mobile">
              <h2 id="burn-title-mobile" className="card-title">
                Workout summary
              </h2>
              <p className="stat mt-2">
                185<span className="stat-unit">kcal burned</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                An estimate from {setsDone} logged sets, your body weight, and cardio parameters.
              </p>
            </section>

            <section className="card space-y-3" aria-labelledby="more-title-mobile">
              <div>
                <h2 id="more-title-mobile" className="card-title">
                  Extras
                </h2>
                <p className="text-sm text-muted">
                  Add cardio, stretching or any lift from the library.
                </p>
              </div>
              <button type="button" className="btn min-h-[44px] w-full active:scale-[0.98]">
                Add exercise or cardio
              </button>
            </section>
          </div>
        </div>

        {/* Desktop Sticky Rail */}
        <div className="hidden md:block md:col-span-5 lg:col-span-4 space-y-5 sticky top-6 self-start">
          <RestTimer />

          <section className="card" aria-labelledby="burn-title-desktop">
            <h2 id="burn-title-desktop" className="card-title">
              Workout summary
            </h2>
            <p className="stat mt-2">
              185<span className="stat-unit">kcal burned</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              An estimate from {setsDone} logged sets and your body weight.
            </p>
          </section>

          <section className="card space-y-3" aria-labelledby="more-title-desktop">
            <div>
              <h2 id="more-title-desktop" className="card-title">
                Extras
              </h2>
              <p className="text-sm text-muted">
                Add cardio, stretching or any lift from the library.
              </p>
            </div>
            <button type="button" className="btn min-h-[44px] w-full active:scale-[0.98]">
              Add exercise or cardio
            </button>
          </section>
        </div>
      </div>

      {/* Mobile Sticky Floating Bar */}
      <MobileWorkoutBar setsDone={setsDone} totalSets={totalSets} />
    </div>
  );
}

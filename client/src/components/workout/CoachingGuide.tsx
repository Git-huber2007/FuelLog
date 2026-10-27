import { buildCustomExercise, LEAN_SIX_DAY_TEMPLATE } from '@fuellog/shared';
import { TIPS } from './coachingTips';

/** Indexed by weekday: 0 = Sunday. Done after the weights. */
const CARDIO = [
  'Optional 20–40 min easy walk and 10 min gentle stretching.',
  '20 min incline walk, 5–5.5 km/h at 8–12% incline. You should be able to talk in short sentences.',
  '20 min incline walk, same pace as Monday.',
  '20 min elliptical or incline walk, steady and moderate.',
  '20 min incline walk, same pace as Monday.',
  '20 min elliptical or incline walk, steady and moderate.',
  '20 min easy bike after legs, light enough to chat comfortably.',
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const BASICS: [string, string][] = [
  ['Warm-up', '5 min easy cardio, then arm circles or leg swings. Before the first exercise for each muscle do 2 warm-up sets: 10 reps at about 50% of your working weight, then 5 reps at about 75%. Later exercises for the same muscle need one light set of 8–10.'],
  ['Starting weight', 'In week 1 pick a weight you can lift for the bottom of the rep range with 2–3 clean reps left in the tank. If you pass the top of the range on the first set, go heavier on the next.'],
  ['Intensity', 'Finish working sets 1–2 reps short of failure. On isolation moves the last set can go to 1 rep short. Stay further from failure on leg press, Romanian deadlift and presses.'],
  ['Progressive overload', 'Use double progression. When you hit the top of the rep range on every set with good form, add weight next session: 1–2.5 kg for upper body, 2.5–5 kg for legs. Drop back to the bottom of the range and build up again. The overload hint on each exercise shows when you are ready.'],
  ['Rest and recovery', 'Rest times for each exercise are listed below; use the rest timer. Compound lifts get 90 s to 2 min, isolation 45–75 s. Sleep 7–9 hours, keep Sunday off, and every 6–8 weeks take an easier week with half the sets.'],
  ['Form and balance', 'Control the lowering phase, use full range of motion, and never add weight at the cost of form. The plan has equal pulling and pushing work to keep the shoulders healthy and the posture upright.'],
];

export function CoachingGuide() {
  return (
    <details open className="card group p-4">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 font-semibold text-text [&::-webkit-details-marker]:hidden">
        <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current transition-transform group-open:rotate-90" aria-hidden><path d="M4 2l5 4-5 4z" /></svg>
        Coaching guide · {LEAN_SIX_DAY_TEMPLATE.name}
      </summary>
      <div className="mt-3 space-y-5 text-sm">
        <dl className="space-y-3">
          {BASICS.map(([term, text]) => (
            <div key={term}>
              <dt className="font-medium text-text">{term}</dt>
              <dd className="text-muted">{text}</dd>
            </div>
          ))}
        </dl>
        {ORDER.map((w) => {
          const day = LEAN_SIX_DAY_TEMPLATE.days[w];
          return (
            <section key={w} className="space-y-2">
              <h3 className="card-title">{DAYS[w]} · {day.title || 'Rest and recovery'}</h3>
              <ul className="space-y-2" role="list">
                {day.exercises.map(buildCustomExercise).filter((ex) => ex.kind !== 'cardio').map((ex) => {
                  const tip = TIPS[ex.key];
                  return (
                    <li key={ex.key} className="rounded-2xl border border-line bg-bg p-3">
                      <p className="font-medium text-text">{ex.name}</p>
                      <p className="text-xs text-muted">{ex.prescription}{tip && ` · rest ${tip[0]}`}</p>
                      {tip && <p className="mt-1 text-muted">{tip[1]}</p>}
                      {tip && <p className="mt-1 text-xs text-muted">Machine busy or missing? {tip[2]}.</p>}
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted"><span className="font-medium text-text">Cardio:</span> {CARDIO[w]}</p>
            </section>
          );
        })}
      </div>
    </details>
  );
}

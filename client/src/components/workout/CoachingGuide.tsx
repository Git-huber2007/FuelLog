import { buildCustomExercise, LEAN_SIX_DAY_TEMPLATE } from '@fuellog/shared';

/** Rest, technique cue and equipment alternative per template exercise. */
const TIPS: Record<string, [rest: string, cue: string, alt: string]> = {
  'Wide-Grip_Lat_Pulldown': ['90 s', 'Thighs locked under the pad, chest up, slight lean back. Drive elbows down to pull the bar to your upper chest, no swinging; let it up over 2–3 s.', 'Assisted pull-up or band pulldown'],
  'Dumbbell_Incline_Row': ['90 s', 'Chest on a 30–45° bench, arms hanging. Row the dumbbells to your lower ribs, squeeze shoulder blades together, lower slowly.', 'Chest-supported machine row or T-bar row'],
  'Seated_Cable_Rows': ['75 s', 'Sit tall, knees soft. Pull the handle to your belly button with elbows close; keep the torso still instead of rocking.', 'Machine row or band row'],
  'Barbell_Curl': ['75 s', 'Shoulder-width grip, elbows pinned to your sides. Curl without swinging the hips, lower over 2–3 s.', 'EZ-bar or dumbbell curl'],
  'Hammer_Curls': ['60 s', 'Thumbs-up grip, elbows still. Curl to shoulder height and lower under control.', 'Rope cable hammer curl'],
  'Dumbbell_Bench_Press': ['2 min', 'Feet planted, shoulder blades pinched down and back. Lower to mid-chest with elbows about 45° from your body, press up and slightly in.', 'Barbell bench, machine press or push-ups'],
  'Incline_Dumbbell_Press': ['90 s', 'Bench at about 30°. Lower to the upper chest with wrists over elbows, press up without clanking the dumbbells.', 'Incline machine or Smith press'],
  'Cable_Crossover': ['60 s', 'Slight forward lean, elbows softly bent and fixed. Bring the handles together in front of your chest, open back slowly to a stretch.', 'Pec deck or dumbbell fly'],
  'Triceps_Pushdown_-_Rope_Attachment': ['60 s', 'Elbows pinned to your sides. Push down and spread the rope at the bottom; let it rise only until forearms are level.', 'Straight-bar or band pushdown, bench dips'],
  'Cable_Rope_Overhead_Triceps_Extension': ['60 s', 'Face away from the cable, elbows pointing forward by your head. Lower behind the head for a deep stretch, extend fully.', 'Dumbbell overhead extension'],
  'Dumbbell_Shoulder_Press': ['2 min', 'Seated with your back supported, dumbbells at ear height and forearms vertical. Press overhead without arching the lower back.', 'Machine shoulder press'],
  'Side_Lateral_Raise': ['45–60 s', 'Slight elbow bend, lead with the elbows, stop at shoulder height. No shrugging or swinging; lower over 2 s.', 'Cable or band lateral raise'],
  'Reverse_Machine_Flyes': ['60 s', 'Chest on the pad, handles at shoulder height. Sweep the arms back in an arc and squeeze the rear delts without shrugging.', 'Bent-over dumbbell reverse fly or face pull'],
  'Dumbbell_Shrug': ['60 s', 'Arms straight, lift the shoulders straight up to your ears, hold 1 s, lower fully. Do not roll them.', 'Barbell or machine shrug'],
  'Plank': ['45 s', 'Forearms under shoulders, body in a straight line, squeeze glutes and brace. End the set when your hips sag.', 'Dead bug'],
  'One-Arm_Dumbbell_Row': ['60 s per side', 'Hand and knee on the bench, back flat. Pull the dumbbell toward your hip, elbow close, no twisting.', 'Single-arm cable row'],
  'Straight-Arm_Pulldown': ['60 s', 'Hinge slightly, arms nearly straight. Sweep the bar from eye level to your thighs with the lats, not the triceps.', 'Dumbbell pullover'],
  'Preacher_Curl': ['75 s', 'Armpits snug on the pad. Lower until the arms are almost straight; never bounce at the bottom.', 'Dumbbell or machine preacher curl'],
  'Incline_Dumbbell_Curl': ['60 s', 'Bench at 45–60°, arms hanging behind the body. Curl without letting the elbows drift forward.', 'Cable curl facing away from the stack'],
  'Leverage_Incline_Chest_Press': ['90 s', 'Set the seat so the handles line up with your upper chest. Press out, then return slowly to a full stretch.', 'Incline dumbbell or Smith press'],
  'Leverage_Chest_Press': ['90 s', 'Handles at mid-chest, shoulder blades back on the pad. Press without slamming the elbows into lockout.', 'Dumbbell bench press or push-ups'],
  'Leg_Press': ['2 min', 'Feet shoulder-width mid-platform, lower back stays on the pad. Lower to about 90° at the knee, push through mid-foot, do not lock the knees.', 'Goblet squat or hack squat'],
  'Romanian_Deadlift': ['2 min', 'Soft knees, push the hips back with a flat back and the bar close to your legs. Lower until the hamstrings stretch, stand by driving the hips forward.', 'Dumbbell Romanian deadlift'],
  'Seated_Leg_Curl': ['75 s', 'Knees in line with the machine pivot, thigh pad snug. Curl fully, pause, return slowly.', 'Lying leg curl or swiss-ball leg curl'],
  'Leg_Extensions': ['75 s', 'Knees in line with the pivot, pad on the lower shin. Extend fully, squeeze 1 s, lower slowly.', 'Bulgarian split squat'],
  'Standing_Calf_Raises': ['60 s', 'Balls of the feet on the edge, knees straight. Full stretch at the bottom, pause 1–2 s at the top.', 'Single-leg dumbbell calf raise on a step'],
};

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
    <details className="card group p-4">
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

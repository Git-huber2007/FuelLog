import { LEVEL_LABELS, LEVELS, ProfileInput, PROGRAM_KEYS, PROGRAMS, recommendedProgram, type Level, type Profile, type ProgramKey } from '@fuellog/shared';
import { useId, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSaveProfile } from '../../hooks/useProfile';
import { numberOrNull } from '../../lib/entries';
import { NumberField } from '../ui/NumberField';
import { useToast } from '../ui/Toast';
import { TargetsSummary } from './TargetsSummary';

const GOALS = [
  { value: 'cut', label: 'Lose fat' },
  { value: 'maintain', label: 'Maintain and build' },
  { value: 'gain', label: 'Gain muscle' },
];

const RANGES = { age: 'Age must be 14 to 90', height_cm: 'Height must be 120 to 230 cm', weight_kg: 'Weight must be 30 to 250 kg' };

/** Used for onboarding and for editing. Targets update live as the fields change. */
export function ProfileForm({ profile, submitLabel, onSaved }: { profile: Profile; submitLabel: string; onSaved?: () => void }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const save = useSaveProfile();
  const [sex, setSex] = useState<string>(profile.sex ?? '');
  const [goal, setGoal] = useState<string>(profile.goal);
  const [age, setAge] = useState(profile.age?.toString() ?? '');
  const [height, setHeight] = useState(profile.height_cm?.toString() ?? '');
  const [weight, setWeight] = useState(profile.weight_kg?.toString() ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [level, setLevel] = useState<Level>(profile.level ?? 'beginner');
  // A new user gets the program suggested for their level until they choose one themselves; an existing user keeps theirs.
  const [program, setProgram] = useState<ProgramKey>(profile.onboarded && profile.program ? profile.program : recommendedProgram(level));
  const [programChosen, setProgramChosen] = useState(profile.onboarded);
  const suggested = recommendedProgram(level);

  function changeLevel(next: Level) {
    setLevel(next);
    if (!programChosen) setProgram(recommendedProgram(next));
  }

  const parsed = ProfileInput.safeParse({ sex, goal, level, program, age: numberOrNull(age), height_cm: numberOrNull(height), weight_kg: numberOrNull(weight) });
  const invalid = parsed.success ? {} : parsed.error.flatten().fieldErrors;
  const error = (field: keyof typeof RANGES | 'sex') => (submitted && invalid[field] ? (field === 'sex' ? 'Choose one' : RANGES[field]) : undefined);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!parsed.success) {
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    save.mutate(parsed.data, {
      onSuccess: () => {
        toast('Profile saved.');
        onSaved?.();
      },
      onError: (err) => toast(err.message, 'error'),
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="card-title">Training</legend>
        <div>
          <span className="label">Training level</span>
          <div className="segmented">
            {LEVELS.map((l) => (
              <label key={l} className="segmented-option">
                <input
                  type="radio"
                  name="level"
                  className="sr-only"
                  checked={level === l}
                  onChange={() => changeLevel(l)}
                />
                {LEVEL_LABELS[l]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-program`} className="label">Weekly program</label>
            {program === 'custom' && (
              <Link to="/routine" className="text-xs font-semibold text-accent hover:underline">
                Edit routine <svg viewBox="0 0 24 24" className="inline h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
              </Link>
            )}
          </div>
          <select
            id={`${id}-program`}
            className="input"
            value={program}
            aria-describedby={`${id}-program-help`}
            onChange={(e) => {
              setProgram(e.target.value as ProgramKey);
              setProgramChosen(true);
            }}
          >
            {PROGRAM_KEYS.map((key) => (
              <option key={key} value={key}>
                {PROGRAMS[key].name}{key === suggested ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
          <p id={`${id}-program-help`} className="mt-1.5 text-xs text-muted">
            {PROGRAMS[program].summary}
            {program !== suggested && program !== 'custom' && ` For ${LEVEL_LABELS[level].toLowerCase()} level we recommend ${PROGRAMS[suggested].name}.`}
            {program === 'custom' && (
              <> <Link to="/routine" className="link font-medium">Configure exercises for each day</Link>.</>
            )}
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="card-title">About you</legend>
        <div>
          <span className="label">Sex</span>
          <div className="segmented">
            {(['male', 'female'] as const).map((s) => (
              <label key={s} className="segmented-option capitalize">
                <input
                  type="radio"
                  name="sex"
                  className="sr-only"
                  checked={sex === s}
                  onChange={() => setSex(s)}
                />
                {s}
              </label>
            ))}
          </div>
          {error('sex') && <p role="alert" className="field-error">{error('sex')}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Age" inputMode="numeric" value={age} onChange={setAge} error={error('age')} />
          <NumberField label="Height" suffix="cm" value={height} onChange={setHeight} error={error('height_cm')} />
          <NumberField label="Weight" suffix="kg" value={weight} onChange={setWeight} error={error('weight_kg')} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="card-title">Goal</legend>
        <div className="segmented">
          {GOALS.map((g) => (
            <label key={g.value} className="segmented-option">
              <input
                type="radio"
                name="goal"
                className="sr-only"
                checked={goal === g.value}
                onChange={() => setGoal(g.value)}
              />
              {g.label}
            </label>
          ))}
        </div>
      </fieldset>

      {parsed.success ? (
        <TargetsSummary profile={{ ...parsed.data, kcal_adjust: profile.kcal_adjust }} />
      ) : (
        <p className="text-sm text-muted">Fill in every field to see your calorie and macro targets.</p>
      )}

      <button className="btn-primary w-full" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : submitLabel}
      </button>
    </form>

  );
}

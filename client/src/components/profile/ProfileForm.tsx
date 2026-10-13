import { LEVEL_LABELS, LEVELS, ProfileInput, PROGRAM_KEYS, PROGRAMS, recommendedProgram, type Level, type Profile, type ProgramKey } from '@fuellog/shared';
import { useId, useRef, useState, type FormEvent } from 'react';
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
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${id}-level`} className="label">Training level</label>
        <select id={`${id}-level`} className="input" value={level} onChange={(e) => changeLevel(e.target.value as Level)}>
          {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-program`} className="label">Weekly program</label>
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
          {PROGRAM_KEYS.map((key) => <option key={key} value={key}>{PROGRAMS[key].name}{key === suggested ? ' (recommended)' : ''}</option>)}
        </select>
        <p id={`${id}-program-help`} className="mt-1.5 text-sm text-muted">
          {PROGRAMS[program].summary}
          {program !== suggested && ` For ${LEVEL_LABELS[level].toLowerCase()} level we recommend ${PROGRAMS[suggested].name}.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-sex`} className="label">Sex</label>
          <select
            id={`${id}-sex`}
            className={`input ${error('sex') ? 'border-danger' : ''}`}
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            aria-invalid={!!error('sex')}
            aria-describedby={error('sex') ? `${id}-sex-error` : undefined}
          >
            <option value="" disabled>Choose</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {error('sex') && <p id={`${id}-sex-error`} role="alert" className="field-error">{error('sex')}</p>}
        </div>
        <NumberField label="Age" inputMode="numeric" value={age} onChange={setAge} error={error('age')} />
        <NumberField label="Height" suffix="cm" value={height} onChange={setHeight} error={error('height_cm')} />
        <NumberField label="Weight" suffix="kg" value={weight} onChange={setWeight} error={error('weight_kg')} />
      </div>
      <div>
        <label htmlFor={`${id}-goal`} className="label">Goal</label>
        <select id={`${id}-goal`} className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
          {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>

      {parsed.success ? (
        <TargetsSummary profile={{ ...parsed.data, kcal_adjust: profile.kcal_adjust }} />
      ) : (
        <p className="text-sm text-muted">Fill in every field to see your calorie and macro targets.</p>
      )}

      <button className="btn-primary w-full" disabled={save.isPending}>{save.isPending ? 'Saving…' : submitLabel}</button>
    </form>
  );
}

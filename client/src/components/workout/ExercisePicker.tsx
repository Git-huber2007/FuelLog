import { EXERCISE_TYPES, exercisePhotos, LEVEL_LABELS, LEVELS, LIBRARY, LIBRARY_MUSCLES, type ExerciseType, type Level, type LibraryExercise } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { api } from '../../lib/apiClient';
import { EmptyState } from '../ui/EmptyState';

const LEVEL_KEY = 'fuellog.level';
const SHOWN = 40;
const TYPE_LABELS: Record<ExerciseType, string> = { strength: 'Strength', cardio: 'Cardio', stretching: 'Stretching', plyometrics: 'Plyometrics' };

const savedLevel = (fallback: Level = 'beginner'): Level | 'all' => {
  let value: string | null = null;
  try {
    value = localStorage.getItem(LEVEL_KEY);
  } catch {
    // storage is blocked in some private windows; fall back to profile level
  }
  return LEVELS.includes(value as Level) ? (value as Level) : value === 'all' ? 'all' : fallback;
};

interface Props {
  date: string;
  /** Exercises already on this day, which cannot be added twice. */
  onDay: ReadonlySet<string>;
  onClose: () => void;
}

/** Browse the exercise library by type, muscle and level, and add any exercise to the day. */
export function ExercisePicker({ date, onDay, onClose }: Props) {
  const id = useId();
  const qc = useQueryClient();
  const profile = useProfile();
  const dialog = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<ExerciseType | 'all'>('all');
  const [muscle, setMuscle] = useState('all');
  const [level, setLevel] = useState<Level | 'all'>(() => savedLevel(profile.data?.profile.level)); // the chosen level is remembered on this device
  const [search, setSearch] = useState('');

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const matches = useMemo(() => {
    const words = search.toLowerCase().split(/\s+/).filter(Boolean);
    return LIBRARY.filter((e) =>
      (type === 'all' || e.type === type) && (muscle === 'all' || e.muscle === muscle) && (level === 'all' || e.level === level)
      && words.every((w) => e.name.toLowerCase().includes(w)));
  }, [type, muscle, level, search]);

  const add = useMutation({
    // An exercise is on a day once it has a set there, so adding it is saving an empty first set.
    mutationFn: (exercise: LibraryExercise) =>
      api(`/days/${date}/sets`, { method: 'PUT', body: { exercise_key: exercise.id, set_number: 1, weight_kg: 0, reps: 0 } }),
    // Returning the refetch keeps the buttons disabled until the row reads "Added". Toasts sit behind a modal, so errors show inline.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', date] }),
  });

  function chooseLevel(next: Level | 'all') {
    setLevel(next);
    try {
      localStorage.setItem(LEVEL_KEY, next);
    } catch {
      // not remembered when storage is blocked, which is fine
    }
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby={`${id}-title`}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-[500px] overflow-y-auto rounded-3xl border border-line bg-card p-0 text-text backdrop:bg-black/60">
      <div className="flex flex-col">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id={`${id}-title`} className="text-lg">Add an exercise</h2>
            {/* close() fires the dialog's close event, which returns focus to the button that opened it */}
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>Done</button>
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1" role="group" aria-label="Type of exercise">
            {(['all', ...EXERCISE_TYPES] as const).map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}
                className={`chip shrink-0 ${type === t ? 'border-transparent bg-accent font-semibold text-onaccent' : ''}`}>
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${id}-level`} className="label">Level</label>
              <select id={`${id}-level`} className="input" value={level} onChange={(e) => chooseLevel(e.target.value as Level | 'all')}>
                <option value="all">Any level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-muscle`} className="label">Muscle</label>
              <select id={`${id}-muscle`} className="input" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
                <option value="all">Any muscle</option>
                {LIBRARY_MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-search`} className="sr-only">Search exercises by name</label>
            <input id={`${id}-search`} className="input" type="search" autoComplete="off" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="p-4">
          {add.isError && <p role="alert" className="field-error mb-2 mt-0">{add.error.message}</p>}
          {matches.length === 0 ? (
            <EmptyState title="No exercise matches these filters" hint="Try another level or muscle, or clear the search." />
          ) : (
            <>
              <p className="mb-2 text-sm text-muted" role="status">
                {matches.length > SHOWN ? `Showing ${SHOWN} of ${matches.length}. Filter or search to narrow it down.` : `${matches.length} ${matches.length === 1 ? 'exercise' : 'exercises'}`}
              </p>
              <ul className="space-y-2">
                {matches.slice(0, SHOWN).map((exercise) => {
                  const added = onDay.has(exercise.id);
                  return (
                    <li key={exercise.id} className="flex items-center gap-3 rounded-2xl border border-line p-2">
                      <img src={exercisePhotos(exercise.id)[0]} alt="" loading="lazy" width={72} height={48} className="h-12 w-[72px] shrink-0 rounded-lg bg-line object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium" title={exercise.name}>{exercise.name}</p>
                        <p className="truncate text-sm text-muted" title={`${exercise.type === 'cardio' ? 'Cardio' : exercise.muscle} · ${LEVEL_LABELS[exercise.level]}`}>
                          {exercise.type === 'cardio' ? 'Cardio' : exercise.muscle} · {LEVEL_LABELS[exercise.level]}
                        </p>
                      </div>
                      <button type="button" className={added ? 'btn shrink-0' : 'btn-primary shrink-0'} disabled={added || add.isPending}
                        aria-label={added ? `Added, ${exercise.name}` : `Add ${exercise.name}`} onClick={() => add.mutate(exercise)}>
                        {added ? 'Added' : 'Add'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}

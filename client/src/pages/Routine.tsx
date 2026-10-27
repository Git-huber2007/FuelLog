import {
  exerciseName,
  exercisePhotos,
  LEAN_SIX_DAY_TEMPLATE,
  lookupExerciseKind,
  PROGRAMS,
  type Exercise,
  type LibraryExercise,
  type RoutineDayRow,
  type RoutineExerciseItem,
} from '@fuellog/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useToast } from '../components/ui/Toast';
import { CoachingGuide } from '../components/workout/CoachingGuide';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { ExercisePhoto } from '../components/workout/ExercisePhoto';
import { useDebouncedMutation } from '../hooks/useDebouncedMutation';
import { useProfile, useSaveProfile } from '../hooks/useProfile';
import { api } from '../lib/apiClient';

const WEEKDAYS = [
  { weekday: 1, name: 'Monday', short: 'Mon' },
  { weekday: 2, name: 'Tuesday', short: 'Tue' },
  { weekday: 3, name: 'Wednesday', short: 'Wed' },
  { weekday: 4, name: 'Thursday', short: 'Thu' },
  { weekday: 5, name: 'Friday', short: 'Fri' },
  { weekday: 6, name: 'Saturday', short: 'Sat' },
  { weekday: 0, name: 'Sunday', short: 'Sun' },
] as const;

interface Template {
  key: string;
  name: string;
  summary: string;
  days: { title: string; exercises: RoutineExerciseItem[] }[];
}

const TEMPLATES: Template[] = [
  ...(['full_body', 'upper_lower', 'six_day', 'arnold_six_day'] as const).map((key) => ({
    key,
    name: PROGRAMS[key].name,
    summary: PROGRAMS[key].summary,
    days: PROGRAMS[key].days.map((d) => ({ title: d.title, exercises: d.exercises.map(parseTemplateExercise) })),
  })),
  { key: 'lean_six_day', ...LEAN_SIX_DAY_TEMPLATE },
];

function parseTemplateExercise(ex: Exercise): RoutineExerciseItem {
  let reps_low = 8;
  let reps_high = 12;
  const matchRange = ex.prescription.match(/(\d+)–(\d+)/);
  if (matchRange) {
    reps_low = parseInt(matchRange[1], 10);
    reps_high = parseInt(matchRange[2], 10);
  } else {
    const matchNums = ex.prescription.match(/(\d+)/g);
    if (matchNums && matchNums.length >= 2) {
      reps_high = parseInt(matchNums[1], 10);
      reps_low = ex.kind === 'duration' ? Math.max(10, reps_high - 15) : Math.max(1, reps_high - 2);
    } else if (ex.topReps) {
      reps_high = ex.topReps;
      reps_low = Math.max(1, reps_high - 2);
    }
  }
  return {
    key: ex.key,
    sets: Math.min(10, Math.max(1, ex.sets || 3)),
    reps_low: Math.min(3600, Math.max(1, reps_low)),
    reps_high: Math.min(3600, Math.max(reps_low, reps_high)),
  };
}

interface DayEditorProps {
  weekday: number;
  initialTitle: string;
  initialExercises: RoutineExerciseItem[];
  onClose: () => void;
}

function DayEditor({ weekday, initialTitle, initialExercises, onClose }: DayEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const qc = useQueryClient();
  const id = useId();
  const [title, setTitle] = useState(initialTitle);
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>(initialExercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const weekdayInfo = WEEKDAYS.find((w) => w.weekday === weekday) ?? { name: `Day ${weekday}` };

  const { run, status, retry } = useDebouncedMutation(
    async (val: { title: string; exercises: RoutineExerciseItem[] }) => {
      const trimmedTitle = val.title.trim();
      if (!trimmedTitle && val.exercises.length === 0) {
        await api(`/routine/${weekday}`, { method: 'DELETE' });
      } else {
        await api<RoutineDayRow>(`/routine/${weekday}`, {
          method: 'PUT',
          body: {
            title: trimmedTitle.slice(0, 40),
            exercises: val.exercises,
          },
        });
      }
      qc.invalidateQueries({ queryKey: ['routine'] });
      qc.invalidateQueries({ queryKey: ['workout'] });
    },
    500
  );

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleTitleChange(newTitle: string) {
    const val = newTitle.slice(0, 40);
    setTitle(val);
    run({ title: val, exercises });
  }

  function handleAddExercise(lib: LibraryExercise) {
    if (exercises.length >= 15) return;
    const kind = lookupExerciseKind(lib.id);
    const newItem: RoutineExerciseItem = {
      key: lib.id,
      sets: 3,
      reps_low: kind === 'duration' ? 30 : 8,
      reps_high: kind === 'duration' ? 60 : 12,
    };
    const next = [...exercises, newItem];
    setExercises(next);
    run({ title, exercises: next });
    setAnnouncement(`${lib.name} added at position ${next.length} of ${next.length}`);
    setPickerOpen(false);
  }

  function handleRemove(index: number) {
    const removedName = exerciseName(exercises[index]?.key);
    const next = exercises.filter((_, i) => i !== index);
    setExercises(next);
    run({ title, exercises: next });
    setAnnouncement(`${removedName} removed`);
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;
    const next = [...exercises];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setExercises(next);
    run({ title, exercises: next });
    const exName = exerciseName(temp.key);
    setAnnouncement(`${exName} moved to position ${targetIndex + 1} of ${next.length}`);
  }

  function handleUpdateSets(index: number, delta: number) {
    const next = [...exercises];
    const current = next[index];
    const newSets = Math.min(10, Math.max(1, current.sets + delta));
    next[index] = { ...current, sets: newSets };
    setExercises(next);
    run({ title, exercises: next });
  }

  function handleUpdateReps(index: number, field: 'reps_low' | 'reps_high', delta: number) {
    const next = [...exercises];
    const current = next[index];
    const kind = lookupExerciseKind(current.key);
    const step = kind === 'duration' ? 15 : 1;
    const stepDelta = delta * step;

    if (field === 'reps_low') {
      const newLow = Math.min(3600, Math.max(1, current.reps_low + stepDelta));
      const newHigh = Math.max(newLow, current.reps_high);
      next[index] = { ...current, reps_low: newLow, reps_high: newHigh };
    } else {
      const newHigh = Math.min(3600, Math.max(current.reps_low, current.reps_high + stepDelta));
      next[index] = { ...current, reps_high: newHigh };
    }
    setExercises(next);
    run({ title, exercises: next });
  }

  function handleClearDay() {
    setTitle('');
    setExercises([]);
    run({ title: '', exercises: [] });
  }

  const existingKeys = useMemo(() => new Set(exercises.map((e) => e.key)), [exercises]);

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={onClose}
        aria-labelledby={`${id}-dialog-title`}
        className="sheet p-0"
      >
        <div className="flex max-h-[85dvh] flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 id={`${id}-dialog-title`} className="text-lg font-semibold">
                  {weekdayInfo.name}
                </h2>
                {status === 'saving' && (
                  <span className="text-xs text-muted animate-pulse">Saving…</span>
                )}
                {status === 'saved' && (
                  <span className="text-xs text-accent font-medium">Saved</span>
                )}
                {status === 'error' && (
                  <button type="button" onClick={retry} className="text-xs text-danger underline">
                    Failed to save. Retry?
                  </button>
                )}
              </div>
              <p className="text-xs text-muted">
                {exercises.length === 0 ? 'Rest day' : `${exercises.length} of 15 exercises`}
              </p>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Close editor"
              onClick={() => dialogRef.current?.close()}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor={`${id}-title`} className="label">
                  Day title
                </label>
                <span className="text-xs text-muted">{title.length}/40</span>
              </div>
              <input
                id={`${id}-title`}
                className="input"
                type="text"
                placeholder="e.g. Chest & Triceps, Leg day, or leave blank for Rest"
                maxLength={40}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {announcement}
              </div>
              <div className="flex items-center justify-between">
                <h3 className="card-title">Exercises ({exercises.length}/15)</h3>
                {exercises.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDay}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Clear day (rest)
                  </button>
                )}
              </div>

              {exercises.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                  <p className="text-sm font-medium text-muted">No exercises on {weekdayInfo.name}</p>
                  <p className="mt-1 text-xs text-muted">This day is treated as a rest day on your workout schedule.</p>
                  <button
                    type="button"
                    className="btn mt-4 text-sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    + Add exercise
                  </button>
                </div>
              ) : (
                <ul className="space-y-3" role="list">
                  {exercises.map((item, index) => {
                    const kind = lookupExerciseKind(item.key);
                    const name = exerciseName(item.key);
                    const isDuration = kind === 'duration';

                    return (
                      <li
                        key={`${item.key}-${index}`}
                        className="rounded-2xl border border-line bg-bg p-3.5 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <ExercisePhoto
                            src={exercisePhotos(item.key)[0]}
                            alt=""
                            loading="lazy"
                            width={54}
                            height={40}
                            className="h-10 w-14 shrink-0 rounded-lg bg-line object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 break-words font-medium text-sm text-text" title={name}>
                              {name}
                            </p>
                            <span className="text-xs text-muted capitalize">
                              {kind.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Reorder and Delete controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              className="icon-btn h-8 w-8 text-muted"
                              aria-label={`Move ${name} up, currently position ${index + 1} of ${exercises.length}`}
                              disabled={index === 0}
                              onClick={() => handleMove(index, 'up')}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 19V5M5 12l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn h-8 w-8 text-muted"
                              aria-label={`Move ${name} down, currently position ${index + 1} of ${exercises.length}`}
                              disabled={index === exercises.length - 1}
                              onClick={() => handleMove(index, 'down')}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 5v14M19 12l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="icon-btn h-8 w-8 text-danger hover:bg-danger/10"
                              aria-label={`Remove ${name}`}
                              onClick={() => handleRemove(index)}
                            >
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Sets & Reps Steppers */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line/60">
                          {/* Sets */}
                          <div className="flex items-center justify-between rounded-xl bg-card px-2.5 py-1 border border-line/60">
                            <span className="text-xs font-medium text-muted">Sets</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="icon-btn h-7 w-7 text-sm"
                                disabled={item.sets <= 1}
                                onClick={() => handleUpdateSets(index, -1)}
                                aria-label="Decrease sets"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-sm font-semibold tabular-nums">
                                {item.sets}
                              </span>
                              <button
                                type="button"
                                className="icon-btn h-7 w-7 text-sm"
                                disabled={item.sets >= 10}
                                onClick={() => handleUpdateSets(index, 1)}
                                aria-label="Increase sets"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Reps or Duration */}
                          {isDuration ? (
                            <div className="flex items-center justify-between rounded-xl bg-card px-2.5 py-1 border border-line/60">
                              <span className="text-xs font-medium text-muted">Duration</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  className="icon-btn h-7 w-7 text-sm"
                                  disabled={item.reps_high <= 15}
                                  onClick={() => handleUpdateReps(index, 'reps_high', -1)}
                                  aria-label="Decrease seconds"
                                >
                                  −
                                </button>
                                <span className="text-xs font-semibold tabular-nums">
                                  {item.reps_high}s
                                </span>
                                <button
                                  type="button"
                                  className="icon-btn h-7 w-7 text-sm"
                                  disabled={item.reps_high >= 3600}
                                  onClick={() => handleUpdateReps(index, 'reps_high', 1)}
                                  aria-label="Increase seconds"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between rounded-xl bg-card px-2.5 py-1 border border-line/60">
                              <span className="text-xs font-medium text-muted">Reps</span>
                              <div className="flex items-center gap-1 text-xs">
                                <button
                                  type="button"
                                  className="icon-btn h-7 w-7 text-sm"
                                  disabled={item.reps_low <= 1}
                                  onClick={() => handleUpdateReps(index, 'reps_low', -1)}
                                  aria-label="Decrease min reps"
                                >
                                  −
                                </button>
                                <span className="whitespace-nowrap font-semibold tabular-nums">
                                  {item.reps_low === item.reps_high ? item.reps_low : `${item.reps_low}–${item.reps_high}`}
                                </span>
                                <button
                                  type="button"
                                  className="icon-btn h-7 w-7 text-sm"
                                  disabled={item.reps_high >= 3600}
                                  onClick={() => handleUpdateReps(index, 'reps_high', 1)}
                                  aria-label="Increase max reps"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {exercises.length > 0 && exercises.length < 15 && (
                <button
                  type="button"
                  className="btn w-full mt-2 text-sm"
                  onClick={() => setPickerOpen(true)}
                >
                  + Add another exercise
                </button>
              )}
              {exercises.length >= 15 && (
                <p className="text-center text-xs text-muted">Maximum limit of 15 exercises reached.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-line bg-card p-4">
            <button
              type="button"
              className="btn-primary w-full"
              onClick={() => dialogRef.current?.close()}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>

      {pickerOpen && (
        <ExercisePicker
          onDay={existingKeys}
          onSelect={handleAddExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

export default function Routine() {
  const qc = useQueryClient();
  const toast = useToast();
  const profile = useProfile();
  const saveProfile = useSaveProfile();
  const [editingWeekday, setEditingWeekday] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const { data: routineDays, isPending, error, refetch } = useQuery<RoutineDayRow[]>({
    queryKey: ['routine'],
    queryFn: () => api<RoutineDayRow[]>('/routine'),
  });

  const dayMap = useMemo(() => {
    const map = new Map<number, RoutineDayRow>();
    if (routineDays) {
      for (const row of routineDays) {
        map.set(row.weekday, row);
      }
    }
    return map;
  }, [routineDays]);

  const activeProgram = profile.data?.profile.program;
  const isCustomProgram = activeProgram === 'custom';

  async function applyTemplate(template: Template) {
    if ([...dayMap.values()].some((d) => d.exercises.length > 0) && !window.confirm(`Replace your current routine with "${template.name}"?`)) return;
    setApplyingTemplate(true);
    try {
      for (let w = 0; w < 7; w++) {
        const tDay = template.days[w];
        if (!tDay || tDay.exercises.length === 0) {
          await api(`/routine/${w}`, { method: 'DELETE' });
        } else {
          await api<RoutineDayRow>(`/routine/${w}`, {
            method: 'PUT',
            body: {
              title: tDay.title,
              exercises: tDay.exercises,
            },
          });
        }
      }
      await qc.invalidateQueries({ queryKey: ['routine'] });
      await qc.invalidateQueries({ queryKey: ['workout'] });
      toast(`Template "${template.name}" copied to your routine`);
      setShowTemplates(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not apply template', 'error');
    } finally {
      setApplyingTemplate(false);
    }
  }

  async function activateCustomProgram() {
    if (!profile.data?.profile) return;
    const p = profile.data.profile;
    if (!p.sex || !p.age || !p.height_cm || !p.weight_kg) return;
    try {
      await saveProfile.mutateAsync({
        sex: p.sex,
        age: p.age,
        height_cm: p.height_cm,
        weight_kg: p.weight_kg,
        goal: p.goal,
        level: p.level ?? undefined,
        program: 'custom',
      });
      toast('Custom routine activated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not switch to custom', 'error');
    }
  }

  if (isPending) return <LoadingSkeleton />;
  if (error && !routineDays) return <ErrorState error={error} onRetry={() => refetch()} />;

  const editingDay = editingWeekday !== null ? dayMap.get(editingWeekday) : null;
  const anyPlanned = [...dayMap.values()].some((d) => d.exercises.length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-3 min-[380px]:px-4">
      {/* Top Banner if custom is not active */}
      {!isCustomProgram && (
        <section className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" aria-labelledby="active-program-alert">
          <div>
            <h2 id="active-program-alert" className="font-semibold text-sm text-text">Custom routine is not currently active</h2>
            <p className="text-xs text-muted mt-0.5">
              Your workouts currently follow <strong>{activeProgram ? PROGRAMS[activeProgram]?.name : 'Built-in program'}</strong>.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0 text-sm py-2 px-4 min-h-[36px]"
            onClick={activateCustomProgram}
            disabled={saveProfile.isPending}
          >
            {saveProfile.isPending ? 'Activating…' : 'Activate custom'}
          </button>
        </section>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/workout" className="inline-flex min-h-6 items-center text-sm text-muted hover:text-text">
            ← Workout
          </Link>
          <p className="text-sm text-muted mt-0.5">
            Configure your training split day by day. Sets and rep targets drive your daily workout page.
          </p>
        </div>

        <button
          type="button"
          className={`btn shrink-0 text-sm ${anyPlanned ? '' : 'btn-primary'}`}
          onClick={() => setShowTemplates(true)}
        >
          Start from template
        </button>
      </div>

      {/* Weekday Cards */}
      <section className="space-y-3" aria-label="7 Day Routine Schedule">
        <h2 className="sr-only">7-Day Routine Schedule</h2>
        {WEEKDAYS.map(({ weekday, name, short }) => {
          const dayData = dayMap.get(weekday);
          const hasExercises = dayData && dayData.exercises.length > 0;
          const title = dayData?.title || (hasExercises ? 'Workout' : 'Rest day');

          return (
            <div
              key={weekday}
              onClick={() => setEditingWeekday(weekday)}
              className="card cursor-pointer transition-all duration-200 hover:border-accent/50 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingWeekday(weekday);
                }
              }}
              aria-label={`Edit ${name}: ${title}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-bg border border-line">
                  <span className="text-[0.6875rem] font-bold uppercase text-muted tracking-wide">{short}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-text truncate">{name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      hasExercises ? 'bg-field text-text' : 'bg-field text-muted'
                    }`}>
                      {hasExercises ? `${dayData.exercises.length} ${dayData.exercises.length === 1 ? 'exercise' : 'exercises'}` : 'Rest'}
                    </span>
                  </div>
                  {hasExercises && (
                    <p className="text-sm text-muted truncate mt-0.5">
                      {dayData.exercises.map((e) => exerciseName(e.key)).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <span className="text-sm font-medium text-accent hover:underline sm:inline">
                  Edit <svg viewBox="0 0 24 24" className="inline h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <CoachingGuide />

      {/* Template Chooser Dialog */}
      {showTemplates && (
        <dialog
          open
          className="sheet p-0"
          onClose={() => setShowTemplates(false)}
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-semibold">Start from template</h2>
                <p className="text-xs text-muted">Copies a built-in split into your custom routine days.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowTemplates(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.key}
                  className="rounded-2xl border border-line bg-bg p-4 space-y-2 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-text">{tpl.name}</h3>
                    <button
                      type="button"
                      disabled={applyingTemplate}
                      onClick={() => applyTemplate(tpl)}
                      className="btn-primary text-xs py-1.5 px-3 min-h-[32px]"
                    >
                      {applyingTemplate ? 'Copying…' : 'Use template'}
                    </button>
                  </div>
                  <p className="text-xs text-muted">{tpl.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </dialog>
      )}

      {/* Day Editor Sheet */}
      {editingWeekday !== null && (
        <DayEditor
          key={editingWeekday}
          weekday={editingWeekday}
          initialTitle={editingDay?.title ?? ''}
          initialExercises={editingDay?.exercises ?? []}
          onClose={() => setEditingWeekday(null)}
        />
      )}
    </div>
  );
}

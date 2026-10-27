import { similarExercises } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

export function SkippedCard({ date, skipped, onDay }: { date: string; skipped: { key: string; name: string }[]; onDay: ReadonlySet<string> }) {
  const qc = useQueryClient();
  const toast = useToast();
  const refresh = () => qc.invalidateQueries({ queryKey: ['workout', date] });
  const restore = useMutation({
    mutationFn: (key: string) => api<void>(`/days/${date}/exercises/${encodeURIComponent(key)}`, { method: 'PUT' }),
    onSuccess: refresh,
    onError: (error) => toast(error.message, 'error'),
  });
  // Same request the exercise picker sends: an empty first set puts a library exercise on the day.
  const add = useMutation({
    mutationFn: (key: string) => api(`/days/${date}/sets`, { method: 'PUT', body: { exercise_key: key, set_number: 1, weight_kg: 0, reps: 0 } }),
    onSuccess: refresh,
    onError: (error) => toast(error.message, 'error'),
  });

  return (
    <section className="card space-y-2" aria-labelledby="skipped-title">
      <h2 id="skipped-title" className="card-title">Skipped today</h2>
      <ul className="divide-y divide-line" role="list">
        {skipped.map(({ key, name }) => {
          const alternatives = similarExercises(key, onDay);
          return (
            <li key={key} className="space-y-2 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-sm text-muted">{name}</span>
                <button
                  type="button"
                  className="btn min-h-[44px] shrink-0 text-sm"
                  disabled={restore.isPending}
                  onClick={() => restore.mutate(key)}
                  aria-label={`Restore ${name}`}
                >
                  Restore
                </button>
              </div>
              {alternatives.length > 0 && (
                <div>
                  <p className="text-xs text-muted">Try instead</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {alternatives.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        className="chip text-left"
                        disabled={add.isPending}
                        onClick={() => add.mutate(alt.id)}
                        aria-label={`Add ${alt.name} instead of ${name}`}
                      >
                        <span>
                          + {alt.name}
                          {alt.equipment && <span className="text-muted"> · {alt.equipment}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

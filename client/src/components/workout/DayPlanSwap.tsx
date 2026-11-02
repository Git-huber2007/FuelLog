import { weekdayOf } from '@fuellog/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';

interface Props {
  date: string;
  planWeekday: number;
  options: { weekday: number; title: string }[];
}

/** Trains another day's plan on this date, for when the body is ready for a different muscle than the program says. */
export function DayPlanSwap({ date, planWeekday, options }: Props) {
  const qc = useQueryClient();
  const toast = useToast();
  const scheduled = weekdayOf(date);
  const swap = useMutation({
    // The scheduled weekday clears the swap, so the day goes back to following the program.
    mutationFn: (weekday: number) =>
      api<void>(`/days/${date}/plan-day`, { method: 'PUT', body: { weekday: weekday === scheduled ? null : weekday } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout', date] }),
    onError: (error) => toast(error.message, 'error'),
  });

  if (options.length < 2) return null;

  return (
    <section className="card space-y-2" aria-labelledby="swap-day-title">
      <h2 id="swap-day-title" className="card-title">Train a different day</h2>
      <label htmlFor="swap-day" className="sr-only">Plan for this day</label>
      <select
        id="swap-day"
        className="input"
        value={planWeekday}
        disabled={swap.isPending}
        aria-describedby="swap-day-help"
        onChange={(e) => swap.mutate(Number(e.target.value))}
      >
        {options.map(({ weekday, title }) => (
          <option key={weekday} value={weekday}>
            {title}{weekday === scheduled ? ' (scheduled)' : ''}
          </option>
        ))}
      </select>
      <p id="swap-day-help" className="text-xs text-muted">
        Changes this day only. Your program and every other day stay as they are, and logged sets keep their own exercise.
      </p>
    </section>
  );
}

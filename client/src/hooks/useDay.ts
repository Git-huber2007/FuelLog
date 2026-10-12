import type { DayResponse, FoodLog, LogEntryInput } from '@fuellog/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/apiClient';

export const dayKey = (date: string) => ['day', date] as const;

export const useDay = (date: string) => useQuery({ queryKey: dayKey(date), queryFn: () => api<DayResponse>(`/days/${date}`) });

/** Call after anything that changes a day's food logs. */
export function invalidateLogs(qc: QueryClient, date: string) {
  qc.invalidateQueries({ queryKey: dayKey(date) });
  qc.invalidateQueries({ queryKey: ['recent-foods'] });
  qc.invalidateQueries({ queryKey: ['progress'] });
}

export const isPending = (log: FoodLog) => log.id.startsWith('pending-');

/** Shared optimistic plumbing: apply the change to the cached day at once, put it back if the server refuses. */
function useOptimisticDay<V>(date: string, mutationFn: (value: V) => Promise<unknown>, apply: (day: DayResponse, value: V) => DayResponse) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationKey: ['optimistic-day', date],
    mutationFn,
    onMutate: async (value: V) => {
      await qc.cancelQueries({ queryKey: dayKey(date) });
      const previous = qc.getQueryData<DayResponse>(dayKey(date));
      if (previous) qc.setQueryData(dayKey(date), apply(previous, value));
      return { previous };
    },
    onError: (error, _value, context) => {
      if (context?.previous) qc.setQueryData(dayKey(date), context.previous);
      toast(error.message, 'error');
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey: ['optimistic-day', date] }) <= 1) {
        invalidateLogs(qc, date);
      }
    },
  });
}

export const useAddFood = (date: string) =>
  useOptimisticDay(
    date,
    (entries: LogEntryInput[]) => api<FoodLog[]>(`/days/${date}/food`, { body: { entries } }),
    (day, entries) => ({
      ...day,
      logs: [
        ...day.logs,
        ...entries.map((e, i): FoodLog => ({
          ...e, id: `pending-${Date.now()}-${i}`, log_date: date, food_id: e.food_id ?? null, servings: e.servings ?? 1, created_at: new Date().toISOString(),
        })),
      ],
    }),
  );

export const useDeleteLog = (date: string) =>
  useOptimisticDay(
    date,
    (id: string) => api<void>(`/food-logs/${id}`, { method: 'DELETE' }),
    (day, id) => ({ ...day, logs: day.logs.filter((l) => l.id !== id) }),
  );

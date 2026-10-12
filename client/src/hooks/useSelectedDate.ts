import { DateParam, todayISO } from '@fuellog/shared';
import { useSearchParams } from 'react-router-dom';

/** The day being viewed, shared by Today and Workout through ?date=YYYY-MM-DD. Never later than today. */
export function useSelectedDate() {
  const [params, setParams] = useSearchParams();
  const today = todayISO();
  const raw = params.get('date');
  const date = raw && DateParam.safeParse(raw).success && raw <= today ? raw : today;
  const setDate = (next: string) => setParams(next >= today ? {} : { date: next }, { replace: true });
  return { date, today, isToday: date === today, setDate };
}

import { DateParam, todayISO } from '@fuellog/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** The day being viewed, shared by Today and Workout through ?date=YYYY-MM-DD. Never later than today. */
export function useSelectedDate() {
  const [params, setParams] = useSearchParams();
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    function refresh() {
      const next = todayISO();
      setToday((prev) => (prev !== next ? next : prev));
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('visibilitychange', onVisibility);

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const timer = window.setTimeout(refresh, msUntilMidnight);

    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timer);
    };
  }, [today]);

  const raw = params.get('date');
  const date = raw && DateParam.safeParse(raw).success && raw <= today ? raw : today;
  const setDate = (next: string) => setParams(next >= today ? {} : { date: next }, { replace: true });
  return { date, today, isToday: date === today, setDate };
}

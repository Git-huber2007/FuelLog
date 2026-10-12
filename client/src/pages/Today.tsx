import { nudge, sumMacros } from '@fuellog/shared';
import { AddFoodCard } from '../components/today/AddFoodCard';
import { CalorieRing } from '../components/today/CalorieRing';
import { DailyCheckCard } from '../components/today/DailyCheckCard';
import { EatenList } from '../components/today/EatenList';
import { MacroBars } from '../components/today/MacroBars';
import { NudgeLine } from '../components/today/NudgeLine';
import { StreakBadge } from '../components/today/StreakBadge';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useDay } from '../hooks/useDay';
import { useProgress } from '../hooks/useProgress';
import { useSelectedDate } from '../hooks/useSelectedDate';

export default function Today() {
  const { date, isToday } = useSelectedDate();
  const day = useDay(date);
  const progress = useProgress();

  if (day.isPending) return <LoadingSkeleton />;
  if (day.isError) return <ErrorState error={day.error} onRetry={() => day.refetch()} />;

  const { targets, logs, check } = day.data;
  const totals = sumMacros(logs);
  const line = nudge({
    isToday,
    hour: new Date().getHours(),
    targets,
    eaten: totals,
    water_ml: check?.water_ml ?? 0,
    hasWeighIn: day.data.weight_kg !== null,
    foods: day.data.proteinFoods,
  });

  return (
    <>
      <section className="card space-y-3" aria-label="Calories and macros">
        <div className="flex items-center gap-4">
          <CalorieRing eaten={totals.kcal} target={targets.kcal} />
          <MacroBars totals={totals} targets={targets} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span className="tabular-nums">{Math.round(totals.kcal)} of {targets.kcal} kcal eaten</span>
          <StreakBadge days={progress.data?.streak} />
        </div>
        <NudgeLine text={line} />
      </section>
      <AddFoodCard key={`add-${date}`} date={date} />
      <EatenList date={date} logs={logs} />
      <DailyCheckCard key={`check-${date}`} date={date} initial={check} waterTargetMl={targets.water_ml} />
    </>
  );
}

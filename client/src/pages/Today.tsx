import { nudge, stepsKcal, sumMacros, workoutKcal } from '@fuellog/shared';
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
import { useProfile } from '../hooks/useProfile';
import { useProgress } from '../hooks/useProgress';
import { useSelectedDate } from '../hooks/useSelectedDate';

export default function Today() {
  const { date, isToday } = useSelectedDate();
  const day = useDay(date);
  const progress = useProgress();
  const profile = useProfile();

  if (day.isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5 items-start space-y-5 md:space-y-0">
        <div className="space-y-5">
          <LoadingSkeleton variant="hero" />
          <LoadingSkeleton cards={1} />
        </div>
        <div className="space-y-5">
          <LoadingSkeleton cards={2} />
        </div>
      </div>
    );
  }
  if (day.isError) return <ErrorState error={day.error} onRetry={() => day.refetch()} />;

  const { targets, logs, check } = day.data;
  const totals = sumMacros(logs);
  const bodyKg = profile.data?.profile.weight_kg ?? day.data.weight_kg;
  const workoutBurn = bodyKg ? workoutKcal(day.data.sets.map((s) => ({ cardio: s.cardio, logged: [s] })), bodyKg) : 0;
  const walkingBurn = bodyKg && check?.steps ? stepsKcal(check.steps, bodyKg) : 0;
  const totalBurn = workoutBurn + walkingBurn;
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
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5 items-start space-y-5 md:space-y-0">
      <div className="space-y-5">
        <div className="bezel">
          <section className="card space-y-4 rounded-[1.75rem]" aria-label="Calories and macros">
            <div className="flex flex-col min-[360px]:flex-row items-center gap-5">
              <CalorieRing eaten={totals.kcal} target={targets.kcal} />
              <MacroBars totals={totals} targets={targets} />
            </div>
            <dl className="grid grid-cols-3 gap-2">
              {([['Eaten', Math.round(totals.kcal)], ['Target', targets.kcal], ['Burned', totalBurn]] as const).map(([label, value]) => (
                <div key={label} className="tile px-3 py-2.5">
                  <dt className="tile-label">{label}</dt>
                  <dd className="tile-value text-lg">
                    {value.toLocaleString()}
                    <span className="sr-only"> kcal</span>
                  </dd>
                </div>
              ))}
            </dl>
            {totalBurn > 0 && <p className="text-sm text-muted">Burned is an estimate: workout {workoutBurn}, walking {walkingBurn}.</p>}
            <NudgeLine text={line} />
            <StreakBadge days={progress.data?.streak} />
          </section>
        </div>
        <DailyCheckCard key={`check-${date}`} date={date} initial={check} waterTargetMl={targets.water_ml} bodyKg={profile.data?.profile.weight_kg ?? null} />
      </div>
      <div className="space-y-5">
        <AddFoodCard key={`add-${date}`} date={date} />
        <EatenList date={date} logs={logs} />
      </div>
    </div>
  );
}

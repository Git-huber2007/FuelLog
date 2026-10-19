import { nudge, stepsKcal, sumMacros, workoutKcal } from '@fuellog/shared';
import { AddFoodCard } from '../components/today/AddFoodCard';
import { DailyCheckCard } from '../components/today/DailyCheckCard';
import { EatenList } from '../components/today/EatenList';
import { MacroBars } from '../components/today/MacroBars';
import { NudgeLine } from '../components/today/NudgeLine';
import { Scoreboard } from '../components/today/Scoreboard';
import { WeekStrip } from '../components/today/WeekStrip';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useDay } from '../hooks/useDay';
import { useProfile } from '../hooks/useProfile';
import { useProgress } from '../hooks/useProgress';
import { useSelectedDate } from '../hooks/useSelectedDate';
import { useSession } from '../hooks/useSession';

export default function Today() {
  const { session } = useSession();
  const userName = ((session?.user.user_metadata?.name ?? session?.user.user_metadata?.full_name ?? '') as string) || '';
  const { date, isToday, setDate } = useSelectedDate();
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
  const workoutBurn = bodyKg ? workoutKcal(day.data.sets.map((s) => ({ kind: s.kind, cardio: s.cardio, logged: [s] })), bodyKg) : 0;
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
    // Below md the column wrappers dissolve (contents), so the daily check can drop under the food cards on a phone
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 items-start">
      <div className="contents md:block md:space-y-5">
        {userName && (
          <p className="px-1 text-base font-semibold">{isToday ? `Hi ${userName}` : `${userName}'s log`}</p>
        )}
        <Scoreboard eaten={totals.kcal} target={targets.kcal} burned={totalBurn} streak={progress.data?.streak} />
        {!!progress.data?.calories.length && <WeekStrip days={progress.data.calories} selected={date} onSelect={setDate} />}
        <section className="card space-y-4" aria-label="Macros">
          <MacroBars totals={totals} targets={targets} />
          {totalBurn > 0 && <p className="text-sm text-muted">Burned is an estimate: workout {workoutBurn}, walking {walkingBurn}. It does not change your calorie target.</p>}
          <NudgeLine text={line} />
        </section>
        <div className="order-last md:order-none">
          <DailyCheckCard key={`check-${date}`} date={date} initial={check} waterTargetMl={targets.water_ml} />
        </div>
      </div>
      <div className="contents md:block md:space-y-5">
        <AddFoodCard key={`add-${date}`} date={date} />
        <EatenList date={date} logs={logs} />
      </div>
    </div>
  );
}

import { todayISO } from '@fuellog/shared';
import { AdviceCard } from '../components/progress/AdviceCard';
import { CalorieBarsChart } from '../components/progress/CalorieBarsChart';
import { CoachCard } from '../components/progress/CoachCard';
import { ExportButton } from '../components/progress/ExportButton';
import { MeasurementDeltas } from '../components/progress/MeasurementDeltas';
import { MeasurementsForm } from '../components/progress/MeasurementsForm';
import { PhotoGrid } from '../components/progress/PhotoGrid';
import { PhotoUploadButton } from '../components/progress/PhotoUploadButton';
import { WeekSummaryCard } from '../components/progress/WeekSummaryCard';
import { WeightChart } from '../components/progress/WeightChart';
import { WeightForm } from '../components/progress/WeightForm';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useDay } from '../hooks/useDay';
import { useProfile } from '../hooks/useProfile';
import { useProgress } from '../hooks/useProgress';

export default function Progress() {
  const today = todayISO();
  const progress = useProgress();
  const day = useDay(today);
  const aiEnabled = useProfile().data?.aiEnabled ?? false;

  if (progress.isPending) return <LoadingSkeleton cards={4} />;
  if (progress.isError) return <ErrorState error={progress.error} onRetry={() => progress.refetch()} />;

  const { weights, calories, summary, measurements, advice } = progress.data;
  const todayWeight = weights.find((w) => w.log_date === today)?.weight_kg;

  return (
    <>
      <WeekSummaryCard summary={summary} />

      <section className="card space-y-4" aria-labelledby="weight-title">
        <h2 id="weight-title" className="text-base">Weight</h2>
        <WeightForm key={todayWeight ?? 'none'} todayWeight={todayWeight} />
        <WeightChart weights={weights} />
        {weights.length > 0 && <p className="text-sm text-muted">Dots are weigh-ins. The line is your 7-day average.</p>}
      </section>

      <AdviceCard advice={advice} />

      <section className="card space-y-3" aria-labelledby="calories-title">
        <h2 id="calories-title" className="text-base">Calories, last 14 days</h2>
        <CalorieBarsChart days={calories} />
      </section>

      <section className="card space-y-4" aria-labelledby="measure-title">
        <h2 id="measure-title" className="text-base">Measurements</h2>
        <MeasurementDeltas deltas={measurements} />
        {day.isPending ? (
          <LoadingSkeleton cards={1} />
        ) : day.isError ? (
          <ErrorState error={day.error} onRetry={() => day.refetch()} />
        ) : (
          <MeasurementsForm key={JSON.stringify(day.data.measurements)} initial={day.data.measurements} />
        )}
      </section>

      <section className="card space-y-4" aria-labelledby="photos-title">
        <h2 id="photos-title" className="text-base">Progress photos</h2>
        <PhotoGrid />
        <PhotoUploadButton />
      </section>

      {aiEnabled && <CoachCard />}

      <section className="card space-y-3" aria-labelledby="export-title">
        <h2 id="export-title" className="text-base">Your data</h2>
        <ExportButton />
      </section>
    </>
  );
}

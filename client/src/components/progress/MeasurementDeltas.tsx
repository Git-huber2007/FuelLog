import type { ProgressResponse } from '@fuellog/shared';
import { EmptyState } from '../ui/EmptyState';

const LABELS = { waist_cm: 'Waist', chest_cm: 'Chest', arm_cm: 'Arm' } as const;

/** Latest value of each measurement and how far it has moved since the first entry. */
export function MeasurementDeltas({ deltas }: { deltas: ProgressResponse['measurements'] }) {
  const keys = (Object.keys(LABELS) as (keyof typeof LABELS)[]).filter((key) => deltas[key]);
  if (!keys.length) {
    return <EmptyState title="No measurements yet" hint="Measure waist, chest or arm once a week and save it below. Changes since your first entry show here." />;
  }
  return (
    <dl className="divide-y divide-line">
      {keys.map((key) => {
        const d = deltas[key]!;
        return (
          <div key={key} className="flex items-baseline gap-3 py-2.5">
            <dt className="flex-1 text-sm text-muted">{LABELS[key]}</dt>
            <dd className="text-xl font-bold leading-none tracking-[-0.01em]">{d.latest} cm</dd>
            <dd className="w-20 text-right text-sm text-muted">{d.delta === 0 ? 'No change' : `${d.delta > 0 ? '+' : '−'}${Math.abs(d.delta)} cm`}</dd>
          </div>
        );
      })}
    </dl>
  );
}

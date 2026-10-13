import type { MacroTotals, Targets } from '@fuellog/shared';

const BARS = [
  { key: 'protein_g', label: 'Protein', color: 'bg-protein' },
  { key: 'carbs_g', label: 'Carbs', color: 'bg-carbs' },
  { key: 'fat_g', label: 'Fat', color: 'bg-fat' },
  { key: 'fibre_g', label: 'Fibre', color: 'bg-muted' },
] as const;

export function MacroBars({ totals, targets }: { totals: MacroTotals; targets: Targets }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {BARS.map(({ key, label, color }) => {
        const eaten = Math.round(totals[key]);
        const target = targets[key];
        return (
          <li key={key}>
            <div className="flex justify-between gap-2 text-sm">
              <span>{label}</span>
              <span className="whitespace-nowrap text-[0.8125rem] tabular-nums text-muted">{eaten} / {target} g</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={eaten}>
              <div className={`h-full w-full rounded-full origin-left transition-transform duration-500 ease-out ${color}`} style={{ transform: `scaleX(${target ? Math.min(1, eaten / target) : 0})` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

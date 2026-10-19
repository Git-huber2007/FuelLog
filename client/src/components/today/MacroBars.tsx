import type { MacroTotals, Targets } from '@fuellog/shared';

const BARS = [
  { key: 'protein_g', label: 'Protein', color: 'bg-protein' },
  { key: 'carbs_g', label: 'Carbs', color: 'bg-carbs' },
  { key: 'fat_g', label: 'Fat', color: 'bg-fat' },
  { key: 'fibre_g', label: 'Fibre', color: 'bg-muted' },
] as const;

export function MacroBars({ totals, targets }: { totals: MacroTotals; targets: Targets }) {
  return (
    <ul className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-3">
      {BARS.map(({ key, label, color }) => {
        const eaten = Math.round(totals[key]);
        const target = targets[key];
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="tile-label">{label}</span>
              <span className="whitespace-nowrap text-sm"><span className="font-bold">{eaten}</span><span className="text-muted"> / {target} g</span></span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={eaten}>
              <div className={`h-full w-full origin-left transition-transform duration-500 ease-out ${color}`} style={{ transform: `scaleX(${target ? Math.min(1, eaten / target) : 0})` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

import type { ProgressResponse } from '@fuellog/shared';

type Day = ProgressResponse['calories'][number];

/** Calories, protein and training as fractions of the day's goal: outer to inner. Calories over 110% turn amber. */
export function ringsFor(d: Day) {
  return [
    { value: d.target ? d.kcal / d.target : 0, className: d.kcal > d.target * 1.1 ? 'stroke-fat' : 'stroke-accent' },
    { value: d.proteinTarget ? d.protein / d.proteinTarget : 0, className: 'stroke-protein' },
    { value: d.trained ? 1 : 0, className: 'stroke-carbs' },
  ];
}

/** Apple-style concentric activity rings. Decorative: callers give the numbers in text or a label. */
export function Rings({ rings, size = 32 }: { rings: { value: number; className: string }[]; size?: number }) {
  const stroke = size / 9;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90 shrink-0" aria-hidden>
      {rings.map((ring, i) => {
        const r = size / 2 - stroke / 2 - i * (stroke + 1);
        const c = 2 * Math.PI * r;
        return (
          <g key={i} className={ring.className} fill="none" strokeWidth={stroke}>
            <circle cx={size / 2} cy={size / 2} r={r} opacity={0.18} />
            {ring.value > 0 && (
              <circle cx={size / 2} cy={size / 2} r={r} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, ring.value))} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

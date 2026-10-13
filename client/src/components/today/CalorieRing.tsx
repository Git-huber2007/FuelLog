const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function CalorieRing({ eaten, target }: { eaten: number; target: number }) {
  const left = Math.round(target - eaten);
  const over = left < 0;
  const filled = Math.min(1, eaten / target);
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0 sm:h-36 sm:w-36" role="img"
      aria-label={`${Math.abs(left)} kcal ${over ? 'over' : 'left'}. Eaten ${Math.round(eaten)} of ${target} kcal.`}>
      <circle cx="60" cy="60" r={R} fill="none" strokeWidth="8" className="stroke-line" />
      <circle cx="60" cy="60" r={R} fill="none" strokeWidth="8" strokeLinecap="round" transform="rotate(-90 60 60)"
        className={`transition-[stroke-dashoffset] duration-500 ${over ? 'stroke-fat' : 'stroke-kcal'}`}
        strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - filled)} />
      <text x="60" y="64" textAnchor="middle" className="fill-text text-[32px] font-semibold tabular-nums [letter-spacing:-0.04em]">{Math.abs(left)}</text>
      <text x="60" y="80" textAnchor="middle" className="fill-muted text-[9.5px] font-medium uppercase tracking-[0.1em]">kcal {over ? 'over' : 'left'}</text>
    </svg>
  );
}

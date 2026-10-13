const STEP_ML = 250;
const MAX_ML = 10_000;

export function WaterCounter({ ml, targetMl, onChange }: { ml: number; targetMl: number; onChange: (ml: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4" role="group" aria-label="Water">
      <div className="min-w-0 flex-1">
        <p className="label mb-0">Water</p>
        <p className="tabular-nums" aria-live="polite"><span className="text-xl font-semibold tracking-tight">{(ml / 1000).toFixed(2)}</span><span className="stat-unit">of {(targetMl / 1000).toFixed(1)} L</span></p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-carbs transition-[width] duration-500" style={{ width: `${Math.min(100, (ml / targetMl) * 100)}%` }} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="icon-btn border border-line" aria-label="Remove 250 ml of water" disabled={ml <= 0} onClick={() => onChange(Math.max(0, ml - STEP_ML))}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /></svg></button>
        <button type="button" className="btn" aria-label="Add 250 ml of water" disabled={ml >= MAX_ML} onClick={() => onChange(Math.min(MAX_ML, ml + STEP_ML))}>+250 ml</button>
      </div>
    </div>
  );
}

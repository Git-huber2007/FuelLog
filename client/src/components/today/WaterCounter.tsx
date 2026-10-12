const STEP_ML = 250;
const MAX_ML = 10_000;

export function WaterCounter({ ml, targetMl, onChange }: { ml: number; targetMl: number; onChange: (ml: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3" role="group" aria-label="Water">
      <div>
        <p>Water</p>
        <p className="text-sm tabular-nums text-muted" aria-live="polite">{(ml / 1000).toFixed(2)} of {(targetMl / 1000).toFixed(1)} L</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn px-0" aria-label="Remove 250 ml of water" disabled={ml <= 0} onClick={() => onChange(Math.max(0, ml - STEP_ML))}>−</button>
        <button type="button" className="btn" aria-label="Add 250 ml of water" disabled={ml >= MAX_ML} onClick={() => onChange(Math.min(MAX_ML, ml + STEP_ML))}>+250 ml</button>
      </div>
    </div>
  );
}

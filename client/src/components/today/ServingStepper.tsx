const STEP = 0.5;
const MAX = 50;

export function ServingStepper({ value, onChange }: { value: number; onChange: (servings: number) => void }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Servings">
      <button type="button" className="btn px-0" aria-label="Fewer servings" disabled={value <= STEP} onClick={() => onChange(value - STEP)}>−</button>
      <output className="w-10 text-center font-semibold tabular-nums" aria-live="polite">{value}</output>
      <button type="button" className="btn px-0" aria-label="More servings" disabled={value >= MAX} onClick={() => onChange(value + STEP)}>+</button>
    </div>
  );
}

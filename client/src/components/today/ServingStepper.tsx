const STEP = 0.5;
const MAX = 50;

export function ServingStepper({ value, onChange }: { value: number; onChange: (servings: number) => void }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Servings">
      <button type="button" className="icon-btn border border-line" aria-label="Fewer servings" disabled={value <= STEP} onClick={() => onChange(value - STEP)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14" /></svg></button>
      <output className="w-10 text-center font-semibold tabular-nums" aria-live="polite">{value}</output>
      <button type="button" className="icon-btn border border-line" aria-label="More servings" disabled={value >= MAX} onClick={() => onChange(value + STEP)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg></button>
    </div>
  );
}

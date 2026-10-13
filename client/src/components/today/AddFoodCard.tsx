import { defaultMeal, type AiParseResponse, type Food, type Meal } from '@fuellog/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { invalidateLogs, useAddFood } from '../../hooks/useDay';
import { useProfile } from '../../hooks/useProfile';
import { entryFromFood } from '../../lib/entries';
import { ActionIcon } from '../ui/ActionIcon';
import { useToast } from '../ui/Toast';
import { AiPhotoButton } from './AiPhotoButton';
import { AiTextForm } from './AiTextForm';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CustomFoodForm } from './CustomFoodForm';
import { FoodSearchInput } from './FoodSearchInput';
import { MealSlotPicker } from './MealSlotPicker';
import { QuickAddChips } from './QuickAddChips';
import { SavedMealChips } from './SavedMealChips';
import { ServingStepper } from './ServingStepper';

type Panel ={ kind: 'search' } | { kind: 'custom'; name: string } | { kind: 'ai' };

export function AddFoodCard({ date }: { date: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const aiEnabled = useProfile().data?.aiEnabled ?? false;
  const add = useAddFood(date);
  const scanBtnRef = useRef<HTMLButtonElement>(null);
  const [meal, setMeal] = useState<Meal>(() => defaultMeal(new Date()));
  const [picked, setPicked] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [panel, setPanel] = useState<Panel>({ kind: 'search' });
  const [scanning, setScanning] = useState(false);
  const [aiNote, setAiNote] = useState<string>();

  const closeScanner = () => {
    setScanning(false);
    scanBtnRef.current?.focus();
  };

  const pick = (food: Food) => {
    setPicked(food);
    setServings(1);
    setPanel({ kind: 'search' });
  };

  function logPicked() {
    if (!picked) return;
    add.mutate([entryFromFood(picked, servings, meal)]);
    toast(`Added ${picked.name}`);
    setPicked(null);
  }

  function onAiResult(result: AiParseResponse) {
    invalidateLogs(qc, date);
    const count = result.entries.length;
    setAiNote(`${count ? `Added ${count} ${count === 1 ? 'item' : 'items'}.` : 'Nothing was added.'} ${result.note}`.trim());
    if (count) setPanel({ kind: 'search' });
  }

  return (
    <section className="card space-y-4" aria-labelledby="add-food-title">
      <h2 id="add-food-title" className="card-title">Add food</h2>
      <MealSlotPicker value={meal} onChange={setMeal} />

      {picked ? (
        <div className="space-y-3 rounded-2xl border border-line p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 font-medium" title={picked.name}>{picked.name}</p>
              <p className="text-sm text-muted">{picked.serving_label} per serving</p>
            </div>
            <p className="shrink-0 text-right text-sm tabular-nums">
              {Math.round(picked.kcal * servings)} kcal
              <span className="block text-muted">{Math.round(picked.protein_g * servings)} g protein</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ServingStepper value={servings} onChange={setServings} />
            <div className="flex gap-2">
              <button type="button" className="btn" onClick={() => setPicked(null)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={logPicked}>Add</button>
            </div>
          </div>
        </div>
      ) : (
        panel.kind === 'search' && <FoodSearchInput onPick={pick} onCreate={(name) => setPanel({ kind: 'custom', name })} />
      )}

      {panel.kind === 'custom' && (
        <CustomFoodForm key={panel.name} initialName={panel.name} onCancel={() => setPanel({ kind: 'search' })}
          onCreated={(food) => { toast(`${food.name} saved to your foods.`); pick(food); }} />
      )}
      {panel.kind === 'ai' && aiEnabled && <AiTextForm date={date} meal={meal} onResult={onAiResult} />}

      <QuickAddChips date={date} meal={meal} />
      <SavedMealChips date={date} meal={meal} />
      <div className="grid grid-cols-2 gap-2">
        <button ref={scanBtnRef} type="button" className="action" onClick={() => setScanning(true)}>
          <ActionIcon d="M4 7V5a1 1 0 0 1 1-1h2m10 0h2a1 1 0 0 1 1 1v2m0 10v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M8 8v8m3-8v8m3-8v8m2-8v8" />
          Scan barcode
        </button>
        <button type="button" className="action" aria-pressed={panel.kind === 'custom'} onClick={() => setPanel(panel.kind === 'custom' ? { kind: 'search' } : { kind: 'custom', name: '' })}>
          <ActionIcon d="M12 5v14m-7-7h14" />
          Custom food
        </button>
        {aiEnabled && (
          <>
            <button type="button" className="action" aria-pressed={panel.kind === 'ai'} onClick={() => setPanel(panel.kind === 'ai' ? { kind: 'search' } : { kind: 'ai' })}>
              <ActionIcon d="M4 6h16M4 12h10M4 18h7m7-5 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z" />
              Describe meal
            </button>
            <AiPhotoButton date={date} meal={meal} onResult={onAiResult} />
          </>
        )}
      </div>

      {aiNote && (
        <p role="status" className="text-sm">
          {aiNote} <span className="text-muted">Estimates only, not medical advice.</span>
        </p>
      )}

      {scanning && (
        <BarcodeScannerModal
          onClose={closeScanner}
          onFood={(food) => { setScanning(false); pick(food); }}
          onUnknown={() => {
            setScanning(false);
            toast('That barcode is not in Open Food Facts. Add it as a custom food.');
            setPanel({ kind: 'custom', name: '' });
          }}
        />
      )}
    </section>
  );
}

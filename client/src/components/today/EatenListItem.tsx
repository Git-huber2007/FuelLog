import type { FoodLog } from '@fuellog/shared';
import { isPending } from '../../hooks/useDay';

export function EatenListItem({ log, onDelete }: { log: FoodLog; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-2 py-1">
      <div className="min-w-0 flex-1">
        <p className="truncate">{log.name}</p>
        <p className="text-sm tabular-nums text-muted">
          {log.servings !== 1 && `${log.servings} × · `}{Math.round(log.kcal)} kcal · {Math.round(log.protein_g)} g protein
        </p>
      </div>
      {/* An entry still being saved has no server id yet, so it cannot be deleted for a moment. */}
      <button type="button" className="btn px-0 text-muted" aria-label={`Delete ${log.name}`} disabled={isPending(log)} onClick={onDelete}>✕</button>
    </li>
  );
}

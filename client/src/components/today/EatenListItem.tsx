import type { FoodLog } from '@fuellog/shared';
import { isPending } from '../../hooks/useDay';

export function EatenListItem({ log, onDelete }: { log: FoodLog; onDelete: () => void }) {
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    const currentLi = e.currentTarget.closest('li');
    const nextTarget = currentLi?.nextElementSibling?.querySelector('button')
      || currentLi?.previousElementSibling?.querySelector('button')
      || (document.getElementById('eaten-title') as HTMLElement | null);
    onDelete();
    setTimeout(() => (nextTarget as HTMLElement)?.focus(), 0);
  };

  return (
    <li className="flex items-center gap-2 py-1">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2" title={log.name}>{log.name}</p>
        <p className="text-sm tabular-nums text-muted">
          {log.servings !== 1 && `${log.servings} × · `}{Math.round(log.kcal)} kcal · {Math.round(log.protein_g)} g protein
        </p>
      </div>
      {/* An entry still being saved has no server id yet, so it cannot be deleted for a moment. */}
      <button type="button" className="btn px-0 text-muted" aria-label={`Delete ${log.name}`} disabled={isPending(log)} onClick={handleDelete}>✕</button>
    </li>
  );
}

import type { ReactNode } from 'react';

/** Says what will appear here and how to add the first entry. */
export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-bg px-4 py-4">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** For a query that failed: the message plus a way to try again. */
export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-bg px-4 py-4 space-y-2">
      <p className="font-medium text-danger">Couldn&apos;t load this</p>
      <p className="text-sm text-muted">Check your connection or try again in a moment.</p>
      {error.message && <p className="text-xs text-muted/70 break-all">{error.message}</p>}
      <div className="pt-1">
        <button type="button" className="btn text-sm" onClick={onRetry}>Try again</button>
      </div>
    </div>
  );
}

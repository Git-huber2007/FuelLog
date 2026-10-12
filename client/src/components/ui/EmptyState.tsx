import type { ReactNode } from 'react';

/** Says what will appear here and how to add the first entry. */
export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** For a query that failed: the message plus a way to try again. */
export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return <EmptyState title="Could not load this" hint={error.message} action={<button className="btn" onClick={onRetry}>Try again</button>} />;
}

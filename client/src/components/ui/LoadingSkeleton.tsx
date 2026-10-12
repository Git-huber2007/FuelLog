export function LoadingSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-line" />
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

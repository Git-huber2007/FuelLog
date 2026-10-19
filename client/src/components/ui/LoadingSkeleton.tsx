interface Props {
  cards?: number;
  variant?: 'default' | 'hero' | 'bare';
}

export function LoadingSkeleton({ cards = 3, variant = 'default' }: Props) {
  if (variant === 'hero') {
    return (
      <div role="status" aria-label="Loading" className="space-y-5">
        <div className="board h-[12.5rem] rounded-2xl animate-pulse" />
        <div className="card grid grid-cols-2 gap-x-5 gap-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-line/60 animate-pulse" />
              <div className="h-2 w-full rounded-full bg-line/40 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'bare') {
    return (
      <div role="status" aria-label="Loading" className="space-y-3">
        <div className="h-4 w-1/3 rounded bg-line/50 animate-pulse" />
        <div className="h-4 w-full rounded bg-line/40 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-line/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="card space-y-3">
          <div className="h-4 w-1/3 rounded bg-line/50 animate-pulse" />
          <div className="h-4 w-full rounded bg-line/40 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-line/30 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

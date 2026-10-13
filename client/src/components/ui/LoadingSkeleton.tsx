interface Props {
  cards?: number;
  variant?: 'default' | 'hero' | 'bare';
}

export function LoadingSkeleton({ cards = 3, variant = 'default' }: Props) {
  if (variant === 'hero') {
    return (
      <div role="status" aria-label="Loading" className="bezel">
        <div className="card space-y-4 rounded-[1.75rem]">
          <div className="flex flex-col min-[360px]:flex-row items-center gap-5">
            <div className="h-32 w-32 shrink-0 sm:h-36 sm:w-36 rounded-full border-8 border-line/40 bg-line/10 animate-pulse" />
            <div className="min-w-0 flex-1 w-full space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-1/4 rounded bg-line/40 animate-pulse" />
                  <div className="h-2 w-full rounded-full bg-line/20 overflow-hidden">
                    <div className="h-full rounded-full bg-line/40 animate-pulse" style={{ width: `${70 - i * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="tile px-3 py-2.5 h-14 bg-line/10">
                <div className="h-3 w-1/2 rounded bg-line/40 animate-pulse mb-1.5" />
                <div className="h-4 w-3/4 rounded bg-line/60 animate-pulse" />
              </div>
            ))}
          </div>
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

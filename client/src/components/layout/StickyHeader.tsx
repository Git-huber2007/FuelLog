import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DateSwitcher } from './DateSwitcher';

const TITLES: Record<string, string> = { '/': 'Today', '/workout': 'Workout', '/progress': 'Progress', '/profile': 'Profile' };

/** A floating glass bar, set in from the edges, that stays in view while the page scrolls. */
export function StickyHeader() {
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = TITLES[pathname] ?? 'FuelLog';

  useEffect(() => {
    document.title = `${title} · FuelLog`;
    headingRef.current?.focus();
  }, [pathname, title]);

  const dated = pathname === '/' || pathname === '/workout';
  return (
    <header className="sticky top-0 z-20 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-6">
      <div className="glass flex min-h-[56px] items-center justify-between gap-1.5 rounded-full py-1.5 pl-3.5 pr-1 md:pl-5 md:pr-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="min-w-0 truncate text-base outline-none sm:text-lg">{title}</h1>
        {dated ? <DateSwitcher /> : <span className="pr-4 text-sm font-semibold text-accent">FuelLog</span>}
      </div>
    </header>
  );
}

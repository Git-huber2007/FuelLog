import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DateSwitcher } from './DateSwitcher';

const TITLES: Record<string, string> = { '/': 'Today', '/workout': 'Workout', '/progress': 'Progress', '/profile': 'Profile' };

/** A floating glass bar, set in from the edges, that stays in view while the page scrolls. */
export function StickyHeader() {
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);
  const title = TITLES[pathname] ?? 'FuelLog';

  useEffect(() => {
    document.title = `${title} · FuelLog`;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [pathname, title]);

  const dated = pathname === '/' || pathname === '/workout';
  return (
    <header className="sticky top-0 z-20 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-6">
      {/* On dated pages the date is what people read; the page name is on the tab bar, so the heading is kept for screen readers only. */}
      <div className={`glass flex min-h-[56px] items-center justify-between gap-1.5 rounded-full py-1.5 ${dated ? 'px-1.5' : 'pl-5 pr-1.5'}`}>
        <h1 ref={headingRef} tabIndex={-1} className={dated ? 'sr-only' : 'min-w-0 truncate text-lg outline-none'}>{title}</h1>
        {dated ? <DateSwitcher /> : <span className="pr-4 text-sm font-semibold text-accent">FuelLog</span>}
      </div>
    </header>
  );
}

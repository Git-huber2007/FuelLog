import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DateSwitcher } from './DateSwitcher';

const TITLES: Record<string, string> = {
  '/': 'Today',
  '/workout': 'Workout',
  '/routine': 'Weekly Routine',
  '/progress': 'Progress',
  '/profile': 'Profile',
};

/** The scoreboard band at the top: flush on a phone, inset on wider screens, in view while the page scrolls. */
export function StickyHeader() {
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);
  const title = pathname.startsWith('/exercise/') ? 'Exercise History' : (TITLES[pathname] ?? 'FuelLog');

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
    <header className="sticky top-0 z-20 md:px-6 md:pt-3">
      {/* On dated pages the date is what people read; the page name is on the tab bar, so the heading is kept for screen readers only. */}
      <div className={`board flex min-h-[56px] items-center justify-between gap-1.5 border-x-0 border-t-0 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] md:rounded-md md:border md:pt-1.5 [&_.icon-btn:hover]:bg-on-board/10 [&_.icon-btn:hover]:text-on-board [&_.icon-btn]:text-board-muted ${dated ? 'px-1.5' : 'px-4'}`}>
        <h1 ref={headingRef} tabIndex={-1} className={dated ? 'sr-only' : 'cond min-w-0 truncate text-xl font-extrabold uppercase tracking-[0.02em] outline-none'}>{title}</h1>
        {dated && <DateSwitcher />}
      </div>
    </header>
  );
}

import { useLocation } from 'react-router-dom';
import { DateSwitcher } from './DateSwitcher';

const TITLES: Record<string, string> = { '/': 'Today', '/workout': 'Workout', '/progress': 'Progress', '/profile': 'Profile' };

export function StickyHeader() {
  const { pathname } = useLocation();
  const dated = pathname === '/' || pathname === '/workout';
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 px-4 backdrop-blur-md pb-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(0.5rem+env(safe-area-inset-top))]">
      <div className="flex min-h-[44px] items-center justify-between gap-2">
        <h1 className="text-lg">{TITLES[pathname] ?? 'FuelLog'}</h1>
        {dated && <DateSwitcher />}
      </div>
    </header>
  );
}

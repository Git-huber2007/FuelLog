import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Today', dated: true, icon: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2' },
  { to: '/workout', label: 'Workout', dated: true, icon: 'M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10' },
  { to: '/progress', label: 'Progress', dated: false, icon: 'M4 19V5M4 19h16M8 15l3-4 3 2 4-6' },
  { to: '/profile', label: 'Profile', dated: false, icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
];

/** The main navigation as a scoreboard band: flush along the bottom on phones and tablets, a vertical rail on the left on large screens. */
export function BottomTabBar() {
  const { pathname, search } = useLocation();
  // Today and Workout share the selected date, so switching between them keeps it.
  const keepDate = pathname === '/' || pathname === '/workout' ? search : '';
  return (
    <nav aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 lg:inset-x-auto lg:inset-y-0 lg:left-[max(0px,calc(50vw-560px))]">
      <ul className="board flex gap-1 border-x-0 border-b-0 p-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] lg:h-full lg:flex-col lg:border-y-0 lg:border-l-0 lg:p-2">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1 lg:flex-none">
            <NavLink
              to={{ pathname: tab.to, search: tab.dated ? keepDate : '' }}
              end
              className={({ isActive }) =>
                `flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-sm px-3 text-xs font-bold uppercase tracking-[0.04em] [font-stretch:75%] transition-[background-color,color,transform] duration-200 ease-spring active:scale-[0.96] lg:min-h-[64px] lg:w-16 ${
                  isActive ? 'bg-on-board/10 text-digit' : 'text-board-muted hover:text-on-board'
                }`}
            >
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={tab.icon} />
              </svg>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

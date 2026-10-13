import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Today', dated: true, icon: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2' },
  { to: '/workout', label: 'Workout', dated: true, icon: 'M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10' },
  { to: '/progress', label: 'Progress', dated: false, icon: 'M4 19V5M4 19h16M8 15l3-4 3 2 4-6' },
  { to: '/profile', label: 'Profile', dated: false, icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
];

/** The main navigation as a floating glass pill: along the bottom on phones and tablets, a vertical rail on the left on large screens. */
export function BottomTabBar() {
  const { pathname, search } = useLocation();
  // Today and Workout share the selected date, so switching between them keeps it.
  const keepDate = pathname === '/' || pathname === '/workout' ? search : '';
  return (
    <nav aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-auto lg:left-[max(1rem,calc(50vw-560px+0.75rem))] lg:top-1/2 lg:-translate-y-1/2 lg:p-0">
      <ul className="glass mx-auto flex max-w-[26rem] gap-1 rounded-full p-1.5 lg:flex-col lg:rounded-[2rem]">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={{ pathname: tab.to, search: tab.dated ? keepDate : '' }}
              end
              className={({ isActive }) =>
                `flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-full px-3 text-[0.6875rem] transition-[background-color,color,transform] duration-300 ease-spring active:scale-[0.96] lg:min-h-[64px] lg:w-16 lg:rounded-[1.5rem] ${
                  isActive ? 'bg-text/[0.09] font-semibold text-text' : 'text-muted hover:text-text'
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

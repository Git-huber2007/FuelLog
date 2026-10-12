import { NavLink, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Today', dated: true, icon: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2' },
  { to: '/workout', label: 'Workout', dated: true, icon: 'M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10' },
  { to: '/progress', label: 'Progress', dated: false, icon: 'M4 19V5M4 19h16M8 15l3-4 3 2 4-6' },
  { to: '/profile', label: 'Profile', dated: false, icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0' },
];

export function BottomTabBar() {
  const { pathname, search } = useLocation();
  // Today and Workout share the selected date, so switching between them keeps it.
  const keepDate = pathname === '/' || pathname === '/workout' ? search : '';
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[520px]">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={{ pathname: tab.to, search: tab.dated ? keepDate : '' }}
              end
              className={({ isActive }) => `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs ${isActive ? 'font-semibold text-accent' : 'text-muted'}`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { StickyHeader } from './StickyHeader';

/**
 * One column on a phone, two packed columns from tablet width, with the navigation as a floating pill:
 * along the bottom on small screens, down the left edge on large ones.
 */
export function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col lg:pl-24">
      <StickyHeader />
      {/* key: each page plays its entrance once, on arrival */}
      <main key={pathname} className="stagger flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:columns-2 md:gap-5 md:px-6 lg:pb-10 [&>*]:mb-5">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}

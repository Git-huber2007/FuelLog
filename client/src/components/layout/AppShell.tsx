import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { StickyHeader } from './StickyHeader';

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col">
      <StickyHeader />
      <main className="flex-1 space-y-4 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}

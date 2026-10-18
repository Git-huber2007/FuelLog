import { Suspense, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getSlowRequestCount, subscribeSlowRequests } from '../../lib/apiClient';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { BottomTabBar } from './BottomTabBar';
import { StickyHeader } from './StickyHeader';

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * One column on a phone, two packed columns from tablet width, with the navigation as a scoreboard band:
 * along the bottom on small screens, down the left edge on large ones.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const slowCount = useSyncExternalStore(subscribeSlowRequests, getSlowRequestCount, () => 0);
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, () => true);

  const statusText = !isOnline
    ? 'You are offline. Changes will not be saved until you reconnect.'
    : slowCount > 0
      ? 'Waking the server. The first load can take up to a minute.'
      : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col lg:pl-24">
      {statusText && (
        <div
          role="status"
          className="border-b border-line bg-card px-4 py-2 text-center text-xs font-medium text-muted"
        >
          {statusText}
        </div>
      )}
      <StickyHeader />
      {/* key: each page plays its entrance once, on arrival */}
      <main key={pathname} className="stagger flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:px-6 lg:pb-10">
        <Suspense fallback={<LoadingSkeleton cards={3} />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomTabBar />
    </div>
  );
}


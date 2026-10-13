import { Navigate, Outlet } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { ErrorState } from '../ui/EmptyState';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

/** The app stays locked to onboarding until the profile is complete. */
export function OnboardedRoute() {
  const profile = useProfile();
  if (profile.isPending) return <div className="mx-auto max-w-[1120px] p-4 md:px-6"><LoadingSkeleton /></div>;
  if (profile.isError) return <div className="mx-auto max-w-[1120px] p-4 md:px-6"><ErrorState error={profile.error} onRetry={() => profile.refetch()} /></div>;
  return profile.data.profile.onboarded ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

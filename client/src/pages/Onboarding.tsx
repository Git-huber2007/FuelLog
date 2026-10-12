import { Navigate, useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useProfile } from '../hooks/useProfile';

export default function Onboarding() {
  const navigate = useNavigate();
  const profile = useProfile();
  if (profile.data?.profile.onboarded) return <Navigate to="/" replace />;
  return (
    <main className="mx-auto w-full max-w-[520px] space-y-4 px-4 py-8">
      <div>
        <p className="text-sm font-semibold text-accent">FuelLog</p>
        <h1 className="text-2xl">Set up your targets</h1>
        <p className="mt-1 text-muted">Five details are all it takes. Your targets update as you type and re-tune weekly from your weight.</p>
      </div>
      {profile.isPending && <LoadingSkeleton cards={1} />}
      {profile.isError && <ErrorState error={profile.error} onRetry={() => profile.refetch()} />}
      {profile.data && (
        <div className="card">
          <ProfileForm profile={profile.data.profile} submitLabel="Save and start logging" onSaved={() => navigate('/', { replace: true })} />
        </div>
      )}
    </main>
  );
}

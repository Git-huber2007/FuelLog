import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useProfile } from '../hooks/useProfile';
import { useSession, useSignOut } from '../hooks/useSession';

export default function Onboarding() {
  const navigate = useNavigate();
  const profile = useProfile();
  const { session } = useSession();
  const signOut = useSignOut();

  useEffect(() => {
    document.title = 'Onboarding · FuelLog';
  }, []);
  if (profile.data?.profile.onboarded) return <Navigate to="/" replace />;
  return (
    <main className="stagger mx-auto w-full max-w-[560px] space-y-5 px-4 py-10">
      <div>
        <p className="eyebrow">Set up</p>
        <h1 className="mt-4 text-4xl">Set up your targets</h1>
        <p className="mt-3 text-lg text-muted">Pick your training level first and we suggest a weekly program. Then five details set your targets, which re-tune weekly from your weight.</p>
      </div>
      {profile.isPending && <LoadingSkeleton cards={1} />}
      {profile.isError && <ErrorState error={profile.error} onRetry={() => profile.refetch()} />}
      {profile.data && (
        <div className="card">
          <ProfileForm profile={profile.data.profile} submitLabel="Save and start logging" onSaved={() => navigate('/', { replace: true })} />
        </div>
      )}
      <p className="text-center text-sm text-muted">
        Signed in as <span className="break-all">{session?.user.email}</span>.{' '}
        <button type="button" className="link inline-flex min-h-[44px] items-center" onClick={signOut}>Sign out</button>
      </p>
    </main>
  );
}

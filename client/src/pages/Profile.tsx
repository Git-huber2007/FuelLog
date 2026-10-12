import { useQueryClient } from '@tanstack/react-query';
import { ProfileForm } from '../components/profile/ProfileForm';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const qc = useQueryClient();
  const { session } = useSession();
  const profile = useProfile().data!.profile; // OnboardedRoute only renders this page once the profile has loaded

  async function signOut() {
    await supabase.auth.signOut();
    qc.clear(); // nothing from this account stays cached for the next person on this device
  }

  return (
    <>
      <section className="card" aria-label="Edit profile">
        <ProfileForm profile={profile} submitLabel="Save changes" />
      </section>
      <p className="px-1 text-sm text-muted">Estimates only, not medical advice. Calorie targets never go below 1500 kcal.</p>
      <section className="card space-y-3" aria-label="Account">
        <p className="break-all text-sm text-muted">Signed in as {session?.user.email}</p>
        <button type="button" className="btn w-full" onClick={signOut}>Sign out</button>
      </section>
    </>
  );
}

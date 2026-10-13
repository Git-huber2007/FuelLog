import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ExportButton } from '../components/progress/ExportButton';
import { useToast } from '../components/ui/Toast';
import { useProfile } from '../hooks/useProfile';
import { useSession, useSignOut } from '../hooks/useSession';
import { api } from '../lib/apiClient';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { session } = useSession();
  const profile = useProfile().data!.profile; // OnboardedRoute only renders this page once the profile has loaded
  const signOut = useSignOut();
  const navigate = useNavigate();
  const toast = useToast();

  const currentName = ((session?.user.user_metadata?.name ?? session?.user.user_metadata?.full_name ?? '') as string) || '';
  const [userName, setUserName] = useState(currentName);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setUserName(currentName);
  }, [currentName]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = userName.trim();
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: trimmed },
    });
    setSavingName(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast(trimmed ? 'Name updated.' : 'Name cleared.');
    }
  }

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleChangePassword() {
    if (!session?.user.email) return;
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Password reset link sent to your email.');
    }
  }

  function openDeleteDialog() {
    setConfirmText('');
    dialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    dialogRef.current?.close();
  }

  async function handleDeleteAccount() {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api('/account', { method: 'DELETE' });
      closeDeleteDialog();
      await signOut();
      navigate('/welcome');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account.';
      toast(message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5 items-start space-y-5 md:space-y-0">
        <div className="space-y-5">
          <section className="card" aria-label="Edit profile">
            <ProfileForm profile={profile} submitLabel="Save changes" />
          </section>
          <p className="px-1 text-sm text-muted">Estimates only, not medical advice. Calorie targets never go below 1500 kcal.</p>
        </div>

        <div className="space-y-5">
          <section className="card space-y-4" aria-label="Account">
            <h2 className="card-title">Account</h2>
            <div className="space-y-0.5">
              {currentName && (
                <p className="text-base font-semibold text-foreground">{currentName}</p>
              )}
              <p className="break-all text-sm text-muted">Signed in as {session?.user.email}</p>
            </div>

            <form onSubmit={handleSaveName} className="space-y-2 pt-1 border-t border-line">
              <label htmlFor="user-display-name" className="block text-xs font-medium text-muted">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  id="user-display-name"
                  type="text"
                  maxLength={50}
                  className="input flex-1"
                  placeholder="e.g. Alex"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0"
                  disabled={savingName || userName.trim() === currentName.trim()}
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-1 border-t border-line">
              <button
                type="button"
                className="btn w-full"
                disabled={sendingReset}
                onClick={handleChangePassword}
              >
                {sendingReset ? 'Sending reset link…' : 'Change password'}
              </button>
              <button type="button" className="btn w-full" onClick={signOut}>
                Sign out
              </button>
              <button
                type="button"
                className="btn w-full text-danger border-danger/20 hover:border-danger/40"
                onClick={openDeleteDialog}
              >
                Delete account
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted">
              <Link to="/privacy" className="link text-xs">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms" className="link text-xs">Terms of Service</Link>
            </div>
          </section>
        </div>
      </div>

      {/* Native dialog for account deletion */}
      <dialog
        ref={dialogRef}
        className="backdrop:bg-black/60 rounded-2xl bg-card p-6 text-foreground shadow-2xl border border-line max-w-md w-full m-auto"
        onClose={() => setConfirmText('')}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-danger">Delete Account</h3>
          <p className="text-sm text-muted">
            This action is permanent and cannot be undone. All your health data will be removed forever, including:
          </p>
          <ul className="list-disc list-inside text-xs text-muted space-y-1">
            <li>Your profile and onboarding settings</li>
            <li>All logged foods, custom foods, and saved meals</li>
            <li>All weight records, measurements, and daily checks</li>
            <li>All workout logs and cardio sets</li>
            <li>All stored progress photos and AI usage history</li>
          </ul>

          <div className="rounded-xl border border-line p-3 space-y-2 bg-background/50">
            <p className="text-xs font-semibold">Download your data first:</p>
            <ExportButton />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-delete" className="block text-xs font-medium text-muted">
              Type <strong className="text-foreground">DELETE</strong> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              className="input w-full"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn flex-1"
              disabled={deleting}
              onClick={closeDeleteDialog}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger flex-1"
              disabled={confirmText !== 'DELETE' || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

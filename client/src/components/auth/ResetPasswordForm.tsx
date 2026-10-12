import { Credentials } from '@fuellog/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { CredentialFields } from './CredentialFields';

/**
 * Two steps on one route. Signed out: ask for the email and send the link.
 * The link signs the user in and returns here, where a session means "choose the new password".
 */
export function ResetPasswordForm() {
  const { session } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function requestLink(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.shape.email.safeParse(email);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    const result = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    setSent(true);
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.shape.password.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    const result = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    toast('Password updated.');
    navigate('/', { replace: true });
  }

  if (session) {
    return (
      <form onSubmit={savePassword} noValidate className="space-y-4">
        <CredentialFields password={{ value: password, onChange: setPassword, error, isNew: true }} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
      </form>
    );
  }
  if (sent) return <p role="status">If {email} has an account, a reset link is on its way. Open it on this device.</p>;
  return (
    <form onSubmit={requestLink} noValidate className="space-y-4">
      <CredentialFields email={{ value: email, onChange: setEmail, error }} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a reset link'}</button>
    </form>
  );
}

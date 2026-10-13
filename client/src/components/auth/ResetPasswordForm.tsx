import { Credentials } from '@fuellog/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/Toast';
import { CredentialFields } from './CredentialFields';

/**
 * Two steps on one route.
 * Request link: asks for email and sends reset email.
 * Password recovery: shown only upon PASSWORD_RECOVERY event; revokes other sessions on completion.
 */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function requestLink(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.shape.email.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setBusy(true);
    const result = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    setSent(true);
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.shape.password.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setBusy(true);
    const result = await supabase.auth.updateUser({ password: parsed.data });
    if (result.error) {
      setBusy(false);
      return setError(result.error.message);
    }
    await supabase.auth.signOut({ scope: 'others' });
    setBusy(false);
    toast('Password updated.');
    navigate('/', { replace: true });
  }

  if (isRecovery) {
    return (
      <form ref={formRef} onSubmit={savePassword} noValidate className="space-y-4">
        <CredentialFields password={{ value: password, onChange: setPassword, error, isNew: true }} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
      </form>
    );
  }

  if (sent) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-card p-6 space-y-3">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted">If <strong className="text-text">{email}</strong> has an account, a reset link is on its way.</p>
        <p className="text-xs text-muted">Open it on this device to choose a new password.</p>
      </div>
    );
  }
  return (
    <form ref={formRef} onSubmit={requestLink} noValidate className="space-y-4">
      <CredentialFields email={{ value: email, onChange: setEmail, error }} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a reset link'}</button>
    </form>
  );
}

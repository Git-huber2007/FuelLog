import { Credentials } from '@fuellog/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CredentialFields } from './CredentialFields';

export function SignupForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      return setErrors({ email: f.email?.[0], password: f.password?.[0] });
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setErrors({ form: error.message });
    // No session means the project requires email confirmation first.
    if (data.session) navigate('/onboarding', { replace: true });
    else setConfirmSent(true);
  }

  if (confirmSent) {
    return <p role="status">Check {email} for a confirmation link. Open it on this device and you will land in FuelLog.</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <CredentialFields email={{ value: email, onChange: setEmail, error: errors.email }} password={{ value: password, onChange: setPassword, error: errors.password, isNew: true }} />
      {errors.form && <p role="alert" className="field-error">{errors.form}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}

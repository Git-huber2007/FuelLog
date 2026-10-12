import { Credentials } from '@fuellog/shared';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CredentialFields } from './CredentialFields';

export function LoginForm() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = Credentials.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return setErrors({ form: error.message });
    navigate('/', { replace: true });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
      <CredentialFields email={{ value: email, onChange: setEmail, error: errors.email }} password={{ value: password, onChange: setPassword, error: errors.password }} />
      {errors.form && <p role="alert" className="field-error">{errors.form}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}

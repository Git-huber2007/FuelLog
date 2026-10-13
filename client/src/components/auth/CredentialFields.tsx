import { useId } from 'react';

interface Props {
  email?: { value: string; onChange: (v: string) => void; error?: string };
  password?: { value: string; onChange: (v: string) => void; error?: string; isNew?: boolean };
}

/** Email and password inputs with labels and inline errors, shared by the three auth forms. */
export function CredentialFields({ email, password }: Props) {
  const id = useId();
  return (
    <>
      {email && (
        <div>
          <label htmlFor={`${id}-email`} className="label">Email</label>
          <input
            id={`${id}-email`}
            name="email"
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email.value}
            onChange={(e) => email.onChange(e.target.value)}
            aria-invalid={!!email.error}
            aria-describedby={email.error ? `${id}-email-error` : undefined}
          />
          {email.error && <p id={`${id}-email-error`} role="alert" className="field-error">{email.error}</p>}
        </div>
      )}
      {password && (
        <div>
          <label htmlFor={`${id}-password`} className="label">{password.isNew ? 'New password (8 characters or more)' : 'Password'}</label>
          <input
            id={`${id}-password`}
            name="password"
            className="input"
            type="password"
            required
            minLength={8}
            autoComplete={password.isNew ? 'new-password' : 'current-password'}
            value={password.value}
            onChange={(e) => password.onChange(e.target.value)}
            aria-invalid={!!password.error}
            aria-describedby={password.error ? `${id}-password-error` : undefined}
          />
          {password.error && <p id={`${id}-password-error`} role="alert" className="field-error">{password.error}</p>}
        </div>
      )}
    </>
  );
}

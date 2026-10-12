import { Link } from 'react-router-dom';
import { AuthPage, authLink } from '../components/auth/AuthPage';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useSession } from '../hooks/useSession';

export default function ResetPassword() {
  const { session, loading } = useSession();
  return (
    <AuthPage title={session ? 'Choose a new password' : 'Reset your password'}
      footer={session ? <Link to="/" className={authLink}>Back to FuelLog</Link> : <Link to="/login" className={authLink}>Back to sign in</Link>}>
      {loading ? <LoadingSkeleton cards={1} /> : <ResetPasswordForm />}
    </AuthPage>
  );
}

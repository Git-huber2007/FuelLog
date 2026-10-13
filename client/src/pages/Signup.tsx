import { Link, Navigate } from 'react-router-dom';
import { AuthPage, authLink } from '../components/auth/AuthPage';
import { SignupForm } from '../components/auth/SignupForm';
import { useSession } from '../hooks/useSession';

export default function Signup() {
  const { session } = useSession();
  if (session) return <Navigate to="/" replace />;
  return (
    <AuthPage
      title="Create your account"
      footer={
        <div className="space-y-2">
          <p>Already have one? <Link to="/login" className={authLink}>Sign in</Link></p>
          <p className="text-xs text-muted">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </div>
      }
    >
      <SignupForm />
    </AuthPage>
  );
}

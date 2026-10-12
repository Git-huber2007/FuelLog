import { Link, Navigate } from 'react-router-dom';
import { AuthPage, authLink } from '../components/auth/AuthPage';
import { SignupForm } from '../components/auth/SignupForm';
import { useSession } from '../hooks/useSession';

export default function Signup() {
  const { session } = useSession();
  if (session) return <Navigate to="/" replace />;
  return (
    <AuthPage title="Create your account" footer={<p>Already have one? <Link to="/login" className={authLink}>Sign in</Link></p>}>
      <SignupForm />
    </AuthPage>
  );
}

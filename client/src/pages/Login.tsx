import { Link, Navigate } from 'react-router-dom';
import { AuthPage, authLink } from '../components/auth/AuthPage';
import { LoginForm } from '../components/auth/LoginForm';
import { useSession } from '../hooks/useSession';

export default function Login() {
  const { session } = useSession();
  if (session) return <Navigate to="/" replace />;
  return (
    <AuthPage title="Sign in" footer={
      <>
        <p>New here? <Link to="/signup" className={authLink}>Create an account</Link></p>
        <p><Link to="/reset-password" className={authLink}>Forgot your password?</Link></p>
      </>
    }>
      <LoginForm />
    </AuthPage>
  );
}

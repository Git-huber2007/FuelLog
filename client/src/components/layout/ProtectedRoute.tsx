import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

/** Signed-in users only; everyone else sees the landing page. */
export function ProtectedRoute() {
  const { session, loading } = useSession();
  if (loading) return <div className="mx-auto max-w-[520px] p-4"><LoadingSkeleton /></div>;
  return session ? <Outlet /> : <Navigate to="/welcome" replace />;
}

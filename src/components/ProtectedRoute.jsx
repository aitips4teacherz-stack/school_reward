import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-screen">Loading classroom...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (profile?.locked) return <div className="center-screen">This account is locked. Ask your teacher for help.</div>;

  return <Outlet />;
}

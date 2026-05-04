import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, profile, loading, authError, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-screen">Loading classroom...</div>;
  if (authError) {
    return (
      <div className="center-screen error-screen">
        <div>
          <h1>Classroom could not load</h1>
          <p>{authError}</p>
          <button className="primary-button" onClick={signOut}>Back to login</button>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!profile && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  if (profile?.locked) return <div className="center-screen">This account is locked. Ask your teacher for help.</div>;

  return <Outlet />;
}

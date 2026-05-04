import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function HomeRedirect() {
  const { profile } = useAuth();

  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  if (profile?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile?.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/onboarding" replace />;
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CB</span>
          <div>
            <strong>Class Battles</strong>
            <small>{profile?.role ?? 'player'}</small>
          </div>
        </div>
        <nav>
          <NavLink to="/student">Cards</NavLink>
          <NavLink to="/deck">Deck</NavLink>
          <NavLink to="/battle">Battle</NavLink>
          <NavLink to="/leaderboard">Leaderboard</NavLink>
          {['teacher', 'admin'].includes(profile?.role) && <NavLink to="/teacher">Teacher</NavLink>}
        </nav>
        <button className="ghost-button" onClick={handleSignOut}>Sign out</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { bootstrapAdmin, signInWithUsername } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

const roleLabels = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
};

export default function LoginPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bootstrapping, setBootstrapping] = useState(false);

  if (loading) return <div className="center-screen">Loading classroom...</div>;
  if (user && profile) return <Navigate to="/" replace />;
  if (user && !profile) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <h1>Session needs reset</h1>
          <p className="muted">This browser is signed into an account without a classroom profile.</p>
          <button className="primary-button" onClick={signOut}>Back to login</button>
        </section>
      </main>
    );
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (role === 'admin' && form.username.trim().toLowerCase() === 'admin') {
        await bootstrapAdmin();
      }
      await signInWithUsername(form.username, form.password);
    } catch {
      if (role === 'admin' && form.username.trim().toLowerCase() === 'admin') {
        try {
          await bootstrapAdmin();
          await signInWithUsername(form.username, form.password);
          return;
        } catch {
          setError('Admin setup could not complete. Check Netlify has SUPABASE_SERVICE_ROLE_KEY set, then redeploy.');
          return;
        }
      }
      setError('That username and password did not work.');
    }
  }

  async function setupAdmin() {
    setBootstrapping(true);
    setError('');
    setMessage('');
    try {
      const result = await bootstrapAdmin();
      setMessage(result.created ? 'Admin account created. Sign in with admin / LDBBadmin1007~.' : 'Admin account already exists. Sign in with admin / LDBBadmin1007~.');
      setRole('admin');
      setForm({ username: 'admin', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBootstrapping(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand big"><span className="brand-mark">CB</span><strong>Class Card Battles</strong></div>
        <h1>{roleLabels[role]} login</h1>

        <div className="segmented login-tabs">
          {Object.keys(roleLabels).map((key) => (
            <button key={key} className={role === key ? 'active' : ''} onClick={() => setRole(key)}>
              {roleLabels[key]}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          <label>
            Username
            <input
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="primary-button" type="submit">Sign in</button>
        </form>

        {role === 'admin' && (
          <button className="ghost-button full-width" type="button" onClick={setupAdmin} disabled={bootstrapping}>
            {bootstrapping ? 'Setting up admin...' : 'Set up first admin'}
          </button>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

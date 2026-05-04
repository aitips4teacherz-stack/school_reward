import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithMagicLink } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await signInWithMagicLink(email);
      setMessage('Check your email for the magic link.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand big"><span className="brand-mark">CB</span><strong>Class Card Battles</strong></div>
        <h1>Classroom card battles from student art</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <button className="primary-button" type="submit">Send magic link</button>
        </form>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AvatarPicker from '../components/AvatarPicker.jsx';
import { upsertProfile } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function OnboardingPage() {
  const { user, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', avatar: 'Astra', class_id: '', pin: '' });
  const [error, setError] = useState('');

  if (!user) return <Navigate to="/login" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await upsertProfile({
        id: user.id,
        name: form.name.trim(),
        role: 'student',
        avatar: form.avatar,
        class_id: form.class_id || null,
        pin: form.pin || null,
        locked: false,
      });
      await loadProfile(user.id);
      navigate('/student');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card wide">
        <h1>Create your player profile</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Display name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Class ID
            <input value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value })} placeholder="Teacher-provided UUID" />
          </label>
          <label>
            Optional PIN
            <input value={form.pin} onChange={(event) => setForm({ ...form, pin: event.target.value })} />
          </label>
          <AvatarPicker value={form.avatar} onChange={(avatar) => setForm({ ...form, avatar })} />
          <button className="primary-button" type="submit">Enter classroom</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

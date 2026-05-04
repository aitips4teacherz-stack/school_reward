import { useEffect, useState } from 'react';
import { accountAction, listTeachers } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', className: '', classCode: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    refreshTeachers();
  }, []);

  if (profile?.role !== 'admin') {
    return <div className="empty-state">Admin access is required.</div>;
  }

  async function refreshTeachers() {
    const rows = await listTeachers();
    setTeachers(rows);
  }

  async function createTeacher(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const result = await accountAction('create-teacher', form);
      setNotice(`Teacher created. Username: ${result.username}. Class code: ${result.classCode}. Temporary password: ${result.temporaryPassword}`);
      setForm({ name: '', username: '', password: '', className: '', classCode: '' });
      await refreshTeachers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(teacher) {
    setError('');
    setNotice('');
    try {
      const result = await accountAction('reset-teacher-password', { teacherId: teacher.id });
      setNotice(`${teacher.name}'s temporary password: ${result.temporaryPassword}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTeacher(teacher) {
    setError('');
    setNotice('');
    try {
      await accountAction('delete-teacher', { teacherId: teacher.id });
      setNotice(`${teacher.name} was deleted.`);
      await refreshTeachers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Teacher accounts</h1>
        </div>
      </header>

      <section className="panel">
        <h2>Create teacher</h2>
        <form className="account-form" onSubmit={createTeacher}>
          <label>
            Teacher name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            Teacher username
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          </label>
          <label>
            Temporary password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Auto-generate if blank" />
          </label>
          <label>
            Classroom name
            <input value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} placeholder="Room 7 Art" />
          </label>
          <label>
            Classroom code
            <input value={form.classCode} onChange={(event) => setForm({ ...form, classCode: event.target.value.toUpperCase() })} placeholder="Optional" />
          </label>
          <button className="primary-button" type="submit">Create teacher</button>
        </form>
        {notice && <p className="success">{notice}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="table-panel">
        <h2>Teachers</h2>
        {teachers.map((teacher) => {
          const classRow = teacher.classes?.[0];
          return (
            <div className="student-row" key={teacher.id}>
              <div>
                <strong>{teacher.name}</strong>
                <span>Username {teacher.username ?? 'unset'} · {classRow?.name ?? 'No class'} · Code {classRow?.code ?? 'unset'}</span>
              </div>
              <div className="row-actions">
                <button onClick={() => resetPassword(teacher)}>Reset password</button>
                <button onClick={() => deleteTeacher(teacher)}>Delete</button>
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}

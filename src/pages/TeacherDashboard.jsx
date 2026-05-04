import { useEffect, useMemo, useState } from 'react';
import CardCreator from '../components/CardCreator.jsx';
import { accountAction, getMyClass, giveCoins, listClassStudents, listDrawings } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [activeMenu, setActiveMenu] = useState('class');
  const [students, setStudents] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [studentForm, setStudentForm] = useState({ name: '', username: '', password: '', avatar: 'Astra' });
  const [editing, setEditing] = useState(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const selectedDrawing = useMemo(
    () => drawings.find((drawing) => drawing.id === selectedDrawingId),
    [drawings, selectedDrawingId],
  );

  useEffect(() => {
    refreshAll();
  }, []);

  if (!['teacher', 'admin'].includes(profile?.role)) {
    return <div className="empty-state">Teacher access is required.</div>;
  }

  async function refreshAll() {
    const [studentRows, drawingRows, classRow] = await Promise.all([
      listClassStudents(),
      listDrawings(),
      getMyClass(profile.class_id),
    ]);
    setStudents(studentRows);
    setDrawings(drawingRows);
    setClassroom(classRow);
    setSelectedDrawingId((current) => current || drawingRows[0]?.id || '');
  }

  async function createStudent(event) {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      const result = await accountAction('create-student', studentForm);
      setNotice(`Student created. Username: ${result.username}. Password: ${result.pin}`);
      setStudentForm({ name: '', username: '', password: '', avatar: 'Astra' });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveStudent(student) {
    setNotice('');
    setError('');
    try {
      await accountAction('update-student', {
        studentId: student.id,
        name: editing.name,
        avatar: editing.avatar,
        locked: editing.locked,
      });
      setEditing(null);
      setNotice(`${editing.name} was updated.`);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPin(student) {
    setNotice('');
    setError('');
    try {
      const result = await accountAction('reset-student-pin', { studentId: student.id });
      setNotice(`${student.name}'s new password: ${result.pin}`);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteStudent(student) {
    setNotice('');
    setError('');
    try {
      await accountAction('delete-student', { studentId: student.id });
      setNotice(`${student.name} was deleted.`);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function awardCoins(student, amount) {
    const currentStats = student.game_stats?.[0] ?? { coins: 0 };
    const stats = await giveCoins(student.id, currentStats.coins, amount);
    setStudents((rows) =>
      rows.map((row) => (row.id === student.id ? { ...row, game_stats: [stats] } : row)),
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Teacher Dashboard</p>
          <h1>{activeMenu === 'class' ? 'Class setup' : 'Card maker'}</h1>
        </div>
        <div className="metric-row">
          <span>Class code <b>{classroom?.code ?? 'unset'}</b></span>
        </div>
      </header>

      <div className="teacher-menu">
        <button className={activeMenu === 'class' ? 'active' : ''} onClick={() => setActiveMenu('class')}>Class setup</button>
        <button className={activeMenu === 'cards' ? 'active' : ''} onClick={() => setActiveMenu('cards')}>Card maker</button>
      </div>

      {activeMenu === 'class' && (
        <>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Class setup</h2>
                <p className="muted">Create student logins, manage accounts, reset passwords, and maintain your classroom roster.</p>
              </div>
            </div>
            <form className="account-form" onSubmit={createStudent}>
              <label>
                Student name
                <input value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} required />
              </label>
              <label>
                Student username
                <input value={studentForm.username} onChange={(event) => setStudentForm({ ...studentForm, username: event.target.value })} required />
              </label>
              <label>
                6 digit password
                <input
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={studentForm.password}
                  onChange={(event) => setStudentForm({ ...studentForm, password: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Auto-generate if blank"
                />
              </label>
              <label>
                Avatar
                <input value={studentForm.avatar} onChange={(event) => setStudentForm({ ...studentForm, avatar: event.target.value })} />
              </label>
              <button className="primary-button" type="submit">Create student</button>
            </form>
            {notice && <p className="success">{notice}</p>}
            {error && <p className="error">{error}</p>}
          </section>

          <section className="table-panel">
            <h2>Students</h2>
            {students.map((student) => {
              const stats = student.game_stats?.[0] ?? {};
              const isEditing = editing?.id === student.id;
              return (
                <div className="student-row" key={student.id}>
                  <div>
                    {isEditing ? (
                      <div className="inline-edit">
                        <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                        <input value={editing.avatar ?? ''} onChange={(event) => setEditing({ ...editing, avatar: event.target.value })} />
                        <label className="check-row">
                          <input type="checkbox" checked={editing.locked} onChange={(event) => setEditing({ ...editing, locked: event.target.checked })} />
                          Locked
                        </label>
                      </div>
                    ) : (
                      <>
                        <strong>{student.name}</strong>
                        <span>Username {student.username ?? 'unset'} · {stats.coins ?? 0} coins · {stats.wins ?? 0} wins · Password {student.pin ?? 'unset'} · {student.locked ? 'locked' : 'active'}</span>
                      </>
                    )}
                  </div>
                  <div className="row-actions">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveStudent(student)}>Save</button>
                        <button onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditing({ id: student.id, name: student.name, avatar: student.avatar, locked: student.locked })}>Edit</button>
                        <button onClick={() => resetPin(student)}>Reset password</button>
                        <button onClick={() => awardCoins(student, 10)}>+10 coins</button>
                        <button onClick={() => deleteStudent(student)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}

      {activeMenu === 'cards' && (
        <section className="arena-maker-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Ancient Card Forge</p>
              <h2>Create card from drawing</h2>
            </div>
            <select value={selectedDrawingId} onChange={(event) => setSelectedDrawingId(event.target.value)}>
              {drawings.map((drawing) => (
                <option key={drawing.id} value={drawing.id}>
                  {drawing.profiles?.name ?? 'Student'} · {new Date(drawing.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <CardCreator drawing={selectedDrawing} onCreated={refreshAll} />
        </section>
      )}
    </section>
  );
}

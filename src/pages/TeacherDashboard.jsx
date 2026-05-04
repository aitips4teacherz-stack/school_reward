import { useEffect, useMemo, useState } from 'react';
import CardCreator from '../components/CardCreator.jsx';
import { giveCoins, listClassStudents, listDrawings, updateStudent } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState('');
  const selectedDrawing = useMemo(
    () => drawings.find((drawing) => drawing.id === selectedDrawingId),
    [drawings, selectedDrawingId],
  );

  useEffect(() => {
    async function load() {
      const [studentRows, drawingRows] = await Promise.all([listClassStudents(), listDrawings()]);
      setStudents(studentRows);
      setDrawings(drawingRows);
      setSelectedDrawingId(drawingRows[0]?.id ?? '');
    }
    load();
  }, []);

  if (!['teacher', 'admin'].includes(profile?.role)) {
    return <div className="empty-state">Teacher access is required.</div>;
  }

  async function resetPin(student) {
    const nextPin = Math.floor(1000 + Math.random() * 9000).toString();
    const updated = await updateStudent(student.id, { pin: nextPin });
    setStudents((rows) => rows.map((row) => (row.id === student.id ? { ...row, ...updated } : row)));
  }

  async function toggleLocked(student) {
    const updated = await updateStudent(student.id, { locked: !student.locked });
    setStudents((rows) => rows.map((row) => (row.id === student.id ? { ...row, ...updated } : row)));
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
          <h1>Manage students and cards</h1>
        </div>
      </header>

      <section className="table-panel">
        <h2>Students</h2>
        {students.map((student) => {
          const stats = student.game_stats?.[0] ?? {};
          return (
            <div className="student-row" key={student.id}>
              <div>
                <strong>{student.name}</strong>
                <span>{stats.coins ?? 0} coins · {stats.wins ?? 0} wins · PIN {student.pin ?? 'unset'}</span>
              </div>
              <div className="row-actions">
                <button onClick={() => resetPin(student)}>Reset PIN</button>
                <button onClick={() => awardCoins(student, 10)}>+10 coins</button>
                <button onClick={() => toggleLocked(student)}>{student.locked ? 'Unlock' : 'Lock'}</button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Create card from drawing</h2>
            <p className="muted">Crop the art, choose rarity and color, then generated stats are saved with the card.</p>
          </div>
          <select value={selectedDrawingId} onChange={(event) => setSelectedDrawingId(event.target.value)}>
            {drawings.map((drawing) => (
              <option key={drawing.id} value={drawing.id}>
                {drawing.profiles?.name ?? 'Student'} · {new Date(drawing.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
        <CardCreator drawing={selectedDrawing} />
      </section>
    </section>
  );
}

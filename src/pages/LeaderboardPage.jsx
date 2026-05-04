import { useEffect, useMemo, useState } from 'react';
import { listClassStudents } from '../lib/api';

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [sortBy, setSortBy] = useState('wins');

  useEffect(() => {
    listClassStudents().then(setStudents);
  }, []);

  const ranked = useMemo(() => {
    return [...students].sort((a, b) => (b.game_stats?.[0]?.[sortBy] ?? 0) - (a.game_stats?.[0]?.[sortBy] ?? 0));
  }, [students, sortBy]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h1>Class rankings</h1>
        </div>
        <div className="segmented">
          <button className={sortBy === 'wins' ? 'active' : ''} onClick={() => setSortBy('wins')}>Wins</button>
          <button className={sortBy === 'coins' ? 'active' : ''} onClick={() => setSortBy('coins')}>Coins</button>
        </div>
      </header>
      <div className="table-panel">
        {ranked.map((student, index) => {
          const stats = student.game_stats?.[0] ?? {};
          return (
            <div key={student.id} className={`leader-row rank-${index + 1}`}>
              <span className="rank">{index + 1}</span>
              <strong>{student.name}</strong>
              <span>{stats.wins ?? 0} wins</span>
              <span>{stats.coins ?? 0} coins</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

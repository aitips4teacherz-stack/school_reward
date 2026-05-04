import { useEffect, useState } from 'react';
import CardGrid from '../components/CardGrid.jsx';
import DrawingUploader from '../components/DrawingUploader.jsx';
import { getStats, listCards, listDrawings } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [cardRows, drawingRows, statRow] = await Promise.all([
        listCards(user.id),
        listDrawings(user.id),
        getStats(user.id),
      ]);
      setCards(cardRows);
      setDrawings(drawingRows);
      setStats(statRow);
    }
    load();
  }, [user.id]);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1>{profile.name}'s collection</h1>
        </div>
        <div className="metric-row">
          <span>Wins <b>{stats?.wins ?? 0}</b></span>
          <span>Coins <b>{stats?.coins ?? 0}</b></span>
        </div>
      </header>

      <section className="two-column">
        <DrawingUploader userId={user.id} onUploaded={(drawing) => setDrawings((rows) => [drawing, ...rows])} />
        <div className="panel">
          <h2>Uploaded drawings</h2>
          <div className="drawing-strip">
            {drawings.map((drawing) => <img key={drawing.id} src={drawing.image_url} alt="Student drawing" />)}
            {!drawings.length && <p className="muted">Your teacher can turn uploaded drawings into cards.</p>}
          </div>
        </div>
      </section>

      <section>
        <h2>Your cards</h2>
        <CardGrid cards={cards} emptyText="No cards yet. Upload a drawing and ask your teacher to create one." />
      </section>
    </section>
  );
}

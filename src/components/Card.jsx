export default function Card({ card, selected, onClick, compact = false }) {
  return (
    <button
      type="button"
      className={`card-tile ${card.rarity.toLowerCase()} ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      onClick={onClick}
    >
      <img src={card.image_url} alt={card.name} />
      <div className="card-body">
        <div className="card-title-row">
          <strong>{card.name}</strong>
          <span className={`chip ${card.color.toLowerCase()}`}>{card.color}</span>
        </div>
        <span className="rarity">{card.rarity}</span>
        <div className="stat-grid">
          <span>ATK <b>{card.attack}</b></span>
          <span>DEF <b>{card.defense}</b></span>
          <span>SPD <b>{card.speed}</b></span>
        </div>
      </div>
    </button>
  );
}

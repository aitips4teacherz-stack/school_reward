import Card from './Card.jsx';

export default function CardGrid({ cards, selectedIds = [], onCardClick, emptyText = 'No cards yet.' }) {
  if (!cards.length) return <div className="empty-state">{emptyText}</div>;

  return (
    <div className="card-grid">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          selected={selectedIds.includes(card.id)}
          onClick={() => onCardClick?.(card)}
        />
      ))}
    </div>
  );
}

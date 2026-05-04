import { useEffect, useMemo, useState } from 'react';
import CardGrid from '../components/CardGrid.jsx';
import { getDeck, listCards, saveDeck } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';

export default function DeckBuilderPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState('');
  const selectedCards = useMemo(() => cards.filter((card) => selectedIds.includes(card.id)), [cards, selectedIds]);

  useEffect(() => {
    async function load() {
      const [cardRows, deck] = await Promise.all([listCards(user.id), getDeck(user.id)]);
      setCards(cardRows);
      setSelectedIds(deck?.cards ?? []);
    }
    load();
  }, [user.id]);

  function toggleCard(card) {
    setMessage('');
    if (selectedIds.includes(card.id)) {
      setSelectedIds((ids) => ids.filter((id) => id !== card.id));
      return;
    }
    if (selectedIds.length >= 5) {
      setMessage('Decks can hold 5 cards.');
      return;
    }
    setSelectedIds((ids) => [...ids, card.id]);
  }

  async function handleSave() {
    await saveDeck(user.id, selectedCards);
    setMessage('Deck saved.');
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Deck Builder</p>
          <h1>Choose up to 5 cards</h1>
        </div>
        <button className="primary-button" onClick={handleSave}>Save deck</button>
      </header>
      <div className="deck-status">
        <span>{selectedIds.length}/5 selected</span>
        {message && <strong>{message}</strong>}
      </div>
      <CardGrid cards={cards} selectedIds={selectedIds} onCardClick={toggleCard} emptyText="Create cards before building a deck." />
    </section>
  );
}

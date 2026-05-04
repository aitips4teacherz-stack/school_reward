import { useEffect, useMemo, useState } from 'react';
import Card from '../components/Card.jsx';
import { applyBattleResult, listCards, listDeckCards } from '../lib/api';
import { useAuth } from '../lib/AuthContext.jsx';
import { calculateDamage } from '../utils/stats';

export default function BattlePage() {
  const { user } = useAuth();
  const [deck, setDeck] = useState([]);
  const [enemyDeck, setEnemyDeck] = useState([]);
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [log, setLog] = useState(['Choose a card to start the battle.']);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      const deckCards = await listDeckCards(user.id);
      const allCards = await listCards(user.id);
      setDeck(deckCards);
      setEnemyDeck(deckCards.length ? shuffle(deckCards) : shuffle(allCards).slice(0, 5));
    }
    load();
  }, [user.id]);

  const canPlay = useMemo(() => deck.length > 0 && enemyDeck.length > 0 && !finished, [deck, enemyDeck, finished]);

  async function playTurn(playerCard) {
    if (!canPlay) return;
    const enemyCard = enemyDeck[Math.floor(Math.random() * enemyDeck.length)];
    const playerDamage = calculateDamage(playerCard, enemyCard);
    const enemyDamage = calculateDamage(enemyCard, playerCard);
    const nextEnemyHp = Math.max(0, enemyHp - playerDamage);
    const nextPlayerHp = Math.max(0, playerHp - enemyDamage);

    setEnemyHp(nextEnemyHp);
    setPlayerHp(nextPlayerHp);
    setLog((items) => [
      `${playerCard.name} dealt ${playerDamage}. ${enemyCard.name} dealt ${enemyDamage}.`,
      ...items,
    ]);

    if (nextEnemyHp <= 0 || nextPlayerHp <= 0) {
      const result = nextEnemyHp <= 0 ? 'win' : 'loss';
      setFinished(true);
      setLog((items) => [`Battle ${result === 'win' ? 'won' : 'lost'}!`, ...items]);
      await applyBattleResult(result);
    }
  }

  function resetBattle() {
    setPlayerHp(100);
    setEnemyHp(100);
    setFinished(false);
    setEnemyDeck(shuffle(enemyDeck));
    setLog(['Choose a card to start the battle.']);
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Battle</p>
          <h1>Turn-based arena</h1>
        </div>
        <button className="ghost-button" onClick={resetBattle}>Reset</button>
      </header>

      <div className="battle-board">
        <HpPanel title="Player" hp={playerHp} />
        <div className="versus">VS</div>
        <HpPanel title="Enemy" hp={enemyHp} />
      </div>

      {!deck.length && <div className="empty-state">Save a deck before battling.</div>}
      <div className="battle-grid">
        <section>
          <h2>Your deck</h2>
          <div className="hand-grid">
            {deck.map((card) => <Card key={card.id} card={card} compact onClick={() => playTurn(card)} />)}
          </div>
        </section>
        <section className="panel">
          <h2>Battle log</h2>
          <ul className="battle-log">
            {log.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          </ul>
        </section>
      </div>
    </section>
  );
}

function HpPanel({ title, hp }) {
  return (
    <div className="hp-panel">
      <strong>{title}</strong>
      <div className="hp-bar"><span style={{ width: `${hp}%` }} /></div>
      <b>{hp} HP</b>
    </div>
  );
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

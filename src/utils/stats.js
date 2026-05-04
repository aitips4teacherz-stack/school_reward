const rarityBonus = {
  Common: 0,
  Rare: 10,
  Epic: 20,
  Legendary: 30,
};

export function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function generateStats({ name, color, rarity }) {
  const keywordName = name.toLowerCase();
  const base = 35 + (rarityBonus[rarity] ?? 0);
  const stats = {
    attack: base,
    defense: base,
    speed: base,
  };

  if (color === 'Red') stats.attack += 15;
  if (color === 'Blue') stats.defense += 15;
  if (color === 'Green') stats.speed += 15;

  if (keywordName.includes('dragon')) stats.attack += 15;
  if (keywordName.includes('rock')) stats.defense += 15;
  if (keywordName.includes('speed')) stats.speed += 15;

  return {
    attack: clampStat(stats.attack),
    defense: clampStat(stats.defense),
    speed: clampStat(stats.speed),
  };
}

export function calculateDamage(attacker, defender) {
  const speedBonus = attacker.speed > defender.speed ? 10 : 0;
  return Math.max(5, Math.round(attacker.attack - defender.defense * 0.5 + speedBonus));
}

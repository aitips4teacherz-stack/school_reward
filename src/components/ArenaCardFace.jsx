const glyphs = ['𓂀', '𓆣', '𓃭', '𓊹', '𓇳', '𓁹', '𓋹', '𓅓'];

export default function ArenaCardFace({ card, imageUrl, tiltStyle, compact = false }) {
  const previewCard = {
    name: card?.name || 'Unnamed Champion',
    image_url: imageUrl || card?.image_url,
    rarity: card?.rarity || 'Common',
    color: card?.color || 'Red',
    attack: card?.attack ?? 35,
    defense: card?.defense ?? 35,
    speed: card?.speed ?? 35,
  };

  return (
    <div
      className={`classcard ${previewCard.rarity.toLowerCase()} ${previewCard.color.toLowerCase()} ${compact ? 'compact' : ''}`}
      style={tiltStyle}
    >
      <div className="holo" />
      <div className="sheen" />
      <div className="glare" />
      <div className="classcard-glyphs top">{glyphs.map((glyph) => <span key={`top-${glyph}`}>{glyph}</span>)}</div>
      <div className="classcard-orb">VS</div>
      <div className="classcard-art">
        {previewCard.image_url ? <img src={previewCard.image_url} alt={previewCard.name} /> : <span>𓃭</span>}
      </div>
      <div className="classcard-info">
        <p>{previewCard.rarity} · {previewCard.color}</p>
        <h3>{previewCard.name}</h3>
        <div className="classcard-stats">
          <span><b>⚔</b>{previewCard.attack}</span>
          <span><b>⬟</b>{previewCard.defense}</span>
          <span><b>ϟ</b>{previewCard.speed}</span>
        </div>
      </div>
      <div className="classcard-glyphs bottom">{glyphs.slice().reverse().map((glyph) => <span key={`bottom-${glyph}`}>{glyph}</span>)}</div>
    </div>
  );
}

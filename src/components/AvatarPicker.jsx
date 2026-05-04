const avatars = ['Astra', 'Bolt', 'Moss', 'Nova', 'Pixel', 'Rune', 'Scout', 'Sunny'];

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="avatar-grid">
      {avatars.map((avatar) => (
        <button
          type="button"
          key={avatar}
          className={`avatar-button ${value === avatar ? 'selected' : ''}`}
          onClick={() => onChange(avatar)}
          aria-label={`Choose ${avatar}`}
        >
          <span>{avatar.slice(0, 1)}</span>
          <small>{avatar}</small>
        </button>
      ))}
    </div>
  );
}

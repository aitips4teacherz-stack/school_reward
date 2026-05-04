import { useState } from 'react';
import ArenaCardFace from './ArenaCardFace.jsx';

export default function Card({ card, selected, onClick, compact = false }) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = ((y / rect.height) - 0.5) * -12;
    setTilt({ rotateX, rotateY, glareX: (x / rect.width) * 100, glareY: (y / rect.height) * 100 });
  }

  function resetTilt() {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  }

  return (
    <button
      type="button"
      className={`classcard-button ${selected ? 'selected' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
    >
      <ArenaCardFace
        card={card}
        compact={compact}
        tiltStyle={{
          '--rx': `${tilt.rotateX}deg`,
          '--ry': `${tilt.rotateY}deg`,
          '--gx': `${tilt.glareX}%`,
          '--gy': `${tilt.glareY}%`,
        }}
      />
    </button>
  );
}

import { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import { createCard, uploadImage } from '../lib/api';
import { dataUrlToBlob } from '../utils/files';
import { generateStats } from '../utils/stats';

const colors = ['Red', 'Blue', 'Green'];
const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];
const glyphs = ['𓂀', '𓆣', '𓃭', '𓊹', '𓇳', '𓁹', '𓋹', '𓅓'];

export default function CardCreator({ drawing, onCreated }) {
  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const [form, setForm] = useState({ name: '', color: 'Red', rarity: 'Common' });
  const stats = generateStats(form);

  useEffect(() => {
    if (!imageRef.current || !drawing) return undefined;
    cropperRef.current?.destroy();
    cropperRef.current = new Cropper(imageRef.current, {
      aspectRatio: 4 / 5,
      viewMode: 1,
      autoCropArea: 0.9,
      background: false,
      checkCrossOrigin: true,
    });
    return () => cropperRef.current?.destroy();
  }, [drawing]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!drawing || !form.name.trim()) return;
    const canvas = cropperRef.current.getCroppedCanvas({ width: 640, height: 800 });
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await dataUrlToBlob(dataUrl);
    const path = `${drawing.user_id}/card-${crypto.randomUUID()}.png`;
    const imageUrl = await uploadImage('cards', path, blob);
    const card = await createCard({
      user_id: drawing.user_id,
      name: form.name.trim(),
      image_url: imageUrl,
      color: form.color,
      rarity: form.rarity,
      ...stats,
    });
    setForm({ name: '', color: 'Red', rarity: 'Common' });
    onCreated?.(card);
  }

  if (!drawing) return <div className="empty-state">Select a drawing to create a card.</div>;

  return (
    <form className="arena-creator-grid" onSubmit={handleSubmit}>
      <div className="forge-workbench">
        <div className="forge-title">
          <span>𓊹</span>
          <strong>Crop the relic art</strong>
          <span>𓊹</span>
        </div>
        <div className="crop-panel arena-crop-panel">
          <img ref={imageRef} src={drawing.image_url} alt="Selected student drawing" crossOrigin="anonymous" />
        </div>
      </div>

      <div className="arena-card-preview-wrap">
        <div className={`arena-card-preview ${form.rarity.toLowerCase()} ${form.color.toLowerCase()}`}>
          <div className="glyph-rail top">{glyphs.map((glyph) => <span key={`top-${glyph}`}>{glyph}</span>)}</div>
          <div className="card-orb">VS</div>
          <div className="preview-art-frame">
            <img src={drawing.image_url} alt="Card preview art" />
          </div>
          <div className="preview-card-body">
            <p>{form.rarity} {form.color}</p>
            <h3>{form.name || 'Unnamed Champion'}</h3>
            <div className="sigil-stats">
              <span><b>⚔</b>{stats.attack}</span>
              <span><b>⬟</b>{stats.defense}</span>
              <span><b>ϟ</b>{stats.speed}</span>
            </div>
          </div>
          <div className="glyph-rail bottom">{glyphs.slice().reverse().map((glyph) => <span key={`bottom-${glyph}`}>{glyph}</span>)}</div>
        </div>
      </div>

      <div className="forge-controls">
        <div className="forge-control-header">
          <span>𓇳</span>
          <strong>Card maker</strong>
          <span>𓇳</span>
        </div>
        <label>
          Card name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <div className="forge-field-row">
          <label>
            Color
            <select value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })}>
              {colors.map((color) => <option key={color}>{color}</option>)}
            </select>
          </label>
          <label>
            Rarity
            <select value={form.rarity} onChange={(event) => setForm({ ...form, rarity: event.target.value })}>
              {rarities.map((rarity) => <option key={rarity}>{rarity}</option>)}
            </select>
          </label>
        </div>
        <div className="preview-stats arena-stats">
          <span>Attack <b>{stats.attack}</b></span>
          <span>Defense <b>{stats.defense}</b></span>
          <span>Speed <b>{stats.speed}</b></span>
        </div>
        <button className="primary-button forge-button" type="submit">Create card</button>
      </div>
    </form>
  );
}

import { useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import { createCard, uploadImage } from '../lib/api';
import { dataUrlToBlob } from '../utils/files';
import { generateStats } from '../utils/stats';

const colors = ['Red', 'Blue', 'Green'];
const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];

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
    <form className="creator-grid" onSubmit={handleSubmit}>
      <div className="crop-panel">
        <img ref={imageRef} src={drawing.image_url} alt="Selected student drawing" crossOrigin="anonymous" />
      </div>
      <div className="form-panel">
        <label>
          Card name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
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
        <div className="preview-stats">
          <span>Attack <b>{stats.attack}</b></span>
          <span>Defense <b>{stats.defense}</b></span>
          <span>Speed <b>{stats.speed}</b></span>
        </div>
        <button className="primary-button" type="submit">Create card</button>
      </div>
    </form>
  );
}

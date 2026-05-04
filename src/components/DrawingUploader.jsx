import { saveDrawing, uploadImage } from '../lib/api';
import { uniqueStoragePath } from '../utils/files';

export default function DrawingUploader({ userId, onUploaded }) {
  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const path = uniqueStoragePath(userId, file, 'drawing-');
    const imageUrl = await uploadImage('drawings', path, file);
    const drawing = await saveDrawing(userId, imageUrl);
    onUploaded?.(drawing);
    event.target.value = '';
  }

  return (
    <label className="upload-zone">
      <input type="file" accept="image/*" onChange={handleUpload} />
      <strong>Upload drawing</strong>
      <span>PNG, JPG, or classroom tablet export</span>
    </label>
  );
}

export function fileExtension(file) {
  return file.name.split('.').pop()?.toLowerCase() || 'png';
}

export function uniqueStoragePath(userId, file, prefix = '') {
  const extension = fileExtension(file);
  return `${userId}/${prefix}${crypto.randomUUID()}.${extension}`;
}

export async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

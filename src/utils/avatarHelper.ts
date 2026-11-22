/**
 * Compress and center-crop a customer profile picture from gallery or camera
 * into a crisp 256x256 JPEG data URL under ~45 KB for fast profile sync.
 */
export async function compressAvatarFile(file: File): Promise<string> {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode selected image.'));
    image.src = dataUrl;
  });

  const targetSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return dataUrl;
  }

  const minSide = Math.min(img.width, img.height);
  const sx = Math.max(0, Math.round((img.width - minSide) / 2));
  const sy = Math.max(0, Math.round((img.height - minSide) / 2));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

  return canvas.toDataURL('image/jpeg', 0.8);
}

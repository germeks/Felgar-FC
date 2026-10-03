/**
 * Image compression utility to safely store user-uploaded photos in Firestore.
 * Firestore document limits: 1,048,576 bytes (1 MiB).
 * This utility resizes high-resolution images (phone camera photos, wallpapers)
 * and compresses them to JPEG to ensure they stay well under 600 KB without visible loss.
 */

export interface CompressImageOptions {
  /**
   * Maximum width or height in pixels (defaults to 1280 for chronicle/match/gallery photos, 800 for avatars).
   */
  maxDimension?: number;
  /**
   * Initial JPEG compression quality (0.0 to 1.0, defaults to 0.8).
   */
  quality?: number;
  /**
   * Target maximum data URL string length in bytes (defaults to 600 KB = 614,400 bytes).
   */
  maxSizeBytes?: number;
}

export async function compressImage(
  source: File | Blob | string,
  options: CompressImageOptions = {}
): Promise<string> {
  const {
    maxDimension = 1280,
    quality = 0.8,
    maxSizeBytes = 600 * 1024,
  } = options;

  // SSR or non-browser fallback
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return typeof source === 'string' ? source : '';
  }

  // If it's a remote URL (e.g. unsplash, cloud storage, external CDN), leave untouched
  if (typeof source === 'string' && !source.startsWith('data:')) {
    return source;
  }

  // Convert File / Blob to Data URL if needed
  let dataUrl: string;
  if (typeof source === 'string') {
    dataUrl = source;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    });
  }

  // If it's already a very lightweight data URL under 250KB and already jpeg/webp, return quickly
  if (dataUrl.length <= 250 * 1024 && (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/webp'))) {
    return dataUrl;
  }

  // Load into HTMLImageElement
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
    image.src = dataUrl;
  });

  let curWidth = img.naturalWidth || img.width;
  let curHeight = img.naturalHeight || img.height;

  if (!curWidth || !curHeight) {
    return dataUrl;
  }

  // Proportional resize if larger than maxDimension
  if (curWidth > maxDimension || curHeight > maxDimension) {
    if (curWidth > curHeight) {
      curHeight = Math.round((curHeight * maxDimension) / curWidth);
      curWidth = maxDimension;
    } else {
      curWidth = Math.round((curWidth * maxDimension) / curHeight);
      curHeight = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = curWidth;
  canvas.height = curHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return dataUrl;
  }

  // Fill white background in case source had transparent PNG background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, curWidth, curHeight);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, curWidth, curHeight);

  let currentQuality = quality;
  let output = canvas.toDataURL('image/jpeg', currentQuality);

  // Iteratively reduce quality or scale down if still exceeds max size
  let attempts = 0;
  while (output.length > maxSizeBytes && attempts < 5) {
    attempts++;
    currentQuality = Math.max(0.4, currentQuality - 0.15);
    if (attempts >= 2) {
      curWidth = Math.round(curWidth * 0.85);
      curHeight = Math.round(curHeight * 0.85);
      canvas.width = curWidth;
      canvas.height = curHeight;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, curWidth, curHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, curWidth, curHeight);
    }
    output = canvas.toDataURL('image/jpeg', currentQuality);
  }

  return output;
}

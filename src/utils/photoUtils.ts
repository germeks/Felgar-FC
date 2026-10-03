import React from 'react';

export interface PhotoFraming {
  posX: number; // 0 to 100 (%)
  posY: number; // 0 to 100 (%)
  zoom: number; // 0.5 to 2.5 (permite alejar para ver cabeza y pecho completos)
}

export const parsePhotoPosition = (posStr?: string): { x: number; y: number } => {
  if (!posStr) return { x: 50, y: 20 }; // Default 50% horizontal, 20% vertical (face focus)

  const clean = posStr.trim().toLowerCase();
  if (clean === 'top' || clean === 'center top') return { x: 50, y: 10 };
  if (clean === 'center' || clean === 'center center') return { x: 50, y: 50 };
  if (clean === 'bottom' || clean === 'center bottom') return { x: 50, y: 90 };

  const matches = clean.match(/([\d.]+)%?\s+([\d.]+)%?/);
  if (matches) {
    const x = Math.min(100, Math.max(0, parseFloat(matches[1])));
    const y = Math.min(100, Math.max(0, parseFloat(matches[2])));
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 20 : y };
  }

  return { x: 50, y: 20 };
};

export const formatPhotoPosition = (x: number, y: number): string => {
  const cleanX = Math.min(100, Math.max(0, Math.round(x)));
  const cleanY = Math.min(100, Math.max(0, Math.round(y)));
  return `${cleanX}% ${cleanY}%`;
};

export const getPlayerPhotoStyle = (
  player?: { photoPosition?: string; photoZoom?: number } | null,
  fallbackPosition: string = '50% 10%'
): React.CSSProperties => {
  const position = player?.photoPosition || fallbackPosition;
  // El zoom debe ser >= 1.0 para mantener el relleno completo (cover) y evitar bandas vacías
  const zoom = player?.photoZoom && player.photoZoom > 1.0 ? player.photoZoom : 1.0;

  return {
    objectPosition: position,
    transform: zoom > 1.02 ? `scale(${zoom})` : undefined,
    transformOrigin: position,
  };
};

export { compressImage } from './imageCompression';
export type { CompressImageOptions } from './imageCompression';

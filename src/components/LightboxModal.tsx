import React, { useEffect } from 'react';
import { PhotoItem } from '../types';
import { X, Calendar, ChevronLeft, ChevronRight, Tag, Download } from 'lucide-react';

interface LightboxModalProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + photos.length) % photos.length);
      }
      if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 sm:p-6">
      {/* Top action bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/30">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
            {currentPhoto.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            download={`${currentPhoto.title}.jpg`}
            className="p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-850 transition-colors"
            title="Abrir imagen original"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev button */}
      {photos.length > 1 && (
        <button
          onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition-all cursor-pointer"
          title="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center">
        <div className="relative max-h-[70vh] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title}
            referrerPolicy="no-referrer"
            className="max-h-[70vh] w-auto object-contain"
          />
        </div>

        {/* Photo Details Overlay */}
        <div className="w-full max-w-2xl mt-4 bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 text-center space-y-1.5 shadow-xl">
          <h3 className="font-display font-bold text-lg text-white">
            {currentPhoto.title}
          </h3>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(currentPhoto.date)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              {currentPhoto.category}
            </span>
          </div>
          {currentPhoto.description && (
            <p className="text-xs text-slate-300 max-w-xl mx-auto pt-1">
              {currentPhoto.description}
            </p>
          )}
        </div>
      </div>

      {/* Next button */}
      {photos.length > 1 && (
        <button
          onClick={() => onNavigate((currentIndex + 1) % photos.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition-all cursor-pointer"
          title="Siguiente foto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

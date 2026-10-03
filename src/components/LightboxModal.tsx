import React, { useEffect, useState, useRef } from 'react';
import { PhotoItem } from '../types';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Tag,
  Download,
  Edit2,
  Trash2,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
} from 'lucide-react';

interface LightboxModalProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onEdit?: (photo: PhotoItem) => void;
  onDelete?: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  // Zoom & Pan state
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);

  useEffect(() => {
    setConfirmDelete(false);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [currentIndex, isOpen]);

  const activePhoto = photos[currentIndex] || photos[0];

  useEffect(() => {
    if (!activePhoto?.url) return;
    const testImg = new Image();
    testImg.src = activePhoto.url;
    if (testImg.complete && testImg.naturalWidth && testImg.naturalHeight) {
      setIsVertical(testImg.naturalHeight > testImg.naturalWidth);
    } else {
      testImg.onload = () => {
        setIsVertical(testImg.naturalHeight > testImg.naturalWidth);
      };
    }
  }, [activePhoto?.url]);

  // Wheel zoom in fullscreen
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomScale((prev) => {
        const next = Math.max(1, Math.min(4, Math.round((prev + delta) * 100) / 100));
        if (next <= 1) {
          setPanPosition({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  const handleToggleZoom = () => {
    if (zoomScale > 1) {
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      setZoomScale(2);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next <= 1) {
        setPanPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panPosition };
    dragMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
    }
    const stage = stageRef.current;
    const stageW = stage ? stage.clientWidth : 900;
    const stageH = stage ? stage.clientHeight : 600;
    const maxPanX = Math.max(120, (stageW * (zoomScale - 1)) / 1.4);
    const maxPanY = Math.max(120, (stageH * (zoomScale - 1)) / 1.4);

    const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
    setPanPosition({ x: nextX, y: nextY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...panPosition };
    dragMovedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
    }
    const stage = stageRef.current;
    const stageW = stage ? stage.clientWidth : 900;
    const stageH = stage ? stage.clientHeight : 600;
    const maxPanX = Math.max(120, (stageW * (zoomScale - 1)) / 1.4);
    const maxPanY = Math.max(120, (stageH * (zoomScale - 1)) / 1.4);

    const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
    setPanPosition({ x: nextX, y: nextY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleResetZoom();
    } else {
      setZoomScale(2);
      setPanPosition({ x: 0, y: 0 });
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/95 backdrop-blur-md p-4 sm:p-6">
      {/* Top action bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 text-blue-600 border border-blue-200 shadow-xs">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 text-slate-700 border border-slate-200 shadow-xs">
            {currentPhoto.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(currentPhoto)}
              className="p-2 rounded-xl bg-white/80 text-blue-600 hover:text-blue-700 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
              title="Editar publicación"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl px-2 py-1 shadow-xs">
                <span className="text-xs font-semibold text-red-700">¿Eliminar?</span>
                <button
                  onClick={() => {
                    onDelete(currentPhoto.id);
                    setConfirmDelete(false);
                  }}
                  className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg cursor-pointer"
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl bg-white/80 text-red-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                title="Eliminar foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )
          )}

          {/* Zoom toggle button */}
          <button
            onClick={handleToggleZoom}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              zoomScale > 1
                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50'
                : 'bg-white/80 text-slate-700 hover:text-blue-600 hover:bg-white border-slate-200'
            }`}
            title={
              zoomScale > 1
                ? `Zoom activo (${Math.round(zoomScale * 100)}%): pulsa para restablecer o arrastra para mover la foto`
                : 'Ampliar detalle con lupa y arrastrar para mover la foto'
            }
          >
            {zoomScale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Fine zoom adjustment controls */}
          {zoomScale > 1 && (
            <div className="flex items-center gap-0.5 bg-white/95 border border-blue-400/40 rounded-xl px-1.5 py-1 shadow-sm backdrop-blur-xs">
              <button
                onClick={handleZoomOut}
                disabled={zoomScale <= 1.25}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Alejar zoom (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold text-blue-700 px-1 select-none">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Acercar zoom (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                title="Restablecer tamaño original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <a
            href={currentPhoto.url}
            target="_blank"
            rel="noopener noreferrer"
            download={`${currentPhoto.title}.jpg`}
            className="p-2 rounded-xl bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
            title="Abrir imagen original"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/80 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-slate-100 text-slate-900 border border-slate-300/80 transition-all cursor-pointer"
          title="Foto anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Main Image Container */}
      <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center justify-center">
        {/* Floating guidance pill when zoomed in */}
        {zoomScale > 1 && (
          <div className="absolute top-2 z-30 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-blue-400/40 text-white text-xs shadow-2xl backdrop-blur-md pointer-events-auto">
              <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="font-medium text-slate-100">
                Arrastra la imagen para moverla libremente
              </span>
              <span className="bg-blue-600/80 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleResetZoom}
                className="ml-1 text-[11px] text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer font-semibold"
              >
                Restablecer
              </button>
            </div>
          </div>
        )}

        <div
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative ${
            isVertical ? 'max-h-[82vh] h-[82vh]' : 'max-h-[74vh]'
          } rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex items-center justify-center select-none transition-all duration-300 w-full`}
          style={{
            cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        >
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title}
            referrerPolicy="no-referrer"
            draggable={false}
            onDoubleClick={handleDoubleClick}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight && img.naturalWidth) {
                setIsVertical(img.naturalHeight > img.naturalWidth);
              }
            }}
            style={{
              transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className={`${
              isVertical ? 'max-h-[82vh] h-full' : 'max-h-[74vh]'
            } w-auto object-contain select-none drop-shadow-2xl ${
              zoomScale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
            onClick={() => {
              if (!dragMovedRef.current) {
                handleToggleZoom();
              }
            }}
          />
        </div>

        {/* Photo Details Overlay */}
        <div className="w-full max-w-2xl mt-2.5 bg-white/95 border border-slate-200/80 rounded-xl px-4 py-2 text-center space-y-1 shadow-xl backdrop-blur-xs">
          <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 line-clamp-1">
            {currentPhoto.title}
          </h3>
          <div className="flex items-center justify-center gap-2.5 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Calendar className="w-3 h-3" />
              {formatDate(currentPhoto.date)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Tag className="w-3 h-3" />
              {currentPhoto.category}
            </span>
            {isVertical && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-600 font-bold">
                  <Smartphone className="w-3 h-3" />
                  Foto Vertical
                </span>
              </>
            )}
          </div>
          {currentPhoto.description && (
            <p className="text-xs text-slate-600 max-w-xl mx-auto line-clamp-1">
              {currentPhoto.description}
            </p>
          )}
        </div>
      </div>

      {/* Next button */}
      {photos.length > 1 && (
        <button
          onClick={() => onNavigate((currentIndex + 1) % photos.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/80 hover:bg-slate-100 text-slate-900 border border-slate-300/80 transition-all cursor-pointer"
          title="Siguiente foto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

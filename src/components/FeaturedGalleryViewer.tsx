import React, { useRef, useEffect, useState } from 'react';
import { PhotoItem } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  Tag,
  Play,
  Pause,
  Edit2,
  Trash2,
  Smartphone,
  Scan,
  Info,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface FeaturedGalleryViewerProps {
  photos: PhotoItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenFullscreen: (index: number) => void;
  onEdit?: (photo: PhotoItem) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
  formatDate: (date: string) => string;
  compact?: boolean;
}

export const FeaturedGalleryViewer: React.FC<FeaturedGalleryViewerProps> = ({
  photos,
  currentIndex,
  onSelectIndex,
  onOpenFullscreen,
  onEdit,
  onDelete,
  isAdmin,
  formatDate,
  compact = false,
}) => {
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isVertical, setIsVertical] = useState<boolean>(false);

  // Zoom & Pan state for interactive detail examination
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMovedRef = useRef<boolean>(false);

  const safeIndex = Math.max(0, Math.min(currentIndex, photos.length - 1));
  const currentPhoto = photos[safeIndex] || photos[0];

  // Reset zoom & pan when switching photo
  useEffect(() => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
    dragMovedRef.current = false;
  }, [safeIndex, currentPhoto?.id]);

  // Mouse wheel zoom over the main stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
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
  }, []);

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

  // Move image by delta with smooth boundaries
  const panBy = (deltaX: number, deltaY: number) => {
    const stage = stageRef.current;
    const stageW = stage ? stage.clientWidth : 800;
    const stageH = stage ? stage.clientHeight : 500;
    const maxPanX = Math.max(160, (stageW * (zoomScale - 1)) / 1.1 + 120);
    const maxPanY = Math.max(160, (stageH * (zoomScale - 1)) / 1.1 + 120);

    setPanPosition((prev) => ({
      x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + deltaX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + deltaY)),
    }));
  };

  // Pointer events with Pointer Capture for uninterrupted drag on mobile and desktop
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    if ((e.target as HTMLElement).closest('button')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
    }

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panPosition };
    dragMovedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
    }

    const stage = stageRef.current;
    const stageW = stage ? stage.clientWidth : 800;
    const stageH = stage ? stage.clientHeight : 500;
    const maxPanX = Math.max(160, (stageW * (zoomScale - 1)) / 1.1 + 120);
    const maxPanY = Math.max(160, (stageH * (zoomScale - 1)) / 1.1 + 120);

    const nextX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
    setPanPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  // Two-finger pinch to zoom on mobile touch screens
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      const nextScale = Math.max(1, Math.min(4, Math.round(pinchStartScaleRef.current * ratio * 10) / 10));
      setZoomScale(nextScale);
      if (nextScale <= 1) {
        setPanPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleResetZoom();
    } else {
      setZoomScale(2);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Auto-detect if the current photo is portrait / vertical
  useEffect(() => {
    if (!currentPhoto?.url) return;
    const testImg = new Image();
    testImg.src = currentPhoto.url;
    if (testImg.complete && testImg.naturalWidth && testImg.naturalHeight) {
      setIsVertical(testImg.naturalHeight > testImg.naturalWidth);
    } else {
      testImg.onload = () => {
        setIsVertical(testImg.naturalHeight > testImg.naturalWidth);
      };
    }
  }, [currentPhoto?.url]);

  // Auto-play slideshow (optional user option)
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;
    const timer = setInterval(() => {
      onSelectIndex((safeIndex + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, safeIndex, photos.length, onSelectIndex]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        onSelectIndex((safeIndex - 1 + photos.length) % photos.length);
      } else if (e.key === 'ArrowRight') {
        onSelectIndex((safeIndex + 1) % photos.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeIndex, photos.length, onSelectIndex]);

  // Auto-scroll the active thumbnail into the center of the filmstrip WITHOUT affecting window scroll
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (thumbnailsRef.current) {
      const activeEl = thumbnailsRef.current.children[safeIndex] as HTMLElement | undefined;
      if (activeEl) {
        const container = thumbnailsRef.current;
        const targetScrollLeft =
          activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      }
    }
  }, [safeIndex]);

  const handlePrev = () => {
    onSelectIndex((safeIndex - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    onSelectIndex((safeIndex + 1) % photos.length);
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!currentPhoto) return null;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* 1. MUESTRA EN GRANDE (Main Stage) */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full ${
          compact
            ? isVertical
              ? 'h-[360px] sm:h-[420px] md:h-[460px] max-h-[65vh]'
              : 'h-[250px] sm:h-[320px] md:h-[380px] max-h-[50vh]'
            : isVertical
            ? 'h-[560px] sm:h-[680px] md:h-[780px] lg:h-[860px] max-h-[90vh]'
            : 'h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] max-h-[75vh]'
        } rounded-3xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-2xl flex items-center justify-center select-none group transition-[height] duration-500 ease-out`}
        style={{
          cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: zoomScale > 1 ? 'none' : 'pan-y',
        }}
      >
        {/* Blurred background image backdrop for seamless ambient glow */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${currentPhoto.url})` }}
        />

        {/* Floating guidance pill and pan nudges when zoomed in */}
        {zoomScale > 1 && (
          <div className="absolute top-16 sm:top-20 inset-x-0 z-30 flex flex-col items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-blue-400/40 text-white text-xs shadow-2xl backdrop-blur-md pointer-events-auto">
              <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              <span className="font-medium text-slate-100 hidden xs:inline">
                Arrastra o pellizca para mover
              </span>
              <span className="bg-blue-600/80 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white">
                {Math.round(zoomScale * 100)}%
              </span>

              {/* Nudge arrow buttons for quick repositioning on mobile or precision */}
              <div className="flex items-center gap-0.5 ml-1 border-l border-white/20 pl-1.5">
                <button
                  onClick={() => panBy(80, 0)}
                  aria-label="Mover a la izquierda"
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Mover a la izquierda"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => panBy(0, 80)}
                  aria-label="Mover arriba"
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => panBy(0, -80)}
                  aria-label="Mover abajo"
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => panBy(-80, 0)}
                  aria-label="Mover a la derecha"
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                  title="Mover a la derecha"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleResetZoom}
                className="ml-1 text-[11px] text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer font-semibold"
              >
                Restablecer
              </button>
            </div>
          </div>
        )}

        {/* Foreground main high-resolution photo with drag & zoom */}
        <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
          <img
            key={currentPhoto.id}
            src={currentPhoto.url}
            alt={currentPhoto.title}
            referrerPolicy="no-referrer"
            draggable={false}
            onClick={() => {
              if (!dragMovedRef.current) {
                onOpenFullscreen(safeIndex);
              }
            }}
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
            className={`pointer-events-auto max-w-full max-h-full object-contain select-none drop-shadow-2xl ${
              zoomScale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-pointer hover:scale-[1.01]'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Flecha izquierda en la foto grande */}
        <button
          onClick={handlePrev}
          aria-label="Foto anterior"
          className={`absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 ${
            compact ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-11 h-11 sm:w-14 sm:h-14'
          } rounded-full bg-slate-900/70 hover:bg-blue-600 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer group/btn`}
          title="Foto anterior (←)"
        >
          <ChevronLeft className={`${compact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-8 sm:h-8'} group-hover/btn:-translate-x-0.5 transition-transform stroke-[2.5]`} />
        </button>

        {/* Flecha derecha en la foto grande */}
        <button
          onClick={handleNext}
          aria-label="Foto siguiente"
          className={`absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 ${
            compact ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-11 h-11 sm:w-14 sm:h-14'
          } rounded-full bg-slate-900/70 hover:bg-blue-600 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 cursor-pointer group/btn`}
          title="Foto siguiente (→)"
        >
          <ChevronRight className={`${compact ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-8 sm:h-8'} group-hover/btn:translate-x-0.5 transition-transform stroke-[2.5]`} />
        </button>

        {/* Barra superior de información y controles */}
        <div className={`absolute ${compact ? 'top-3 left-3 right-3' : 'top-4 left-4 right-4'} z-20 flex items-center justify-between pointer-events-none`}>
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            {/* Counter */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white border border-white/20 backdrop-blur-md shadow-md">
              {safeIndex + 1} / {photos.length}
            </span>

            {/* Category tag */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white border border-blue-400/30 backdrop-blur-md shadow-md flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-200" />
              {currentPhoto.category}
            </span>

            {/* Vertical format badge */}
            {isVertical && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/90 text-white border border-indigo-400/30 backdrop-blur-md shadow-md animate-in fade-in duration-300">
                <Smartphone className="w-3.5 h-3.5 text-indigo-200" />
                Vertical en Grande
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
            {/* Auto-slideshow button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors backdrop-blur-md border shadow-md cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/20'
              }`}
              title={isPlaying ? 'Pausar pase automático' : 'Iniciar pase de diapositivas (cada 4s)'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Pase auto</span>
                </>
              )}
            </button>

            {/* Zoom / Pan toggle button (target button) */}
            <button
              onClick={handleToggleZoom}
              className={`p-2 rounded-full border backdrop-blur-md shadow-md transition-all cursor-pointer ${
                zoomScale > 1
                  ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50 shadow-blue-500/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/20'
              }`}
              title={
                zoomScale > 1
                  ? `Zoom activo (${Math.round(zoomScale * 100)}%): pulsa para restablecer o arrastra para mover la foto`
                  : 'Ampliar detalle con lupa y arrastrar para mover la foto libremente'
              }
            >
              {zoomScale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {/* Fine zoom adjustment controls (when zoom is active) */}
            {zoomScale > 1 && (
              <div className="flex items-center gap-0.5 bg-slate-900/90 border border-blue-400/40 rounded-full px-1.5 py-0.5 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 1.25}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Alejar zoom (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-blue-300 px-1.5 select-none">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 4}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Acercar zoom (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  title="Restablecer tamaño original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fullscreen lightbox button */}
            <button
              onClick={() => onOpenFullscreen(safeIndex)}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-md shadow-md transition-colors cursor-pointer"
              title="Ver en pantalla completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Admin actions (Edit / Delete) */}
            {isAdmin && onEdit && (
              <button
                onClick={() => onEdit(currentPhoto)}
                className="p-2 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-white/20 backdrop-blur-md shadow-md transition-colors cursor-pointer"
                title="Editar título y fecha"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {isAdmin && onDelete && (
              confirmDeleteId === currentPhoto.id ? (
                <div className="flex items-center gap-1 bg-red-950/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/50 shadow-md">
                  <span className="text-[11px] font-semibold text-red-200">¿Borrar?</span>
                  <button
                    onClick={() => {
                      onDelete(currentPhoto.id);
                      setConfirmDeleteId(null);
                    }}
                    className="text-[11px] font-bold text-red-400 hover:text-white px-1 cursor-pointer"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-[11px] text-slate-300 hover:text-white px-1 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(currentPhoto.id)}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-red-600 text-white border border-white/20 backdrop-blur-md shadow-md transition-colors cursor-pointer"
                  title="Eliminar esta foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Gradiente inferior e información de la foto */}
        <div className={`absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent ${
          compact ? 'p-3.5 sm:p-5 pt-12' : 'p-5 sm:p-7 pt-16'
        } text-white pointer-events-none`}>
          <div className="max-w-4xl space-y-1 sm:space-y-1.5 pointer-events-auto">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-xs text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                {formatDate(currentPhoto.date)}
              </span>
              <span className="text-slate-400 hidden sm:inline text-[11px]">• Pulsa en la imagen para pantalla completa</span>
            </div>

            <h2 className={`font-display font-black ${
              compact ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-3xl'
            } text-white tracking-tight leading-snug drop-shadow-md`}>
              {currentPhoto.title}
            </h2>

            {currentPhoto.description && (
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-1 sm:line-clamp-2 max-w-3xl leading-relaxed drop-shadow">
                {currentPhoto.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARRUSEL DE MINIATURAS INFERIOR (Thumbnails Filmstrip with Navigation Arrows) */}
      <div className={`bg-white rounded-2xl ${
        compact ? 'p-3 sm:p-3.5 space-y-2' : 'p-4 sm:p-5 space-y-3'
      } border border-slate-200 shadow-sm`}>
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-700 text-[11px] sm:text-xs">
              Carrete de Miniaturas ({photos.length} fotos)
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold">
              Foto #{safeIndex + 1}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-500" />
            Navega con las flechas laterales o con las teclas ← y →
          </span>
        </div>

        {/* Strip container with Left & Right Arrows */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          {/* Botón flecha izquierda del carrusel de miniaturas */}
          <button
            type="button"
            onClick={() => scrollThumbnails('left')}
            className={`${
              compact ? 'w-8 h-12 sm:w-10 sm:h-14' : 'w-11 h-14 sm:w-12 sm:h-18'
            } rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300/80 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-95 group/arrow`}
            title="Desplazar miniaturas hacia la izquierda"
            aria-label="Desplazar miniaturas hacia la izquierda"
          >
            <ChevronLeft className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} group-hover/arrow:-translate-x-0.5 transition-transform stroke-[2.5]`} />
          </button>

          {/* Tira deslizable de miniaturas */}
          <div
            ref={thumbnailsRef}
            className="flex-1 flex items-center gap-2 sm:gap-3 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar"
          >
            {photos.map((photo, idx) => {
              const isActive = idx === safeIndex;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  className={`relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer text-left group ${
                    isActive
                      ? 'ring-3 sm:ring-4 ring-blue-500 ring-offset-2 ring-offset-white scale-105 shadow-lg z-10'
                      : 'opacity-70 hover:opacity-100 hover:scale-102 border border-slate-200'
                  }`}
                  style={compact ? { width: '92px', height: '62px' } : { width: '120px', height: '78px' }}
                  title={`${photo.title} (${formatDate(photo.date)})`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80';
                    }}
                  />

                  {/* Overlay tint */}
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isActive ? 'bg-blue-500/10' : 'bg-black/20 group-hover:bg-transparent'
                    }`}
                  />

                  {/* Indicator pill on thumbnail */}
                  <span
                    className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none shadow-sm ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-black/70 text-white/90'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {isActive && (
                    <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Botón flecha derecha del carrusel de miniaturas */}
          <button
            type="button"
            onClick={() => scrollThumbnails('right')}
            className={`${
              compact ? 'w-8 h-12 sm:w-10 sm:h-14' : 'w-11 h-14 sm:w-12 sm:h-18'
            } rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-300/80 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-95 group/arrow`}
            title="Desplazar miniaturas hacia la derecha"
            aria-label="Desplazar miniaturas hacia la derecha"
          >
            <ChevronRight className={`${compact ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} group-hover/arrow:translate-x-0.5 transition-transform stroke-[2.5]`} />
          </button>
        </div>
      </div>
    </div>
  );
};

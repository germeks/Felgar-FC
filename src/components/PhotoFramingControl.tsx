import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, ZoomIn, ZoomOut, RotateCcw, Sliders, User, Check, Eye } from 'lucide-react';
import { parsePhotoPosition, formatPhotoPosition } from '../utils/photoUtils';

interface PhotoFramingControlProps {
  photoUrl: string;
  photoPosition?: string;
  photoZoom?: number;
  playerName?: string;
  preferredSide?: 'Azules' | 'Blancos' | 'Indiferente';
  onChange: (framing: { position: string; zoom: number }) => void;
}

export const PhotoFramingControl: React.FC<PhotoFramingControlProps> = ({
  photoUrl,
  photoPosition,
  photoZoom = 1.0,
  playerName = 'Jugador',
  preferredSide = 'Azules',
  onChange,
}) => {
  const initialPos = parsePhotoPosition(photoPosition);
  const [posX, setPosX] = useState(initialPos.x);
  const [posY, setPosY] = useState(initialPos.y);
  const [zoom, setZoom] = useState(photoZoom || 1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialDragPos, setInitialDragPos] = useState<{ x: number; y: number }>({ x: 50, y: 20 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync state if external props change
  useEffect(() => {
    const p = parsePhotoPosition(photoPosition);
    setPosX(p.x);
    setPosY(p.y);
    setZoom(photoZoom || 1.0);
  }, [photoPosition, photoZoom]);

  const updateFraming = useCallback((newX: number, newY: number, newZoom: number) => {
    const clampedX = Math.round(Math.min(100, Math.max(0, newX)));
    const clampedY = Math.round(Math.min(100, Math.max(0, newY)));
    const clampedZoom = Math.min(2.2, Math.max(1.0, Number(newZoom.toFixed(2))));
    
    setPosX(clampedX);
    setPosY(clampedY);
    setZoom(clampedZoom);

    onChange({
      position: formatPhotoPosition(clampedX, clampedY),
      zoom: clampedZoom,
    });
  }, [onChange]);

  // Dragging handlers on card preview
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialDragPos({ x: posX, y: posY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Moving mouse down should pull image down (meaning showing more of top, so posY decreases)
    // Sensitivity factor
    const sens = 100;
    const newX = initialDragPos.x - (deltaX / rect.width) * sens;
    const newY = initialDragPos.y - (deltaY / rect.height) * sens;

    updateFraming(newX, newY, zoom);
  }, [isDragging, dragStart, initialDragPos, zoom, updateFraming]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setInitialDragPos({ x: posX, y: posY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !cardRef.current || e.touches.length !== 1) return;
    const rect = cardRef.current.getBoundingClientRect();
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;

    const sens = 100;
    const newX = initialDragPos.x - (deltaX / rect.width) * sens;
    const newY = initialDragPos.y - (deltaY / rect.height) * sens;

    updateFraming(newX, newY, zoom);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const currentPositionStyle = `${posX}% ${posY}%`;
  const currentTransformStyle = zoom !== 1 ? `scale(${zoom})` : undefined;

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-blue-200/90 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-blue-600" />
          Ajuste de Encuadre & Miniatura
        </span>
        <button
          type="button"
          onClick={() => updateFraming(50, 8, 1.0)}
          className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
          title="Restablecer posición inicial recomendada"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer
        </button>
      </div>

      {/* Dual live preview: Card Header & Table Thumbnail */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Card Header Preview */}
        <div className="sm:col-span-8 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              Vista previa en Tarjeta
            </span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
              <Move className="w-3 h-3" /> Arrastra para mover
            </span>
          </div>

          <div
            ref={cardRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative h-56 bg-slate-100 rounded-2xl overflow-hidden cursor-grab select-none border-2 border-slate-300 shadow-sm group ${
              isDragging ? 'cursor-grabbing ring-2 ring-blue-500' : ''
            }`}
            title="Haz clic y arrastra para ajustar la posición"
          >
            {/* Player Photo with applied framing */}
            <img
              src={photoUrl}
              alt="Vista previa tarjeta"
              className="w-full h-full object-cover pointer-events-none transition-all duration-75"
              style={{
                objectPosition: currentPositionStyle,
                transform: zoom > 1.02 ? `scale(${zoom})` : undefined,
                transformOrigin: currentPositionStyle,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
              }}
            />

            {/* Subtle bottom gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />

            {/* Preferred side pill */}
            <div
              className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-xs pointer-events-none z-20 ${
                preferredSide === 'Azules'
                  ? 'bg-white text-blue-700 border-blue-200'
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              {preferredSide === 'Azules' ? '🔵 Azules' : '⚪ Blancos'}
            </div>

            {/* Player name preview overlay */}
            <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none z-20">
              <h4 className="font-display font-bold text-base text-slate-900 leading-tight">
                {playerName.trim() || 'Nombre del Jugador'}
              </h4>
              <p className="text-[10px] font-semibold text-slate-500">
                Vista real en la tarjeta del club
              </p>
            </div>
          </div>
        </div>

        {/* List Thumbnail Previews */}
        <div className="sm:col-span-4 bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-center">
          <span className="text-[11px] font-bold text-slate-700 block">
            Miniatura en Lista
          </span>
          <div className="flex items-center justify-center gap-3">
            {/* 44px avatar */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 bg-slate-100 shadow-sm mx-auto relative">
                <img
                  src={photoUrl}
                  alt="Miniatura lista"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: currentPositionStyle,
                    transform: zoom > 1.02 ? `scale(${zoom})` : undefined,
                    transformOrigin: currentPositionStyle,
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-500 font-medium mt-1 block">Tabla</span>
            </div>

            {/* 32px avatar */}
            <div className="text-center">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 bg-slate-100 shadow-xs mx-auto relative">
                <img
                  src={photoUrl}
                  alt="Miniatura compacta"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: currentPositionStyle,
                    transform: zoom > 1.02 ? `scale(${zoom})` : undefined,
                    transformOrigin: currentPositionStyle,
                  }}
                />
              </div>
              <span className="text-[9px] text-slate-500 font-medium mt-1 block">Lista</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 py-0.5 px-1 rounded border border-emerald-100">
            Sincronizado
          </div>
        </div>
      </div>

      {/* Quick 1-click presets */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-600">
          Ajustes rápidos de encuadre recomendados:
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => updateFraming(50, 5, 1.0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              posY <= 10 && zoom === 1.0
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Encuadra para ver cabeza, cuello, hombros y pecho completos"
          >
            <User className="w-3.5 h-3.5 text-current" />
            <span>👤 Cabeza y Pecho (Recomendado)</span>
          </button>

          <button
            type="button"
            onClick={() => updateFraming(50, 15, 1.25)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              posY > 10 && posY <= 20 && zoom > 1.15
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>🔍 Primer Plano (Cara)</span>
          </button>

          <button
            type="button"
            onClick={() => updateFraming(50, 25, 1.0)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              posY > 20 && posY <= 35 && zoom === 1.0
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>👕 Busto / Torso</span>
          </button>

          <button
            type="button"
            onClick={() => updateFraming(50, 50, 1.0)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              posY > 35 && posY <= 65 && zoom === 1.0
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>🎯 Centrado 100%</span>
          </button>

          <button
            type="button"
            onClick={() => updateFraming(50, 0, 1.0)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              posY === 0 && zoom === 1.0
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <span>🔝 Arriba del Todo</span>
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
        {/* Vertical Y Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>Posición Vertical</span>
            <span className="text-blue-600 font-mono text-[10px] font-bold">
              {posY}% ({posY <= 12 ? 'Cabeza' : posY <= 35 ? 'Rostro' : 'Pecho'})
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={posY}
            onChange={(e) => updateFraming(posX, Number(e.target.value), zoom)}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span className="font-semibold text-emerald-700">Arriba (0% - Cabeza)</span>
            <span>Abajo (100% - Torso)</span>
          </div>
        </div>

        {/* Horizontal X Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>Posición Horizontal</span>
            <span className="text-blue-600 font-mono text-[10px]">{posX}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={posX}
            onChange={(e) => updateFraming(Number(e.target.value), posY, zoom)}
            className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400">
            <span>Izq (0%)</span>
            <span>Centro (50%)</span>
            <span>Der (100%)</span>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span className="flex items-center gap-1">
              <ZoomIn className="w-3 h-3 text-slate-500" />
              Zoom / Acercar
            </span>
            <span className="font-mono text-[10px] font-bold text-blue-600">
              {(zoom * 100).toFixed(0)}% {zoom === 1.0 ? '(Completo)' : '(Acercado)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateFraming(posX, posY, Math.max(1.0, zoom - 0.05))}
              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Reducir zoom (-5%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1.0"
              max="2.2"
              step="0.02"
              value={zoom}
              onChange={(e) => updateFraming(posX, posY, parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => updateFraming(posX, posY, Math.min(2.2, zoom + 0.05))}
              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Añadir zoom (+5%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
            <span className="text-emerald-700 font-semibold">100% (Ver Cabeza y Pecho)</span>
            <button
              type="button"
              onClick={() => updateFraming(posX, posY, 1.0)}
              className="hover:text-blue-600 font-medium underline cursor-pointer"
            >
              Restablecer 100%
            </button>
            <span>220% (Acercar)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

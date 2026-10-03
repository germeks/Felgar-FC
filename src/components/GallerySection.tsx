import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { PhotoItem } from '../types';
import { UploadPhotoModal } from './UploadPhotoModal';
import { LightboxModal } from './LightboxModal';
import { FeaturedGalleryViewer } from './FeaturedGalleryViewer';
import {
  Camera,
  Plus,
  Calendar,
  Search,
  Trash2,
  Edit2,
  Maximize2,
  Tag,
  Film,
  LayoutGrid,
  ChevronDown,
  FolderOpen,
  Columns3,
} from 'lucide-react';

export const GallerySection: React.FC = () => {
  const { photos, deletePhoto, isAdmin, photoCategories } = useClub();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // View mode: 'featured' (big photo with bottom thumbnails carousel), 'masonry' (vertical photos large & natural), or 'grid'
  const [viewMode, setViewMode] = useState<'featured' | 'masonry' | 'grid'>('featured');
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState<number>(0);

  // Switch view mode when category changes if desired (in 'all', default to featured)
  useEffect(() => {
    setActiveFeaturedIndex(0);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Filtered photos
  const filteredPhotos = photos.filter((photo) => {
    if (selectedCategory !== 'all' && photo.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = photo.title.toLowerCase().includes(q);
      const matchDate = photo.date.includes(q);
      const matchDesc = photo.description ? photo.description.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDate && !matchDesc) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas las fotos' },
    ...photoCategories.map((cat) => ({ id: cat, label: cat })),
  ];

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Left Category Dropdown, Search, View Mode and Admin Upload */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: Category Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative inline-flex items-center">
            <FolderOpen className="w-4 h-4 text-blue-600 absolute left-3 pointer-events-none" />
            <select
              id="gallery-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300/90 text-slate-900 text-xs sm:text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer transition-colors shadow-2xs"
            >
              {categories.map((cat) => {
                const count =
                  cat.id === 'all'
                    ? photos.length
                    : photos.filter((p) => p.category === cat.id).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({count})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 pointer-events-none stroke-[2.5]" />
          </div>

          <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">
            {filteredPhotos.length} {filteredPhotos.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>

        {/* Right Side: Search, View Mode and Upload */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
          {/* Search */}
          <div className="relative flex-1 sm:w-60 md:w-64 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar foto..."
              className="w-full bg-slate-50 border border-slate-300/80 rounded-xl pl-9 pr-7 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-900 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('featured')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'featured'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Muestra en grande con carrete de miniaturas abajo (se adapta a fotos verticales)"
            >
              <Film className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Visor en Grande</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('masonry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'masonry'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Mosaico: las fotos verticales se ven completas y en grande sin recortar"
            >
              <Columns3 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Mosaico (Verticales)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cuadrícula uniforme"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
          </div>

          {/* Admin Upload Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingPhoto(null);
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              title="Subir foto con título y fecha"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Subir Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Photos Content: Featured Viewer or Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No se encontraron fotografías</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            No hay fotos que coincidan con la búsqueda o categoría seleccionada.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Subir Primera Foto
            </button>
          )}
        </div>
      ) : viewMode === 'featured' ? (
        /* MUESTRA EN GRANDE Y ABAJO EN MINIATURA CON FLECHAS (Carrusel) */
        <FeaturedGalleryViewer
          photos={filteredPhotos}
          currentIndex={activeFeaturedIndex}
          onSelectIndex={(idx) => setActiveFeaturedIndex(idx)}
          onOpenFullscreen={(idx) => setLightboxIndex(idx)}
          onEdit={
            isAdmin
              ? (photo) => {
                  setEditingPhoto(photo);
                  setIsUploadModalOpen(true);
                }
              : undefined
          }
          onDelete={
            isAdmin
              ? (id) => {
                  deletePhoto(id);
                  if (activeFeaturedIndex >= filteredPhotos.length - 1) {
                    setActiveFeaturedIndex(Math.max(0, filteredPhotos.length - 2));
                  }
                }
              : undefined
          }
          isAdmin={isAdmin}
          formatDate={formatDate}
        />
      ) : viewMode === 'masonry' ? (
        /* MODO MOSAICO DINÁMICO (Fotos verticales en grande sin recortes) */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="break-inside-avoid mb-6 bg-white border border-slate-200 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-2xl flex flex-col group"
            >
              {/* Image with overlay tags - natural height preserves vertical photos */}
              <div
                onClick={() => {
                  setActiveFeaturedIndex(index);
                  setViewMode('featured');
                }}
                className="relative w-full bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[720px] object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-blue-700 border border-blue-200 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                    <Tag className="w-3 h-3 text-blue-600" />
                    {photo.category}
                  </span>
                </div>

                {/* Date Badge */}
                <div className="absolute top-3 right-3 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {formatDate(photo.date)}
                  </span>
                </div>

                {/* Bottom title inside image */}
                <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug drop-shadow-sm">
                    {photo.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 bg-white flex-1 flex flex-col justify-between space-y-3">
                {photo.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {photo.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Fotografía de Felgar FC
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setActiveFeaturedIndex(index);
                      setViewMode('featured');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Ver en Grande
                  </button>

                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Pantalla completa
                  </button>

                  {/* Admin Actions: Edit & Delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setIsUploadModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar esta foto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === photo.id ? (
                        <div className="flex items-center gap-1 bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                          <span className="text-[10px] text-red-300">¿Borrar?</span>
                          <button
                            onClick={() => {
                              deletePhoto(photo.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-200 px-1 cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-900 px-1 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(photo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MODO CUADRÍCULA (Tarjetas con altura generosa de 320px) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white border border-slate-200 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-2xl flex flex-col group"
            >
              {/* Image with overlay tags */}
              <div
                onClick={() => {
                  setActiveFeaturedIndex(index);
                  setViewMode('featured');
                }}
                className="relative h-72 sm:h-80 bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1000&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-blue-700 border border-blue-200 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                    <Tag className="w-3 h-3 text-blue-600" />
                    {photo.category}
                  </span>
                </div>

                {/* Date Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {formatDate(photo.date)}
                  </span>
                </div>

                {/* Bottom title inside image */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug drop-shadow-sm">
                    {photo.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 bg-white flex-1 flex flex-col justify-between space-y-3">
                {photo.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {photo.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Fotografía de Felgar FC
                  </p>
                )}

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setActiveFeaturedIndex(index);
                      setViewMode('featured');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Ver en Grande
                  </button>

                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Pantalla completa
                  </button>

                  {/* Admin Actions: Edit & Delete */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setIsUploadModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar esta foto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {confirmDeleteId === photo.id ? (
                        <div className="flex items-center gap-1 bg-red-950 px-2 py-0.5 rounded border border-red-500/30">
                          <span className="text-[10px] text-red-300">¿Borrar?</span>
                          <button
                            onClick={() => {
                              deletePhoto(photo.id);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-200 px-1 cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-900 px-1 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(photo.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload or Edit Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingPhoto(null);
        }}
        photoToEdit={editingPhoto}
      />

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onEdit={
            isAdmin
              ? (photo) => {
                  setLightboxIndex(null);
                  setEditingPhoto(photo);
                  setIsUploadModalOpen(true);
                }
              : undefined
          }
          onDelete={
            isAdmin
              ? (id) => {
                  deletePhoto(id);
                  if (filteredPhotos.length <= 1) {
                    setLightboxIndex(null);
                  } else if (lightboxIndex !== null && lightboxIndex >= filteredPhotos.length - 1) {
                    setLightboxIndex(Math.max(0, filteredPhotos.length - 2));
                  }
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

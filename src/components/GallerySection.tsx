import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { UploadPhotoModal } from './UploadPhotoModal';
import { LightboxModal } from './LightboxModal';
import { Camera, Plus, Calendar, Search, Trash2, Maximize2, Tag, Users } from 'lucide-react';

export const GallerySection: React.FC = () => {
  const { photos, deletePhoto, isAdmin } = useClub();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    { id: 'Partidos', label: 'Pachangas (Azules vs Blancos)' },
    { id: 'Celebraciones', label: 'Celebraciones & Amigos' },
    { id: 'Entrenamientos', label: 'Calentamiento' },
    { id: 'Plantilla', label: 'Los Amigos' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              Galería de Recuerdos y Momentos
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Fotos de las Pachangas de <span className="text-blue-400">Felgar FC</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Los mejores momentos de nuestros partidillos de los lunes, las jugadas destacadas, risas y anécdotas de la peña. Sube fotos con su título y fecha para el recuerdo del grupo.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="self-start md:self-auto flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Subir Foto con Título y Fecha</span>
            </button>
          )}
        </div>

        {/* Quick count pill */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-4 text-xs text-slate-400">
          <span>Total en el álbum: <strong className="text-white">{photos.length} fotos</strong></span>
          <span>•</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-400" /> Peña de Amigos Felgar FC</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar fotos por título, fecha o detalle..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No se encontraron fotografías</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            No hay fotos que coincidan con la búsqueda o categoría seleccionada.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Subir Primera Foto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-2xl flex flex-col group"
            >
              {/* Image with overlay tags */}
              <div
                onClick={() => setLightboxIndex(index)}
                className="relative h-60 bg-slate-950 overflow-hidden cursor-pointer"
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-xs flex items-center gap-1">
                    <Tag className="w-3 h-3 text-blue-400" />
                    {photo.category}
                  </span>
                </div>

                {/* Date Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-950/80 text-white border border-slate-700/80 backdrop-blur-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    {formatDate(photo.date)}
                  </span>
                </div>

                {/* Zoom hover indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3 rounded-full bg-slate-950/70 text-white border border-slate-600 backdrop-blur-xs shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>

                {/* Bottom title inside image */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                    {photo.title}
                  </h3>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 bg-slate-900 flex-1 flex flex-col justify-between space-y-3">
                {photo.description ? (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {photo.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Fotografía de los amigos de Felgar FC
                  </p>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setLightboxIndex(index)}
                    className="font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Ver Pantalla Completa
                  </button>

                  {/* Delete button (Admin Only) */}
                  {isAdmin && (
                    confirmDeleteId === photo.id ? (
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
                          className="text-[10px] text-slate-400 hover:text-white px-1 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(photo.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Fullscreen Lightbox */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </div>
  );
};

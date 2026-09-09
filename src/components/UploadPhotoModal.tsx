import React, { useState, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { PhotoCategory } from '../types';
import { X, Upload, Camera, CheckCircle, Link } from 'lucide-react';
import confetti from 'canvas-confetti';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_PRESETS = [
  {
    title: 'Foto de grupo: risas y anécdotas tras el partidillo',
    category: 'Celebraciones' as PhotoCategory,
    url: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?w=1000&auto=format&fit=crop&q=80',
  },
  {
    title: 'Pachanga semanal: duelo épico Azules vs Blancos',
    category: 'Partidos' as PhotoCategory,
    url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    title: 'Foto de grupo de los amigos antes de empezar',
    category: 'Plantilla' as PhotoCategory,
    url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1000&auto=format&fit=crop&q=80',
  },
];

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({ isOpen, onClose }) => {
  const { addPhoto } = useClub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<PhotoCategory>('Partidos');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
        if (!title) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setTitle(nameWithoutExt);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim()) {
      alert('Por favor, sube una foto desde tu dispositivo o ingresa una URL.');
      return;
    }

    if (!title.trim()) {
      alert('Por favor, escribe un título para la foto.');
      return;
    }

    addPhoto({
      title: title.trim(),
      date,
      url: photoUrl.trim(),
      category,
      description: description.trim() || undefined,
    });

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#60A5FA', '#F59E0B'],
      });
    } catch {
      // Confetti fallback
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">Subir Nueva Foto</h3>
              <p className="text-xs text-slate-400">Recuerdos de los amigos de Felgar FC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Method selector: Upload File vs Image URL */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                uploadMethod === 'file'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir desde mi equipo / Móvil
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                uploadMethod === 'url'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              Ingresar URL de Imagen
            </button>
          </div>

          {/* Upload Area or URL input */}
          {uploadMethod === 'file' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : photoUrl
                    ? 'border-slate-700 bg-slate-950/60'
                    : 'border-slate-700 hover:border-blue-500/60 bg-slate-950/40 hover:bg-slate-950/80'
                }`}
              >
                {photoUrl ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-700">
                    <img src={photoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                      <Camera className="w-4 h-4" /> Cambiar foto
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        Arrastra y suelta tu foto aquí o <span className="text-blue-400 underline">haz clic para elegirla</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        Compatible con fotos de partidillos, goles, risas o el bar
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enlace directo a la imagen (URL) *
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              {photoUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={photoUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={() => alert('No se pudo cargar la imagen desde esa URL')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Quick presets option if user wants inspiration */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-500 flex-shrink-0">Ejemplos rápidos:</span>
            {SAMPLE_PRESETS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPhotoUrl(sample.url);
                  setTitle(sample.title);
                  setCategory(sample.category);
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex-shrink-0 transition-colors cursor-pointer"
              >
                + {sample.title.slice(0, 26)}...
              </button>
            ))}
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título de la Foto *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Golazo de volea de Pedro en el último minuto"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha de la Foto *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'Partidos', label: 'Pachanga (Azules vs Blancos)' },
                  { id: 'Celebraciones', label: 'Celebración & Amigos' },
                  { id: 'Entrenamientos', label: 'Calentamiento' },
                  { id: 'Plantilla', label: 'Los Amigos' },
                ] as { id: PhotoCategory; label: string }[]
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-blue-600/20 text-blue-300 border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Anécdota / Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles divertidos del partidillo, anécdotas o jugadas destacadas..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Publicar Foto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { PhotoCategory, PhotoItem } from '../types';
import { X, Upload, Camera, CheckCircle, Link, Edit3, Loader2, Trash2, Tag, Plus, Edit2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImage } from '../utils/imageCompression';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoToEdit?: PhotoItem | null;
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
    title: 'Foto de grupo de los jugadores antes de empezar',
    category: 'Plantilla' as PhotoCategory,
    url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1000&auto=format&fit=crop&q=80',
  },
];

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({ isOpen, onClose, photoToEdit }) => {
  const {
    addPhoto,
    updatePhoto,
    deletePhoto,
    photoCategories,
    addPhotoCategory,
    updatePhotoCategory,
    deletePhotoCategory,
  } = useClub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(photoToEdit);
  const today = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<PhotoCategory>('Partidos');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');

  // Category management states
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editCatInput, setEditCatInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (photoToEdit) {
      setTitle(photoToEdit.title);
      setDate(photoToEdit.date);
      setCategory(photoToEdit.category);
      setDescription(photoToEdit.description || '');
      setPhotoUrl(photoToEdit.url);
      setUploadMethod(photoToEdit.url.startsWith('data:') ? 'file' : 'url');
    } else {
      setTitle('');
      setDate(today);
      setCategory('Partidos');
      setDescription('');
      setPhotoUrl('');
      setUploadMethod('file');
    }
  }, [photoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, {
        maxDimension: 1400,
        quality: 0.8,
        maxSizeBytes: 550 * 1024,
      });
      setPhotoUrl(compressed);
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    } catch (err) {
      console.error('Error procesando imagen:', err);
      alert('No se pudo procesar la imagen seleccionada.');
    } finally {
      setIsCompressing(false);
    }
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

  const handleSaveEditCategory = async (oldCat: string) => {
    const trimmed = editCatInput.trim();
    if (!trimmed) {
      setEditingCatName(null);
      return;
    }
    await updatePhotoCategory(oldCat, trimmed);
    if (category === oldCat) {
      setCategory(trimmed);
    }
    setEditingCatName(null);
    setEditCatInput('');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    await deletePhotoCategory(catToDelete);
    if (category === catToDelete) {
      const remaining = photoCategories.filter((c) => c !== catToDelete);
      setCategory(remaining[0] || 'Partidos');
    }
    setDeleteConfirmCat(null);
  };

  const handleAddCategory = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const added = await addPhotoCategory(trimmed);
    if (added) {
      setCategory(added);
    }
    setNewCatInput('');
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

    if (photoToEdit) {
      updatePhoto({
        ...photoToEdit,
        title: title.trim(),
        date,
        url: photoUrl.trim(),
        category,
        description: description.trim() || undefined,
      });
    } else {
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
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 via-white to-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 border border-blue-500/30">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                {isEditing ? 'Editar Foto / Publicación' : 'Subir Nueva Foto'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Modifica el título, fecha, categoría o imagen de esta foto' : 'Recuerdos de los jugadores de Felgar FC'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Method selector: Upload File vs Image URL */}
          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
                uploadMethod === 'file'
                  ? 'bg-blue-400 text-slate-900 shadow'
                  : 'text-slate-400 hover:text-slate-900'
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
                  ? 'bg-blue-400 text-slate-900 shadow'
                  : 'text-slate-400 hover:text-slate-900'
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
                onClick={() => !isCompressing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-blue-400 bg-blue-500/10'
                    : photoUrl
                    ? 'border-slate-300 bg-slate-50/60'
                    : 'border-slate-300 hover:border-blue-500/60 bg-slate-50/40 hover:bg-slate-50/80'
                }`}
              >
                {isCompressing ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs font-semibold text-blue-700">Optimizando foto para carga ultrarrápida...</p>
                  </div>
                ) : photoUrl ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden border border-slate-300">
                    <img src={photoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-50/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-slate-900 text-xs font-semibold gap-1">
                      <Camera className="w-4 h-4" /> Cambiar foto
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Enlace directo a la imagen (URL) *
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              {photoUrl && (
                <div className="w-full h-36 rounded-lg overflow-hidden border border-slate-300">
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
            <span className="text-[11px] text-slate-400 flex-shrink-0">Ejemplos rápidos:</span>
            {SAMPLE_PRESETS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPhotoUrl(sample.url);
                  setTitle(sample.title);
                  setCategory(sample.category);
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 flex-shrink-0 transition-colors cursor-pointer"
              >
                + {sample.title.slice(0, 26)}...
              </button>
            ))}
          </div>

          {/* Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Título de la Foto *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Golazo de volea de Pedro sobre la bocina"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fecha de la Foto *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Categoría de la foto *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManagingCategories(!isManagingCategories);
                  setEditingCatName(null);
                  setDeleteConfirmCat(null);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                title="Editar, renombrar o añadir nuevas categorías"
              >
                <Tag className="w-3.5 h-3.5" />
                {isManagingCategories ? 'Listo (guardar selección)' : 'Editar categorías'}
              </button>
            </div>

            {!isManagingCategories ? (
              /* Normal mode: category selector pills */
              <div className="flex flex-wrap gap-2">
                {photoCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsManagingCategories(true)}
                  className="py-1.5 px-2.5 text-xs font-semibold rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Añadir una nueva categoría"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva
                </button>
              </div>
            ) : (
              /* Management mode: rename, delete, add categories */
              <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Editar categorías ({photoCategories.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Haz clic en el lápiz para renombrar
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {photoCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
                    >
                      {editingCatName === cat ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editCatInput}
                            onChange={(e) => setEditCatInput(e.target.value)}
                            className="flex-1 bg-slate-50 border border-blue-400 rounded-md px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditCategory(cat);
                              } else if (e.key === 'Escape') {
                                setEditingCatName(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditCategory(cat)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Guardar nombre"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatName(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              onClick={() => setCategory(cat)}
                              className={`font-semibold truncate cursor-pointer hover:underline ${
                                category === cat ? 'text-blue-600 font-bold' : 'text-slate-700'
                              }`}
                              title="Seleccionar para esta foto"
                            >
                              {cat}
                            </span>
                            {category === cat && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold shrink-0">
                                seleccionada
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {deleteConfirmCat === cat ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                                <span className="text-[10px] text-red-600 font-bold">¿Borrar?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-1.5 py-0.5 rounded cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCat(null)}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 px-1 rounded cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatName(cat);
                                    setEditCatInput(cat);
                                    setDeleteConfirmCat(null);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Renombrar categoría"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCat(cat)}
                                  disabled={photoCategories.length <= 1}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded transition-colors cursor-pointer"
                                  title={
                                    photoCategories.length <= 1
                                      ? 'Debe quedar al menos una categoría'
                                      : 'Eliminar categoría'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline add input */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    placeholder="Nueva categoría (ej: Tercer Tiempo, Goles...)"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCatInput.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Anécdota / Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles divertidos del partidillo, anécdotas o jugadas destacadas..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
            {isEditing && photoToEdit ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-semibold text-red-700">¿Eliminar esta foto?</span>
                  <button
                    type="button"
                    onClick={() => {
                      deletePhoto(photoToEdit.id);
                      setConfirmDelete(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Foto
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCompressing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {isCompressing ? 'Optimizando...' : isEditing ? 'Guardar Cambios' : 'Publicar Foto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

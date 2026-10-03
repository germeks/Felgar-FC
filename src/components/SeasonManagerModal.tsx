import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { X, Plus, Trash2, Edit2, Check, Calendar, AlertCircle } from 'lucide-react';

interface SeasonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSeason?: (season: string) => void;
}

export const SeasonManagerModal: React.FC<SeasonManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectSeason,
}) => {
  const { seasons, matches, addSeason, updateSeason, deleteSeason } = useClub();
  const [newSeasonName, setNewSeasonName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmSeason, setDeleteConfirmSeason] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSeasonName.trim();
    if (!clean) return;
    if (seasons.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg('Esa temporada ya existe en el listado.');
      return;
    }
    addSeason(clean);
    setNewSeasonName('');
    setErrorMsg('');
    if (onSelectSeason) {
      onSelectSeason(clean);
    }
  };

  const handleStartEdit = (season: string, index: number) => {
    setEditingIndex(index);
    setEditName(season);
    setErrorMsg('');
  };

  const handleSaveEdit = (oldName: string) => {
    const clean = editName.trim();
    if (!clean) return;
    if (clean !== oldName && seasons.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg('Ya existe otra temporada con ese nombre.');
      return;
    }
    updateSeason(oldName, clean);
    setEditingIndex(null);
    setEditName('');
    setErrorMsg('');
  };

  const handleDelete = (season: string) => {
    deleteSeason(season);
    setDeleteConfirmSeason(null);
  };

  // Count matches per season
  const getMatchCount = (season: string) => {
    return matches.filter((m) => m.season === season).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-slate-900 leading-tight">
                Gestión de Temporadas
              </h2>
              <p className="text-xs text-slate-500">
                Crea o modifica los periodos para agrupar partidos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Add Season Input */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Añadir Nueva Temporada o Torneo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSeasonName}
                onChange={(e) => {
                  setNewSeasonName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Ej. Temporada 26/27, Apertura 2026, Torneo Verano..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newSeasonName.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* List of Seasons */}
          <div className="space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Temporadas Existentes ({seasons.length})
            </span>

            <div className="space-y-2">
              {seasons.map((season, index) => {
                const count = getMatchCount(season);
                const isEditingThis = editingIndex === index;

                return (
                  <div
                    key={season + index}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    {isEditingThis ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-white border border-blue-500 rounded-lg px-2.5 py-1 text-sm text-slate-900 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(season)}
                          className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="Guardar cambio"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIndex(null);
                            setEditName('');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {season}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-medium whitespace-nowrap">
                          {count} {count === 1 ? 'partido' : 'partidos'}
                        </span>
                      </div>
                    )}

                    {!isEditingThis && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onSelectSeason && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSeason(season);
                              onClose();
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer mr-1"
                          >
                            Seleccionar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(season, index)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                          title="Renombrar temporada"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmSeason === season ? (
                          <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                            <span className="text-[11px] font-semibold text-red-600">¿Borrar?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(season)}
                              className="text-[11px] font-bold text-red-700 hover:underline px-1 cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSeason(null)}
                              className="text-[11px] text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSeason(season)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title="Eliminar temporada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

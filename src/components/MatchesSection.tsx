import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Match } from '../types';
import { AddMatchModal } from './AddMatchModal';
import { Plus, Calendar, MapPin, Award, Search, Trash2, Flame, ArrowRight, Camera, X } from 'lucide-react';

export const MatchesSection: React.FC = () => {
  const { matches, deleteMatch, stats, isAdmin } = useClub();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<'all' | 'blue' | 'white' | 'draw'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filter logic
  const filteredMatches = matches.filter((match) => {
    if (selectedOutcome === 'blue' && match.goalsBlue <= match.goalsWhite) return false;
    if (selectedOutcome === 'white' && match.goalsWhite <= match.goalsBlue) return false;
    if (selectedOutcome === 'draw' && match.goalsBlue !== match.goalsWhite) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = match.title.toLowerCase().includes(q);
      const matchLoc = match.location.toLowerCase().includes(q);
      const blueScorer = match.scorersBlue.some((s) => s.playerName.toLowerCase().includes(q));
      const whiteScorer = match.scorersWhite.some((s) => s.playerName.toLowerCase().includes(q));
      const matchMvp = match.mvp ? match.mvp.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchLoc && !blueScorer && !whiteScorer && !matchMvp) return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const dateObj = new Date(year, month, day);
        return dateObj.toLocaleDateString('es-ES', {
          weekday: 'short',
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

  const getWinnerBadge = (m: Match) => {
    if (m.goalsBlue > m.goalsWhite) {
      return {
        label: 'VICTORIA AZULES',
        bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      };
    }
    if (m.goalsWhite > m.goalsBlue) {
      return {
        label: 'VICTORIA BLANCOS',
        bg: 'bg-slate-200/20 text-slate-100 border-slate-300/40',
      };
    }
    return {
      label: 'TABLAS (EMPATE)',
      bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-blue-400" />
              El Gran Clásico de Amigos
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Historial de Pachangas: <span className="text-blue-400">Azules</span> vs <span className="text-slate-100">Blancos</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Aquí no jugamos contra nadie de fuera: somos amigos divididos en dos bandos. Todos los lunes a las 22:00 en el Polideportivo Vicente del Bosque. Registra cada partidillo con sus goles, anécdotas y fotos de la jornada.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="self-start md:self-auto flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Añadir Pachanga</span>
            </button>
          )}
        </div>

        {/* Global Head to Head Tracker */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pachangas</span>
            <span className="font-display font-black text-2xl text-white">{stats.totalMatches}</span>
          </div>

          <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/30 text-center">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">🔵 Victorias Azules</span>
            <span className="font-display font-black text-2xl text-blue-300">{stats.blueWins}</span>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 text-center">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">⚪ Victorias Blancos</span>
            <span className="font-display font-black text-2xl text-slate-100">{stats.whiteWins}</span>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">Empates</span>
            <span className="font-display font-black text-2xl text-amber-400">{stats.draws}</span>
          </div>

          <div className="bg-blue-950/30 p-3.5 rounded-xl border border-blue-900/50 text-center">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">Goles Azules</span>
            <span className="font-display font-black text-2xl text-blue-400">{stats.goalsBlue}</span>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">Goles Blancos</span>
            <span className="font-display font-black text-2xl text-white">{stats.goalsWhite}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por amigo, goleador o anécdota..."
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedOutcome('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedOutcome === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({matches.length})
          </button>
          <button
            onClick={() => setSelectedOutcome('blue')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedOutcome === 'blue'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-blue-400 hover:bg-blue-900/30'
            }`}
          >
            🔵 Victorias Azules ({stats.blueWins})
          </button>
          <button
            onClick={() => setSelectedOutcome('white')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedOutcome === 'white'
                ? 'bg-slate-200 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            ⚪ Victorias Blancos ({stats.whiteWins})
          </button>
          <button
            onClick={() => setSelectedOutcome('draw')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
              selectedOutcome === 'draw'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            Empates ({stats.draws})
          </button>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No se encontraron pachangas</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            No hay partidos registrados que coincidan con la búsqueda o filtro seleccionado.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Añadir Primera Pachanga
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const badge = getWinnerBadge(match);

            return (
              <div
                key={match.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl"
              >
                {/* Match Header Bar */}
                <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {formatDate(match.date)}
                    </span>
                    {match.time && <span className="text-slate-400">• {match.time} h</span>}
                    <span className="text-slate-600">|</span>
                    <span className="font-semibold text-slate-300">{match.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    {/* Delete button (Admin Only) */}
                    {isAdmin && (
                      confirmDeleteId === match.id ? (
                        <div className="flex items-center gap-1 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
                          <span className="text-[10px] text-red-300">¿Borrar?</span>
                          <button
                            onClick={() => {
                              deleteMatch(match.id);
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
                          onClick={() => setConfirmDeleteId(match.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                          title="Eliminar esta pachanga"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Scoreboard display */}
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4">
                    {/* Equipo Azul */}
                    <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3 order-1 md:order-1">
                      <div className="flex flex-col md:items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="font-display font-black text-xl text-blue-400 tracking-wide">
                            EQUIPO AZUL
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {match.scorersBlue.length} goles anotados
                        </span>
                      </div>
                    </div>

                    {/* Result Center */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center order-3 md:order-2 bg-slate-950/90 py-3 px-6 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-4">
                        <span className={`font-display font-black text-4xl ${
                          match.goalsBlue > match.goalsWhite ? 'text-blue-400' : 'text-slate-300'
                        }`}>
                          {match.goalsBlue}
                        </span>
                        <span className="text-slate-600 font-black text-2xl">:</span>
                        <span className={`font-display font-black text-4xl ${
                          match.goalsWhite > match.goalsBlue ? 'text-white' : 'text-slate-400'
                        }`}>
                          {match.goalsWhite}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                        Pachanga Finalizada
                      </span>
                    </div>

                    {/* Equipo Blanco */}
                    <div className="md:col-span-4 flex items-center justify-start gap-3 order-2 md:order-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-100" />
                          <span className="font-display font-black text-xl text-slate-100 tracking-wide">
                            EQUIPO BLANCO
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {match.scorersWhite.length} goles anotados
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scorers Section */}
                  <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Goleadores Azules */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <span>⚽ Goleadores de los Azules</span>
                        <span className="text-slate-500 font-normal">({match.scorersBlue.length})</span>
                      </span>
                      {match.scorersBlue.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Sin goles en este partidillo</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {match.scorersBlue.map((s, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/25"
                            >
                              <span>⚽ {s.playerName}</span>
                              {s.minute && <span className="text-[10px] text-blue-400">({s.minute}')</span>}
                              {s.type && s.type !== 'Golazo' && (
                                <span className="text-[10px] text-slate-400 font-normal">[{s.type}]</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Goleadores Blancos */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span>⚽ Goleadores de los Blancos</span>
                        <span className="text-slate-500 font-normal">({match.scorersWhite.length})</span>
                      </span>
                      {match.scorersWhite.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Sin goles en este partidillo</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {match.scorersWhite.map((s, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700"
                            >
                              <span>⚽ {s.playerName}</span>
                              {s.minute && <span className="text-[10px] text-slate-400">({s.minute}')</span>}
                              {s.type && s.type !== 'Golazo' && (
                                <span className="text-[10px] text-slate-400 font-normal">[{s.type}]</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location & Notes */}
                  <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-col gap-2.5 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      {match.location && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {match.location}
                        </span>
                      )}
                    </div>

                    {match.notes && (
                      <p className="text-slate-300 italic text-[11px] bg-slate-950/30 p-2 rounded border border-slate-800/40">
                        "{match.notes}"
                      </p>
                    )}

                    {/* Attached Match Photo */}
                    {match.imageUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                          <Camera className="w-3.5 h-3.5 text-blue-400" />
                          <span>Foto del Partidillo</span>
                        </div>
                        <div
                          onClick={() => setPreviewPhotoUrl(match.imageUrl!)}
                          className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950/50 max-w-sm h-44 cursor-pointer"
                        >
                          <img
                            src={match.imageUrl}
                            alt={`Foto de ${match.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5" /> Ver en Grande
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to add match */}
      <AddMatchModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Modal Lightbox for match photo */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Foto de pachanga"
              className="w-auto h-auto max-h-[85vh] max-w-full object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

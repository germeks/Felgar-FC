import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Player } from '../types';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { AddPlayerModal } from './AddPlayerModal';
import { Trophy, Plus, Search, Users, Trash2, Edit2, ChevronRight, Activity, Flame } from 'lucide-react';

export const PlayersSection: React.FC = () => {
  const { players, deletePlayer, isAdmin } = useClub();

  const [selectedSide, setSelectedSide] = useState<'all' | 'Azules' | 'Blancos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    if (selectedSide !== 'all' && p.preferredSide !== selectedSide) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchNickname = p.nickname ? p.nickname.toLowerCase().includes(q) : false;
      if (!matchName && !matchNickname) return false;
    }
    return true;
  });

  // Top scorers (Pichichis de la peña)
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 6);

  const handleEdit = (p: Player) => {
    setSelectedPlayer(null);
    setPlayerToEdit(p);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 md:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              La Peña de Amigos
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              Estadísticas y Jugadores de <span className="text-blue-400">Felgar FC</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Aquí tienes a toda la plantilla de amigos. Puedes añadir tantos jugadores nuevos como quieras, sin ningún límite. Haz clic en cualquiera para ver su historial de goles y partidos.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setPlayerToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="self-start md:self-auto flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Añadir Nuevo Jugador (Sin límites)</span>
            </button>
          )}
        </div>
      </div>

      {/* Pichichi / Máximos Goleadores (Tabla de Pichichis) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 md:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                Tabla de Máximos Goleadores (Pichichis)
              </h3>
              <p className="text-xs text-slate-400">
                Los mayores artilleros de las pachangas de Felgar FC
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Bota de Oro de la Peña
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topScorers.map((p, index) => (
            <div
              key={p.id}
              onClick={() => setSelectedPlayer(p)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs flex-shrink-0 ${
                  index === 0
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                    : index === 1
                    ? 'bg-slate-300 text-slate-950'
                    : index === 2
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                      {p.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex-shrink-0 ${
                      p.preferredSide === 'Azules' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-200/20 text-slate-200'
                    }`}>
                      {p.preferredSide === 'Azules' ? 'Azul' : 'Blanco'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium block truncate">
                    {p.matchesPlayed} pachangas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                <div className="text-right">
                  <span className="font-display font-black text-xl text-blue-400 block leading-none">
                    {p.goals}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Goles
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
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
            placeholder="Buscar amigo por nombre o dorsal..."
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

        {/* Side filter, view mode & Add button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Side filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedSide('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({players.length})
            </button>
            <button
              onClick={() => setSelectedSide('Azules')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'Azules'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-blue-400 hover:bg-blue-900/30'
              }`}
            >
              🔵 Azules
            </button>
            <button
              onClick={() => setSelectedSide('Blancos')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'Blancos'
                  ? 'bg-slate-200 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ⚪ Blancos
            </button>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabla Completa
            </button>
          </div>

          {/* Quick Add Player Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => {
                setPlayerToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Jugador</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredPlayers.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No se encontraron amigos</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No hay jugadores que coincidan con la búsqueda o el filtro seleccionado.
          </p>
          <button
            onClick={() => {
              setPlayerToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Inscribir Nuevo Amigo
          </button>
        </div>
      )}

      {/* Players View: Cards Grid */}
      {viewMode === 'cards' && filteredPlayers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Photo Header */}
                <div
                  onClick={() => setSelectedPlayer(player)}
                  className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                  {/* Preferred Side Pill */}
                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold border backdrop-blur-xs ${
                    player.preferredSide === 'Azules'
                      ? 'bg-blue-900/80 text-blue-300 border-blue-500/40'
                      : 'bg-slate-900/80 text-slate-100 border-slate-600'
                  }`}>
                    {player.preferredSide === 'Azules' ? '🔵 Azules' : '⚪ Blancos'}
                  </div>

                  {/* Player Name Overlay */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-blue-300 transition-colors leading-snug">
                      {player.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {player.age ? `${player.age} años • ` : ''}Equipo {player.preferredSide || 'Azules'}
                    </span>
                  </div>
                </div>

                {/* Stats row: Pachangas, Goles, Asistencias */}
                <div className="p-4 grid grid-cols-3 gap-2 text-center border-t border-slate-800/80 bg-slate-950/40">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Pachangas</span>
                    <span className="font-display font-black text-base text-white">{player.matchesPlayed}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-blue-500/30">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block">Goles</span>
                    <span className="font-display font-black text-base text-blue-400">{player.goals}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Asistencias</span>
                    <span className="font-display font-black text-base text-slate-200">{player.assists}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Ver Historial
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(player)}
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Editar datos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteId === player.id ? (
                      <div className="flex items-center gap-1 bg-red-950 px-1.5 py-0.5 rounded border border-red-500/30">
                        <button
                          onClick={() => {
                            deletePlayer(player.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-[10px] text-red-400 font-bold hover:text-red-200 cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-slate-400 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(player.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Eliminar amigo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Players View: Table View */}
      {viewMode === 'table' && filteredPlayers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Amigo</th>
                  <th className="py-3 px-4">Bando Habitual</th>
                  <th className="py-3 px-4 text-center">Pachangas</th>
                  <th className="py-3 px-4 text-center">Goles</th>
                  <th className="py-3 px-4 text-center">Asistencias</th>
                  <th className="py-3 px-4 text-center">MVPs</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                          <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="font-bold text-white hover:text-blue-400 transition-colors block">
                            {player.name}
                          </span>
                          {player.age && (
                            <span className="text-[11px] text-slate-400">
                              {player.age} años
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        player.preferredSide === 'Azules' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-200/20 text-slate-200'
                      }`}>
                        {player.preferredSide || 'Azules'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-white">
                      {player.matchesPlayed}
                    </td>
                    <td className="py-3 px-4 text-center font-display font-black text-sm text-blue-400">
                      {player.goals}
                    </td>
                    <td className="py-3 px-4 text-center font-display font-black text-sm text-slate-300">
                      {player.assists}
                    </td>
                    <td className="py-3 px-4 text-center font-display font-black text-sm text-amber-400">
                      {player.mvps}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPlayer(player)}
                          className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 font-semibold cursor-pointer"
                        >
                          Historial
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(player)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Editar datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PlayerDetailsModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onEdit={(p) => handleEdit(p)}
      />

      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPlayerToEdit(null);
        }}
        playerToEdit={playerToEdit}
      />
    </div>
  );
};

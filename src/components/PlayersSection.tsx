import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Player } from '../types';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { AddPlayerModal } from './AddPlayerModal';
import {
  Trophy,
  Plus,
  Search,
  Users,
  Trash2,
  Edit2,
  ChevronRight,
  Activity,
  Flame,
  Cake,
  Crop,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { isBirthdayToday, calculateAge, formatBirthDate, getPlayerDisplayAge } from '../utils/birthdayUtils';
import { getPlayerPhotoStyle } from '../utils/photoUtils';

type SortField = 'name' | 'preferredSide' | 'age' | 'matchesPlayed' | 'bagaje' | 'goals' | 'average';
type SortOrder = 'asc' | 'desc';

const sortFieldLabels: Record<SortField, string> = {
  goals: 'Goles',
  matchesPlayed: 'Pachangas jugadas',
  bagaje: 'Bagaje de resultados (G-E-P)',
  average: 'Promedio de goles',
  name: 'Nombre de jugador',
  preferredSide: 'Bando habitual',
  age: 'Edad',
};

export const PlayersSection: React.FC = () => {
  const { players, matches, deletePlayer, isAdmin, syncAllPlayerStats } = useClub();

  const [selectedSide, setSelectedSide] = useState<'all' | 'Azules' | 'Blancos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSyncStats = async () => {
    setIsSyncing(true);
    try {
      await syncAllPlayerStats();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (e) {
      console.error('Error syncing stats:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sorting state for table view
  const [sortField, setSortField] = useState<SortField>('goals');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Alphabetical / categorical fields default to ascending (A-Z)
      if (field === 'name' || field === 'preferredSide') {
        setSortOrder('asc');
      } else {
        // Numeric stats default to descending (highest first)
        setSortOrder('desc');
      }
    }
  };

  // Sorted players for table view
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let result = 0;
    if (sortField === 'name') {
      result = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    } else if (sortField === 'preferredSide') {
      result = (a.preferredSide || '').localeCompare(b.preferredSide || '', 'es');
    } else if (sortField === 'age') {
      const ageA = getPlayerDisplayAge(a) ?? 0;
      const ageB = getPlayerDisplayAge(b) ?? 0;
      result = ageA - ageB;
    } else if (sortField === 'matchesPlayed') {
      result = (a.matchesPlayed || 0) - (b.matchesPlayed || 0);
    } else if (sortField === 'bagaje') {
      // Prioritize wins, then draws, then least losses
      const pointsA = (a.wins || 0) * 3 + (a.draws || 0);
      const pointsB = (b.wins || 0) * 3 + (b.draws || 0);
      if (pointsA !== pointsB) {
        result = pointsA - pointsB;
      } else {
        result = (a.wins || 0) - (b.wins || 0);
      }
    } else if (sortField === 'goals') {
      result = (a.goals || 0) - (b.goals || 0);
    } else if (sortField === 'average') {
      const avgA = a.matchesPlayed > 0 ? a.goals / a.matchesPlayed : 0;
      const avgB = b.matchesPlayed > 0 ? b.goals / b.matchesPlayed : 0;
      result = avgA - avgB;
    }

    return sortOrder === 'asc' ? result : -result;
  });

  // Top scorers (Pichichis del equipo)
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 6);

  const handleEdit = (p: Player) => {
    setSelectedPlayer(null);
    setPlayerToEdit(p);
    setIsAddModalOpen(true);
  };

  const renderSortTh = (
    field: SortField,
    label: string,
    align: 'left' | 'center' | 'right' = 'left',
    subtitle?: string
  ) => {
    const isActive = sortField === field;
    return (
      <th
        key={field}
        onClick={() => handleSort(field)}
        className={`py-3 px-3.5 cursor-pointer select-none transition-all duration-150 group ${
          align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
        } ${
          isActive
            ? 'bg-blue-50/90 text-blue-800 font-bold border-b-2 border-blue-600'
            : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900'
        }`}
        title={`Ordenar por ${label} (${
          isActive
            ? sortOrder === 'asc'
              ? 'actual: Ascendente, pulsa para Descendente'
              : 'actual: Descendente, pulsa para Ascendente'
            : 'pulsa para ordenar'
        })`}
      >
        <div
          className={`inline-flex items-center gap-1.5 ${
            align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-bold tracking-normal text-xs">{label}</span>
            {subtitle && <span className="text-[9px] font-normal text-slate-400">{subtitle}</span>}
          </div>
          <span className="flex-shrink-0">
            {isActive ? (
              sortOrder === 'asc' ? (
                <span className="inline-flex p-0.5 rounded bg-blue-100 text-blue-700">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              ) : (
                <span className="inline-flex p-0.5 rounded bg-blue-100 text-blue-700">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-slate-600 transition-opacity" />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Plantilla de Jugadores
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Estadísticas sincronizadas con las {matches.length} pachangas
              </div>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Estadísticas y Jugadores de <span className="text-blue-400">Felgar FC</span>
            </h1>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSyncStats}
                disabled={isSyncing}
                title="Recalcula las estadísticas de todos los jugadores a partir de las pachangas y las guarda en la nube"
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer"
              >
                <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncSuccess ? '✓ ¡Sincronizado!' : 'Recalcular con Pachangas'}</span>
              </button>
              <button
                onClick={() => {
                  setPlayerToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm bg-blue-400 hover:bg-blue-300 text-slate-900 shadow-lg shadow-blue-400/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Añadir Nuevo Jugador</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pichichi / Máximos Goleadores (Tabla de Pichichis) */}
      <div className="bg-white/90 rounded-2xl border border-slate-200 p-5 md:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Tabla de Máximos Goleadores (Pichichis)
              </h3>
              <p className="text-xs text-slate-400">
                Los mayores artilleros de las pachangas de Felgar FC
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> Bota de Oro
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topScorers.map((p, index) => (
            <div
              key={p.id}
              onClick={() => setSelectedPlayer(p)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs flex-shrink-0 ${
                  index === 0
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                    : index === 1
                    ? 'bg-slate-300 text-slate-950'
                    : index === 2
                    ? 'bg-amber-700 text-slate-900'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {index + 1}
                </span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={p.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    style={getPlayerPhotoStyle(p)}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors"
                      title={p.nickname ? `${p.name} ("${p.nickname}")` : p.name}
                    >
                      {p.nickname ? p.nickname : p.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex-shrink-0 ${
                      p.preferredSide === 'Azules' ? 'bg-blue-500/20 text-blue-700' : 'bg-slate-200/20 text-slate-700'
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
      <div className="bg-white/90 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar jugador por nombre o dorsal..."
            className="w-full bg-slate-50 border border-slate-300/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-900 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Side filter, view mode & Add button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Side filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedSide('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'all'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({players.length})
            </button>
            <button
              onClick={() => setSelectedSide('Azules')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'Azules'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-blue-700 hover:bg-blue-100/50'
              }`}
            >
              🔵 Azules
            </button>
            <button
              onClick={() => setSelectedSide('Blancos')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedSide === 'Blancos'
                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              ⚪ Blancos
            </button>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-900'
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-400 hover:bg-blue-300 text-slate-900 shadow-md shadow-blue-400/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Jugador</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredPlayers.length === 0 && (
        <div className="text-center py-16 bg-white/40 rounded-2xl border border-dashed border-slate-200 p-8">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No se encontraron jugadores</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            No hay jugadores que coincidan con la búsqueda o el filtro seleccionado.
          </p>
          <button
            onClick={() => {
              setPlayerToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-400 text-slate-900 hover:bg-blue-300 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Inscribir Nuevo Jugador
          </button>
        </div>
      )}

      {/* Players View: Cards Grid */}
      {viewMode === 'cards' && sortedPlayers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPlayers.map((player) => {
            const isBirthday = isBirthdayToday(player.birthDate);
            const displayAge = getPlayerDisplayAge(player);

            return (
              <div
                key={player.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl flex flex-col justify-between group ${
                  isBirthday
                    ? 'border-amber-400 ring-2 ring-amber-300/50'
                    : 'border-slate-200 hover:border-blue-500/50'
                }`}
              >
                <div>
                  {/* Photo Header with generous vertical room for full head & chest */}
                  <div
                    onClick={() => setSelectedPlayer(player)}
                    className="relative h-64 sm:h-72 bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={getPlayerPhotoStyle(player)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
                      }}
                    />
                    {/* Compact bottom gradient for text readability without covering chest */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />

                    {/* Quick photo adjustment button on hover */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(player);
                        }}
                        className="absolute bottom-14 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-md border border-slate-200 flex items-center gap-1 cursor-pointer z-20"
                        title="Ajustar encuadre de la foto"
                      >
                        <Crop className="w-3 h-3 text-blue-500" />
                        <span>Ajustar encuadre</span>
                      </button>
                    )}

                    {/* Birthday Badge if today */}
                    {isBirthday && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border border-amber-300 shadow-md flex items-center gap-1 animate-bounce">
                        <span>🎂</span> ¡CUMPLEAÑOS!
                      </div>
                    )}

                    {/* Preferred Side Pill */}
                    <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold border shadow-sm ${
                      player.preferredSide === 'Azules'
                        ? 'bg-white text-blue-700 border-blue-200'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}>
                      {player.preferredSide === 'Azules' ? '🔵 Azules' : '⚪ Blancos'}
                    </div>

                    {/* Player Name Overlay */}
                    <div className="absolute bottom-2 left-3 right-3 z-20">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                          {player.name}
                        </h3>
                        {player.nickname && (
                          <span className="text-xs text-blue-600 font-semibold">
                            "{player.nickname}"
                          </span>
                        )}
                        {isBirthday && <span title="¡Hoy es su cumpleaños!">🎉</span>}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 block truncate">
                        {displayAge ? `${displayAge} años` : '-'}
                        {player.birthDate ? ` (${formatBirthDate(player.birthDate, false)})` : ''}
                        {' • '}
                        Equipo {player.preferredSide || 'Azules'}
                      </span>
                    </div>
                  </div>

                  {/* Stats row: Pachangas, Goles */}
                  <div className="p-4 grid grid-cols-2 gap-3 text-center border-t border-slate-200/80 bg-slate-50/40">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Pachangas</span>
                      <span className="font-display font-black text-lg text-slate-900 leading-none">{player.matchesPlayed}</span>
                      <span
                        className="text-[10px] font-mono font-bold block mt-1 tracking-tight"
                        title={`${player.wins || 0} Ganados · ${player.draws || 0} Empatados · ${player.losses || 0} Perdidos`}
                      >
                        <span className="text-emerald-700">{player.wins || 0}G</span>
                        <span className="text-slate-300 mx-0.5">-</span>
                        <span className="text-amber-700">{player.draws || 0}E</span>
                        <span className="text-slate-300 mx-0.5">-</span>
                        <span className="text-rose-700">{player.losses || 0}P</span>
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-xs flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-bold text-blue-600 block mb-0.5">Goles</span>
                      <span className="font-display font-black text-lg text-blue-600 leading-none">{player.goals}</span>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {player.matchesPlayed > 0 ? (player.goals / player.matchesPlayed).toFixed(2) : '0.00'} / PJ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedPlayer(player)}
                  className="font-semibold text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Ver Historial
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(player)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                      title="Ajustar encuadre de la foto"
                    >
                      <Crop className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleEdit(player)}
                      className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors cursor-pointer"
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
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                        title="Eliminar jugador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Players View: Table View */}
      {viewMode === 'table' && sortedPlayers.length > 0 && (
        <div className="space-y-3">
          {/* Full Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 divide-x divide-slate-100">
                  <tr>
                    {renderSortTh('name', 'Jugador', 'left')}
                    {renderSortTh('preferredSide', 'Bando', 'center')}
                    {renderSortTh('age', 'Edad', 'center')}
                    {renderSortTh('matchesPlayed', 'Pachangas', 'center')}
                    {renderSortTh('bagaje', 'Bagaje', 'center', 'G - E - P')}
                    {renderSortTh('goals', 'Goles', 'center')}
                    {renderSortTh('average', 'Promedio', 'center', 'Goles / PJ')}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {sortedPlayers.map((player, idx) => {
                    const isBirthday = isBirthdayToday(player.birthDate);
                    const displayAge = getPlayerDisplayAge(player);

                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                          isBirthday ? 'bg-amber-50/50' : idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        {/* Jugador */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border ${
                                isBirthday ? 'border-amber-400 ring-2 ring-amber-300' : 'border-slate-300'
                              }`}
                            >
                              <img
                                src={player.photoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                style={getPlayerPhotoStyle(player)}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors block">
                                  {player.name}
                                </span>
                                {player.nickname && (
                                  <span className="text-[11px] text-blue-600 font-medium">
                                    "{player.nickname}"
                                  </span>
                                )}
                                {isBirthday && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded shadow-xs">
                                    <Cake className="w-2.5 h-2.5" /> ¡Hoy!
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {player.birthDate ? formatBirthDate(player.birthDate, false) : '-'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Bando */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              player.preferredSide === 'Azules'
                                ? 'bg-blue-500/15 text-blue-700 border border-blue-200'
                                : 'bg-slate-200/60 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {player.preferredSide === 'Azules' ? '🔵 Azules' : '⚪ Blancos'}
                          </span>
                        </td>

                        {/* Edad */}
                        <td className="py-3 px-4 text-center font-medium text-slate-700">
                          {displayAge ? `${displayAge} años` : '-'}
                        </td>

                        {/* Pachangas */}
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {player.matchesPlayed}
                        </td>

                        {/* Bagaje de Resultados (G - E - P) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <div
                              className="inline-flex items-center gap-1 font-mono font-bold text-xs"
                              title={`${player.wins || 0} Ganados · ${player.draws || 0} Empatados · ${player.losses || 0} Perdidos`}
                            >
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200" title={`${player.wins || 0} Ganados`}>
                                {player.wins || 0}G
                              </span>
                              <span className="text-slate-300">-</span>
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title={`${player.draws || 0} Empatados`}>
                                {player.draws || 0}E
                              </span>
                              <span className="text-slate-300">-</span>
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title={`${player.losses || 0} Perdidos`}>
                                {player.losses || 0}P
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-semibold tracking-wider mt-0.5" title="Ganados - Empatados - Perdidos">
                              {player.wins || 0}-{player.draws || 0}-{player.losses || 0}
                            </span>
                          </div>
                        </td>

                        {/* Goles */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center font-display font-black text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            {player.goals}
                          </span>
                        </td>

                        {/* Promedio */}
                        <td className="py-3 px-4 text-center font-display font-bold text-xs text-emerald-700">
                          {player.matchesPlayed > 0
                            ? (player.goals / player.matchesPlayed).toFixed(2)
                            : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                Mostrando <strong>{sortedPlayers.length}</strong> jugadores ordenados por{' '}
                <strong className="text-blue-700">{sortFieldLabels[sortField]}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                💡 Haz clic en la cabecera de cualquier columna para ordenar ascendente o descendente
              </span>
            </div>
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

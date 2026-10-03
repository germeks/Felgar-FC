import React, { useState, useMemo } from 'react';
import { useClub } from '../context/ClubContext';
import { Match } from '../types';
import { AddMatchModal } from './AddMatchModal';
import { SeasonManagerModal } from './SeasonManagerModal';
import { groupScorers, getScorerPlayerName, getPlayerDisplayName } from '../utils/statsUtils';
import { Plus, Calendar, MapPin, Award, Search, Trash2, Edit2, Flame, ArrowRight, Camera, X, Layers, Settings, Trophy, CheckCircle2, Newspaper, LayoutGrid, Table as TableIcon, Users } from 'lucide-react';
import { getPlayerPhotoStyle } from '../utils/photoUtils';

export const MatchesSection: React.FC = () => {
  const { matches, players, deleteMatch, stats, seasons, isAdmin, chronicles, openChronicle } = useClub();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<'all' | 'blue' | 'white' | 'draw'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'playerBagaje'>('cards');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);

  // Active matches according to season selection
  const seasonFilteredMatches = useMemo(() => {
    if (selectedSeason === 'all') return matches;
    return matches.filter((m) => (m.season || 'Temporada 25/26') === selectedSeason);
  }, [matches, selectedSeason]);

  // Chronological cumulative H2H bagaje (Azules - Empates - Blancos) for each match
  const cumulativeBagajeByMatchId = useMemo(() => {
    const sortedChronological = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const map: Record<string, { blueWins: number; draws: number; whiteWins: number; recordStr: string }> = {};

    let blue = 0;
    let draws = 0;
    let white = 0;

    sortedChronological.forEach((m) => {
      if (m.goalsBlue > m.goalsWhite) blue++;
      else if (m.goalsWhite > m.goalsBlue) white++;
      else draws++;

      map[m.id] = {
        blueWins: blue,
        draws: draws,
        whiteWins: white,
        recordStr: `${blue}-${draws}-${white}`,
      };
    });

    return map;
  }, [matches]);

  // Active players list with bagaje for the player bagaje standings view
  const playerBagajeList = useMemo(() => {
    return [...players]
      .filter((p) => p.matchesPlayed > 0)
      .sort((a, b) => {
        const pointsA = (a.wins || 0) * 3 + (a.draws || 0);
        const pointsB = (b.wins || 0) * 3 + (b.draws || 0);
        if (pointsA !== pointsB) return pointsB - pointsA;
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        return (b.goals || 0) - (a.goals || 0);
      });
  }, [players]);

  // Statistics for the selected season / period
  const activeSeasonStats = useMemo(() => {
    let blueWins = 0;
    let whiteWins = 0;
    let draws = 0;
    let goalsBlue = 0;
    let goalsWhite = 0;

    seasonFilteredMatches.forEach((m) => {
      goalsBlue += Number(m.goalsBlue) || 0;
      goalsWhite += Number(m.goalsWhite) || 0;
      if (m.goalsBlue > m.goalsWhite) blueWins++;
      else if (m.goalsWhite > m.goalsBlue) whiteWins++;
      else draws++;
    });

    return {
      totalMatches: seasonFilteredMatches.length,
      blueWins,
      whiteWins,
      draws,
      goalsBlue,
      goalsWhite,
    };
  }, [seasonFilteredMatches]);

  // Filter logic (Season + Outcome + Search)
  const filteredMatches = seasonFilteredMatches.filter((match) => {
    if (selectedOutcome === 'blue' && match.goalsBlue <= match.goalsWhite) return false;
    if (selectedOutcome === 'white' && match.goalsWhite <= match.goalsBlue) return false;
    if (selectedOutcome === 'draw' && match.goalsBlue !== match.goalsWhite) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = match.title.toLowerCase().includes(q);
      const matchLoc = match.location.toLowerCase().includes(q);
      const matchSeason = (match.season || '').toLowerCase().includes(q);
      const blueScorer = match.scorersBlue.some((s) => {
        const p = s.playerId ? players.find((pl) => pl.id === s.playerId) : null;
        return (
          getScorerPlayerName(s, players).toLowerCase().includes(q) ||
          (p && (p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q))))
        );
      });
      const whiteScorer = match.scorersWhite.some((s) => {
        const p = s.playerId ? players.find((pl) => pl.id === s.playerId) : null;
        return (
          getScorerPlayerName(s, players).toLowerCase().includes(q) ||
          (p && (p.name.toLowerCase().includes(q) || (p.nickname && p.nickname.toLowerCase().includes(q))))
        );
      });
      const matchMvp = match.mvp ? (() => {
        const mp = players.find((p) => p.id === match.mvp || p.name.toLowerCase() === match.mvp?.toLowerCase() || (p.nickname && p.nickname.toLowerCase() === match.mvp?.toLowerCase()));
        return (
          match.mvp.toLowerCase().includes(q) ||
          (mp && (mp.name.toLowerCase().includes(q) || (mp.nickname && mp.nickname.toLowerCase().includes(q))))
        );
      })() : false;
      if (!matchTitle && !matchLoc && !matchSeason && !blueScorer && !whiteScorer && !matchMvp) return false;
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
        bg: 'bg-blue-500/20 text-blue-700 border-blue-500/40',
      };
    }
    if (m.goalsWhite > m.goalsBlue) {
      return {
        label: 'VICTORIA BLANCOS',
        bg: 'bg-slate-200/20 text-slate-800 border-slate-300/40',
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
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-blue-600" />
              El Gran Clásico
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              Historial de Pachangas: <span className="text-blue-700 font-bold bg-blue-100/60 px-2 py-0.5 rounded-lg border border-blue-200">Azules</span> vs <span className="text-white font-bold bg-slate-800 shadow-sm px-2 py-0.5 rounded-lg">Blancos</span>
            </h1>
            <p className="text-slate-600 text-sm max-w-xl">
              Hace más de 30 años empezó algo que iba a durar mucho más que un partido. Un grupo de amigos, una pista, un balón y dos equipos: Azules contra Blancos. Lo que comenzó como un simple partidillo terminó convirtiéndose en una tradición que sigue reuniéndonos cada semana.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setEditingMatch(null);
                setIsAddModalOpen(true);
              }}
              className="self-start md:self-auto flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm bg-blue-400 hover:bg-blue-300 text-slate-900 shadow-lg shadow-blue-400/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Añadir Pachanga</span>
            </button>
          )}
        </div>

        {/* Global Head to Head Tracker */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
                Pachangas
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-slate-900 leading-none block">
                {activeSeasonStats.totalMatches}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider leading-tight flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                <span>Victorias Azules</span>
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-blue-700 leading-none block">
                {activeSeasonStats.blueWins}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-tight flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400 flex-shrink-0" />
                <span>Victorias Blancos</span>
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-slate-800 leading-none block">
                {activeSeasonStats.whiteWins}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider leading-tight">
                Empates
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-amber-500 leading-none block">
                {activeSeasonStats.draws}
              </span>
            </div>
          </div>

          {/* Bagaje de Resultados (G-E-P de la rivalidad) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-slate-50 to-amber-50/70 p-3 rounded-xl border border-blue-200 text-center shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider leading-tight flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span>Bagaje (G-E-P)</span>
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <div className="flex items-center justify-center gap-1 font-mono font-black text-xl text-slate-900 leading-none">
                <span className="text-blue-700" title="Victorias Azules">{activeSeasonStats.blueWins}</span>
                <span className="text-slate-400">-</span>
                <span className="text-amber-600" title="Empates">{activeSeasonStats.draws}</span>
                <span className="text-slate-400">-</span>
                <span className="text-slate-700" title="Victorias Blancos">{activeSeasonStats.whiteWins}</span>
              </div>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">
                Azules · Emp · Blancos
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider leading-tight">
                Goles Azules
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-blue-600 leading-none block">
                {activeSeasonStats.goalsBlue}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-sm flex flex-col justify-between">
            <div className="min-h-[38px] flex items-center justify-center px-1">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider leading-tight">
                Goles Blancos
              </span>
            </div>
            <div className="pt-2 pb-0.5">
              <span className="font-display font-black text-2xl text-slate-900 leading-none block">
                {activeSeasonStats.goalsWhite}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Temporadas / Periodos */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 leading-tight">
                Temporadas y Periodos
              </h2>
              <p className="text-[11px] text-slate-500">
                Selecciona una temporada para ver quién domina el marcador en ese periodo
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsSeasonModalOpen(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gestionar Temporadas</span>
            </button>
          )}
        </div>

        {/* Season Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSeason('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedSeason === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Todas las Temporadas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedSeason === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
            }`}>
              {matches.length}
            </span>
          </button>

          {seasons.map((season) => {
            const count = matches.filter((m) => (m.season || 'Temporada 25/26') === season).length;
            const isSelected = selectedSeason === season;
            return (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{season}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Season Winner / Period Balance Spotlight */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              activeSeasonStats.blueWins > activeSeasonStats.whiteWins
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : activeSeasonStats.whiteWins > activeSeasonStats.blueWins
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {selectedSeason === 'all' ? 'Balance Histórico Global' : `Balance: ${selectedSeason}`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-600">
                  {activeSeasonStats.totalMatches} {activeSeasonStats.totalMatches === 1 ? 'partido' : 'partidos'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {activeSeasonStats.totalMatches === 0 ? (
                  <span className="text-slate-500 font-normal">Aún no hay partidos disputados en esta temporada.</span>
                ) : activeSeasonStats.blueWins > activeSeasonStats.whiteWins ? (
                  <span>
                    🏆 En cabeza: <strong className="text-blue-600 font-black">Equipo Azul</strong> (+{activeSeasonStats.blueWins - activeSeasonStats.whiteWins} victorias de ventaja)
                  </span>
                ) : activeSeasonStats.whiteWins > activeSeasonStats.blueWins ? (
                  <span>
                    🏆 En cabeza: <strong className="text-slate-800 font-black">Equipo Blanco</strong> (+{activeSeasonStats.whiteWins - activeSeasonStats.blueWins} victorias de ventaja)
                  </span>
                ) : (
                  <span>
                    ⚖️ <strong className="text-amber-600 font-black">Empate total</strong> ({activeSeasonStats.blueWins} - {activeSeasonStats.whiteWins}) entre Azules y Blancos
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100/70 border border-blue-200 text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Azules: {activeSeasonStats.blueWins} ({activeSeasonStats.goalsBlue} goles)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Blancos: {activeSeasonStats.whiteWins} ({activeSeasonStats.goalsWhite} goles)</span>
            </div>
            {activeSeasonStats.draws > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <span>{activeSeasonStats.draws} emp.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters & View switcher */}
      <div className="bg-white/90 p-4 rounded-xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por jugador, goleador o anécdota..."
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

        {/* View Switcher & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View mode switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista de tarjetas completas"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tabla de pachangas con columna de bagaje"
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Tabla Pachangas</span>
            </button>
            <button
              onClick={() => setViewMode('playerBagaje')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === 'playerBagaje'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tabla de bagaje de resultados (G-E-P) de jugadores"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Bagaje Jugadores</span>
            </button>
          </div>

          {/* Filter Pills (for cards and match table) */}
          {viewMode !== 'playerBagaje' && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs overflow-x-auto">
              <button
                onClick={() => setSelectedOutcome('all')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedOutcome === 'all'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                Todas ({matches.length})
              </button>
              <button
                onClick={() => setSelectedOutcome('blue')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedOutcome === 'blue'
                    ? 'bg-blue-400 text-slate-900 font-bold'
                    : 'text-blue-600 hover:bg-blue-900/30'
                }`}
              >
                🔵 Azules ({activeSeasonStats.blueWins})
              </button>
              <button
                onClick={() => setSelectedOutcome('white')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedOutcome === 'white'
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚪ Blancos ({activeSeasonStats.whiteWins})
              </button>
              <button
                onClick={() => setSelectedOutcome('draw')}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedOutcome === 'draw'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                Empates ({activeSeasonStats.draws})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Matches List / Views */}
      {viewMode === 'playerBagaje' ? (
        /* View 3: Player Bagaje Standings in Pachangas */
        <div className="space-y-3">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong>Bagaje de Resultados por Jugador:</strong> Registro histórico de <strong>Ganados - Empatados - Perdidos (G-E-P)</strong> calculado a partir de todas las pachangas disputadas.
              </span>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 whitespace-nowrap">
              {playerBagajeList.length} jugadores activos
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 divide-x divide-slate-100">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-3 text-center">Bando</th>
                    <th className="py-3 px-3 text-center">Pachangas</th>
                    <th className="py-3 px-4 text-center bg-blue-50/40 text-blue-900 border-x border-blue-100">
                      <div className="flex flex-col items-center">
                        <span className="font-bold">Bagaje de resultados</span>
                        <span className="text-[9px] font-medium text-blue-600 lowercase tracking-normal">Ganados - Empates - Perdidos</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">% Victorias</th>
                    <th className="py-3 px-3 text-center">Goles</th>
                    <th className="py-3 px-3 text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {playerBagajeList.map((player, idx) => {
                    const winRate = player.matchesPlayed > 0 ? Math.round(((player.wins || 0) / player.matchesPlayed) * 100) : 0;
                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                      >
                        {/* Ranking */}
                        <td className="py-3 px-3 text-center font-display font-bold text-slate-500">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>

                        {/* Jugador */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-300">
                              <img
                                src={player.photoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                style={getPlayerPhotoStyle(player)}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 block">{player.name}</span>
                                {player.nickname && <span className="text-[11px] text-blue-600">"{player.nickname}"</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Bando */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              player.preferredSide === 'Azules'
                                ? 'bg-blue-500/15 text-blue-700 border border-blue-200'
                                : 'bg-slate-200/60 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {player.preferredSide === 'Azules' ? '🔵 Azules' : '⚪ Blancos'}
                          </span>
                        </td>

                        {/* Pachangas */}
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {player.matchesPlayed}
                        </td>

                        {/* Columna con bagaje de resultados tipo 3-5-4 */}
                        <td className="py-3 px-4 text-center bg-blue-50/20 border-x border-blue-100/60">
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

                        {/* % Victorias */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-xs text-slate-700">
                            {winRate}%
                          </span>
                        </td>

                        {/* Goles */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center font-display font-black text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            {player.goals}
                          </span>
                        </td>

                        {/* Promedio */}
                        <td className="py-3 px-3 text-center font-display font-bold text-xs text-emerald-700">
                          {player.matchesPlayed > 0 ? (player.goals / player.matchesPlayed).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No se encontraron pachangas</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-4">
            No hay partidos registrados que coincidan con la búsqueda o filtro seleccionado.
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingMatch(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-400 text-slate-900 hover:bg-blue-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Añadir Primera Pachanga
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* View 2: Match Table with Bagaje Column */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 divide-x divide-slate-100">
                <tr>
                  <th className="py-3 px-4">Pachanga</th>
                  <th className="py-3 px-3 text-center">Fecha</th>
                  <th className="py-3 px-3 text-center">Temporada</th>
                  <th className="py-3 px-3 text-center">Resultado</th>
                  <th className="py-3 px-3 text-center">Ganador</th>
                  <th className="py-3 px-4 text-center bg-blue-50/40 text-blue-900 border-x border-blue-100">
                    <div className="flex flex-col items-center">
                      <span className="font-bold">Bagaje acumulado</span>
                      <span className="text-[9px] font-medium text-blue-600 lowercase tracking-normal">Azul - Emp - Blanco</span>
                    </div>
                  </th>
                  <th className="py-3 px-3">MVP</th>
                  <th className="py-3 px-3">Goleadores Destacados</th>
                  {isAdmin && <th className="py-3 px-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredMatches.map((match, idx) => {
                  const badge = getWinnerBadge(match);
                  const bagaje = cumulativeBagajeByMatchId[match.id];
                  const mvpPlayer = match.mvp ? players.find(p => p.id === match.mvp || p.name.toLowerCase() === match.mvp?.toLowerCase() || (p.nickname && p.nickname.toLowerCase() === match.mvp?.toLowerCase())) : null;
                  const mvpName = mvpPlayer ? getPlayerDisplayName(mvpPlayer) : match.mvp;

                  const topBlue = match.scorersBlue.slice(0, 2).map(s => `${getScorerPlayerName(s, players)} (${s.goals})`).join(', ');
                  const topWhite = match.scorersWhite.slice(0, 2).map(s => `${getScorerPlayerName(s, players)} (${s.goals})`).join(', ');
                  const chronicle = chronicles.find((c) => c.matchId === match.id);

                  return (
                    <tr
                      key={match.id}
                      className={`hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                    >
                      {/* Pachanga */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{match.title}</span>
                          {match.imageUrl && (
                            <button
                              onClick={() => setPreviewPhotoUrl(match.imageUrl || null)}
                              className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Ver foto del partido"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {chronicle && (
                            <button
                              onClick={() => openChronicle(chronicle.id)}
                              className="text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Leer crónica del partido"
                            >
                              <Newspaper className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                        {formatDate(match.date)}
                      </td>

                      {/* Temporada */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                          {match.season || 'Temporada 25/26'}
                        </span>
                      </td>

                      {/* Marcador */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-display font-black text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white shadow-xs whitespace-nowrap">
                          <span className="text-blue-400">{match.goalsBlue}</span>
                          <span className="text-slate-400 mx-1">-</span>
                          <span className="text-slate-100">{match.goalsWhite}</span>
                        </span>
                      </td>

                      {/* Ganador */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] border whitespace-nowrap ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Columna con bagaje de resultados tipo 3-5-4 */}
                      <td className="py-3 px-4 text-center bg-blue-50/20 border-x border-blue-100/60">
                        {bagaje ? (
                          <div className="inline-flex flex-col items-center">
                            <div
                              className="inline-flex items-center gap-1 font-mono font-bold text-xs"
                              title={`Bagaje acumulado: ${bagaje.blueWins} Victorias Azules - ${bagaje.draws} Empates - ${bagaje.whiteWins} Victorias Blancos`}
                            >
                              <span className="text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200" title={`${bagaje.blueWins} Victorias Azules`}>
                                {bagaje.blueWins}A
                              </span>
                              <span className="text-slate-300">-</span>
                              <span className="text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded border border-amber-200" title={`${bagaje.draws} Empates`}>
                                {bagaje.draws}E
                              </span>
                              <span className="text-slate-300">-</span>
                              <span className="text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300" title={`${bagaje.whiteWins} Victorias Blancos`}>
                                {bagaje.whiteWins}B
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono font-semibold tracking-wider mt-0.5" title="Azules - Empates - Blancos">
                              {bagaje.recordStr}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* MVP */}
                      <td className="py-3 px-3">
                        {mvpName ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                            ⭐ {mvpName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Goleadores */}
                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                        {topBlue || topWhite ? (
                          <div className="space-y-0.5">
                            {topBlue && <div className="text-blue-700 truncate">🔵 {topBlue}</div>}
                            {topWhite && <div className="text-slate-700 truncate">⚪ {topWhite}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      {isAdmin && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingMatch(match);
                                setIsAddModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Editar esta pachanga"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {confirmDeleteId === match.id ? (
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
                                  className="text-[10px] text-slate-400 hover:text-slate-900 px-1 cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(match.id)}
                                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Eliminar esta pachanga"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const badge = getWinnerBadge(match);

            return (
              <div
                key={match.id}
                className="bg-white border border-slate-200 hover:border-slate-300/80 rounded-2xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl"
              >
                {/* Match Header Bar */}
                <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {formatDate(match.date)}
                    </span>
                    {match.time && <span className="text-slate-400">• {match.time} h</span>}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                      <Layers className="w-3 h-3 text-blue-500" />
                      {match.season || 'Temporada 25/26'}
                    </span>
                    {cumulativeBagajeByMatchId[match.id] && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-bold"
                        title="Bagaje histórico acumulado hasta esta pachanga (Azules - Empates - Blancos)"
                      >
                        <Trophy className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-slate-500 font-sans font-semibold">Bagaje:</span>
                        <span className="text-blue-700 font-black">{cumulativeBagajeByMatchId[match.id].blueWins}</span>
                        <span className="text-slate-300">-</span>
                        <span className="text-amber-600 font-black">{cumulativeBagajeByMatchId[match.id].draws}</span>
                        <span className="text-slate-300">-</span>
                        <span className="text-slate-700 font-black">{cumulativeBagajeByMatchId[match.id].whiteWins}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {match.mvp && (() => {
                      const mvpPlayer = players.find(p => p.id === match.mvp || p.name.toLowerCase() === match.mvp?.toLowerCase() || (p.nickname && p.nickname.toLowerCase() === match.mvp?.toLowerCase()));
                      const mvpName = mvpPlayer ? getPlayerDisplayName(mvpPlayer) : match.mvp;
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-900 border border-amber-300">
                          ⭐ MVP: {mvpName}
                        </span>
                      );
                    })()}

                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    {/* Edit & Delete buttons (Admin Only) */}
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingMatch(match);
                            setIsAddModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar esta pachanga"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === match.id ? (
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
                              className="text-[10px] text-slate-400 hover:text-slate-900 px-1 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(match.id)}
                            className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar esta pachanga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                          <span className="font-display font-black text-xl text-blue-600 tracking-wide">
                            EQUIPO AZUL
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Result Center */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center order-3 md:order-2 bg-slate-50/90 py-3 px-6 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-4">
                        <span className={`font-display font-black text-4xl ${
                          match.goalsBlue > match.goalsWhite ? 'text-blue-600' : 'text-slate-600'
                        }`}>
                          {match.goalsBlue}
                        </span>
                        <span className="text-slate-600 font-black text-2xl">:</span>
                        <span className={`font-display font-black text-4xl ${
                          match.goalsWhite > match.goalsBlue ? 'text-slate-900' : 'text-slate-400'
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
                          <span className="font-display font-black text-xl text-slate-800 tracking-wide">
                            EQUIPO BLANCO
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scorers Section */}
                  <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Goleadores Azules */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                        <span>⚽ Goleadores de los Azules</span>
                        <span className="text-slate-400 font-normal">
                          ({match.scorersBlue.length}{match.goalsBlue !== match.scorersBlue.length ? ` de ${match.goalsBlue}` : ''})
                        </span>
                      </span>
                      {match.scorersBlue.length === 0 && match.goalsBlue === 0 ? (
                        <p className="text-xs text-slate-400 italic">Sin goles en este partidillo</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {groupScorers(match.scorersBlue, players).map((scorer) => (
                            <span
                              key={scorer.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/25"
                            >
                              <span>{'⚽'.repeat(scorer.count)} {scorer.name}</span>
                            </span>
                          ))}
                          {match.goalsBlue > match.scorersBlue.length && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 border-dashed" title="Goles sin autor especificado">
                              <span>⚽ +{match.goalsBlue - match.scorersBlue.length} sin asignar</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Goleadores Blancos */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <span>⚽ Goleadores de los Blancos</span>
                        <span className="text-slate-400 font-normal">
                          ({match.scorersWhite.length}{match.goalsWhite !== match.scorersWhite.length ? ` de ${match.goalsWhite}` : ''})
                        </span>
                      </span>
                      {match.scorersWhite.length === 0 && match.goalsWhite === 0 ? (
                        <p className="text-xs text-slate-400 italic">Sin goles en este partidillo</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {groupScorers(match.scorersWhite, players).map((scorer) => (
                            <span
                              key={scorer.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"
                            >
                              <span>{'⚽'.repeat(scorer.count)} {scorer.name}</span>
                            </span>
                          ))}
                          {match.goalsWhite > match.scorersWhite.length && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 border-dashed" title="Goles sin autor especificado">
                              <span>⚽ +{match.goalsWhite - match.scorersWhite.length} sin asignar</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rosters / Lineups by team if recorded */}
                  {((match.playersBlue && match.playersBlue.length > 0) || (match.playersWhite && match.playersWhite.length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {match.playersBlue && match.playersBlue.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Jugadores Azules ({match.playersBlue.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {match.playersBlue.map((pid) => {
                              const p = players.find(
                                (pl) =>
                                  pl.id === pid ||
                                  pl.name.toLowerCase() === pid.toLowerCase() ||
                                  (pl.nickname && pl.nickname.toLowerCase() === pid.toLowerCase())
                              );
                              const displayName = p ? getPlayerDisplayName(p) : pid;
                              const fullTip = p ? (p.nickname ? `${p.name} (mote: "${p.nickname}")` : p.name) : pid;
                              return (
                                <span
                                  key={pid}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/80"
                                  title={fullTip}
                                >
                                  {displayName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {match.playersWhite && match.playersWhite.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Jugadores Blancos ({match.playersWhite.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {match.playersWhite.map((pid) => {
                              const p = players.find(
                                (pl) =>
                                  pl.id === pid ||
                                  pl.name.toLowerCase() === pid.toLowerCase() ||
                                  (pl.nickname && pl.nickname.toLowerCase() === pid.toLowerCase())
                              );
                              const displayName = p ? getPlayerDisplayName(p) : pid;
                              const fullTip = p ? (p.nickname ? `${p.name} (mote: "${p.nickname}")` : p.name) : pid;
                              return (
                                <span
                                  key={pid}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300"
                                  title={fullTip}
                                >
                                  {displayName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location & Notes */}
                  <div className="mt-5 pt-4 border-t border-slate-200/60 flex flex-col gap-2.5 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      {match.location && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {match.location}
                        </span>
                      )}
                    </div>

                    {match.notes && (
                      <p className="text-slate-600 italic text-[11px] bg-slate-50/30 p-2 rounded border border-slate-200/40">
                        "{match.notes}"
                      </p>
                    )}

                    {/* Attached Match Photo */}
                    {match.imageUrl && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>Foto del Partidillo</span>
                        </div>
                        <div
                          onClick={() => setPreviewPhotoUrl(match.imageUrl!)}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50/50 max-w-sm h-44 cursor-pointer"
                        >
                          <img
                            src={match.imageUrl}
                            alt={`Foto de ${match.title}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-50/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-blue-400 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5" /> Ver en Grande
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Chronicle Link if available */}
                    {(() => {
                      const chronicle = chronicles.find((c) => c.matchId === match.id);
                      if (!chronicle) return null;
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-200/50">
                          <button
                            onClick={() => openChronicle(chronicle.id)}
                            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200/80 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <Newspaper className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-slate-500 font-normal">Crónica oficial:</span>
                              <span className="line-clamp-1 group-hover:text-blue-900 font-bold">{chronicle.title}</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to add or edit match */}
      <AddMatchModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMatch(null);
        }}
        matchToEdit={editingMatch}
      />

      {/* Season Manager Modal */}
      <SeasonManagerModal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        onSelectSeason={(s) => setSelectedSeason(s)}
      />

      {/* Modal Lightbox for match photo */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/90 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-50/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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

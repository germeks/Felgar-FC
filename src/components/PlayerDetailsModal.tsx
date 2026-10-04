import React, { useState } from 'react';
import { Player } from '../types';
import { useClub } from '../context/ClubContext';
import { X, Calendar, Award, Edit2, Cake, Trophy, CheckCircle2, Shield } from 'lucide-react';
import { isBirthdayToday, formatBirthDate, getPlayerDisplayAge } from '../utils/birthdayUtils';
import { getPlayerPhotoStyle } from '../utils/photoUtils';

interface PlayerDetailsModalProps {
  player: Player | null;
  onClose: () => void;
  onEdit: (player: Player) => void;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ player, onClose, onEdit }) => {
  const { matches, isAdmin } = useClub();
  const [activeTab, setActiveTab] = useState<'goles' | 'partidos'>('goles');

  if (!player) return null;

  const isBirthday = isBirthdayToday(player.birthDate);
  const displayAge = getPlayerDisplayAge(player);

  // Find all goals and matches where this player scored in the pachangas history
  const playerGoalsHistory: {
    matchId: string;
    date: string;
    matchTitle: string;
    type?: string;
    side: 'Azules' | 'Blancos';
    finalScore: string;
    isWinner: boolean;
  }[] = [];

  matches.forEach((m) => {
    const combinedScorers = [
      ...m.scorersBlue.map((s) => ({ ...s, side: 'Azules' as const })),
      ...m.scorersWhite.map((s) => ({ ...s, side: 'Blancos' as const })),
    ];

    combinedScorers.forEach((s) => {
      if (
        s.playerId === player.id ||
        s.playerName.toLowerCase().trim() === player.name.toLowerCase().trim()
      ) {
        playerGoalsHistory.push({
          matchId: m.id,
          date: m.date,
          matchTitle: m.title,
          type: s.type || 'Golazo',
          side: s.side,
          finalScore: `${m.goalsBlue} (Azules) - ${m.goalsWhite} (Blancos)`,
          isWinner:
            (s.side === 'Azules' && m.goalsBlue > m.goalsWhite) ||
            (s.side === 'Blancos' && m.goalsWhite > m.goalsBlue),
        });
      }
    });
  });

  // Sort goals history by date descending
  playerGoalsHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Find all matches where the player participated
  const playerMatchesHistory: {
    matchId: string;
    date: string;
    matchTitle: string;
    side: 'Azules' | 'Blancos';
    score: string;
    outcome: 'Victoria' | 'Empate' | 'Derrota';
    goalsCount: number;
    isMvp: boolean;
  }[] = [];

  const pName = player.name.toLowerCase().trim();
  const pNick = player.nickname ? player.nickname.toLowerCase().trim() : null;

  matches.forEach((m) => {
    const isBlue = (m.playersBlue || []).some(
      (pid) =>
        pid === player.id ||
        pid.toLowerCase().trim() === pName ||
        (pNick !== null && pid.toLowerCase().trim() === pNick)
    );
    const isWhite = (m.playersWhite || []).some(
      (pid) =>
        pid === player.id ||
        pid.toLowerCase().trim() === pName ||
        (pNick !== null && pid.toLowerCase().trim() === pNick)
    );

    const goalsInBlue = m.scorersBlue.filter(
      (s) =>
        s.type !== 'Propia Puerta' &&
        (s.playerId === player.id ||
          s.playerName.toLowerCase().trim() === pName ||
          (pNick !== null && s.playerName.toLowerCase().trim() === pNick))
    ).length;
    const goalsInWhite = m.scorersWhite.filter(
      (s) =>
        s.type !== 'Propia Puerta' &&
        (s.playerId === player.id ||
          s.playerName.toLowerCase().trim() === pName ||
          (pNick !== null && s.playerName.toLowerCase().trim() === pNick))
    ).length;

    let side: 'Azules' | 'Blancos' | null = null;
    if (isBlue || goalsInBlue > 0) side = 'Azules';
    else if (isWhite || goalsInWhite > 0) side = 'Blancos';

    if (side) {
      let outcome: 'Victoria' | 'Empate' | 'Derrota' = 'Empate';
      if (m.goalsBlue === m.goalsWhite) {
        outcome = 'Empate';
      } else if (side === 'Azules') {
        outcome = m.goalsBlue > m.goalsWhite ? 'Victoria' : 'Derrota';
      } else {
        outcome = m.goalsWhite > m.goalsBlue ? 'Victoria' : 'Derrota';
      }

      const isMvp =
        m.mvp === player.id ||
        (Boolean(m.mvp) && (
          m.mvp!.toLowerCase().trim() === pName ||
          (pNick !== null && m.mvp!.toLowerCase().trim() === pNick)
        ));
      const goalsCount = side === 'Azules' ? goalsInBlue : goalsInWhite;

      playerMatchesHistory.push({
        matchId: m.id,
        date: m.date,
        matchTitle: m.title,
        side,
        score: `${m.goalsBlue} - ${m.goalsWhite}`,
        outcome,
        goalsCount,
        isMvp,
      });
    }
  });

  playerMatchesHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const winsCount = playerMatchesHistory.filter((m) => m.outcome === 'Victoria').length;
  const drawsCount = playerMatchesHistory.filter((m) => m.outcome === 'Empate').length;
  const lossesCount = playerMatchesHistory.filter((m) => m.outcome === 'Derrota').length;

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with Player Banner */}
        <div className="relative h-44 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-6 flex items-end justify-between border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50/60 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-end gap-5">
            {/* Player Photo */}
            <div className="relative -mb-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-slate-300 shadow-2xl bg-slate-100 flex-shrink-0">
              <img
                src={player.photoUrl}
                alt={player.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={getPlayerPhotoStyle(player)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div className="text-slate-900 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  player.preferredSide === 'Azules'
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                    : 'bg-slate-200/20 text-slate-800 border border-slate-300/30'
                }`}>
                  Equipo {player.preferredSide || 'Azules'}
                </span>
                {displayAge ? (
                  <span className="text-xs text-slate-600 font-semibold">
                    {displayAge} años
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">
                    -
                  </span>
                )}
                {isBirthday && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-sm animate-bounce">
                    <Cake className="w-3.5 h-3.5" /> ¡Hoy es su cumpleaños!
                  </span>
                )}
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-wide flex items-center gap-2 flex-wrap">
                <span>{player.name}</span>
                {player.nickname && (
                  <span className="text-base sm:text-lg text-blue-600 font-semibold font-sans">
                    "{player.nickname}"
                  </span>
                )}
              </h2>
            </div>
          </div>

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onEdit(player)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 pt-12 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 text-center relative overflow-hidden shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Goles Totales
              </span>
              <span className="font-display font-black text-3xl text-blue-600">
                {player.goals}
              </span>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sincronizado
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Pachangas
              </span>
              <span className="font-display font-black text-3xl text-slate-900">
                {player.matchesPlayed}
              </span>
              <span className="text-[10px] text-slate-400 block mt-2">Partidos jugados</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Promedio
              </span>
              <span className="font-display font-black text-3xl text-emerald-600">
                {player.matchesPlayed > 0 ? (player.goals / player.matchesPlayed).toFixed(2) : '0.00'}
              </span>
              <span className="text-[10px] text-emerald-600/80 block mt-2">Goles / Partido</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Balance
              </span>
              <span className="font-display font-black text-xl text-slate-800 mt-1 block">
                {winsCount}V · {drawsCount}E · {lossesCount}D
              </span>
              <span className="text-[10px] text-slate-400 block mt-2">
                {player.mvps ? `⭐ ${player.mvps} MVP${player.mvps > 1 ? 's' : ''}` : 'Historial real'}
              </span>
            </div>
          </div>

          {/* Dossier info */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Nacimiento:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {player.birthDate ? (
                  <>
                    <Cake className="w-3.5 h-3.5 text-amber-500" />
                    {formatBirthDate(player.birthDate, true)}
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Edad:</span>
              <span className="font-semibold text-slate-800">
                {displayAge ? `${displayAge} años` : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">En el club desde:</span>
              <span className="font-semibold text-slate-700">{formatDate(player.joinedDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Bando preferido:</span>
              <span className="font-semibold text-blue-700">{player.preferredSide || 'Azules'}</span>
            </div>
          </div>

          {/* Selector de Pestaña: Goles o Partidos */}
          <div className="flex border-b border-slate-200 gap-2 pt-2">
            <button
              onClick={() => setActiveTab('goles')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'goles'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Goles Anotados ({playerGoalsHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('partidos')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'partidos'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Pachangas Jugadas ({playerMatchesHistory.length})
            </button>
          </div>

          {/* HISTORIAL DE GOLES CON FECHAS */}
          {activeTab === 'goles' && (
            <div className="space-y-3">
              {playerGoalsHistory.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/40 rounded-xl border border-slate-200 text-xs text-slate-400">
                  Aún no hay goles registrados para este jugador en el historial de pachangas.
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/90 text-slate-400 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Pachanga</th>
                        <th className="py-2.5 px-3 text-center">Bando</th>
                        <th className="py-2.5 px-3 text-right">Marcador Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {playerGoalsHistory.map((g, i) => (
                        <tr key={i} className="hover:bg-white/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {formatDate(g.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {g.matchTitle}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.side === 'Azules' ? 'bg-blue-500/20 text-blue-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {g.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                            {g.finalScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL DE PACHANGAS JUGADAS */}
          {activeTab === 'partidos' && (
            <div className="space-y-3">
              {playerMatchesHistory.length === 0 ? (
                <div className="text-center py-6 bg-slate-50/40 rounded-xl border border-slate-200 text-xs text-slate-400">
                  No hay partidos registrados donde figure este jugador en la alineación.
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/90 text-slate-400 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Pachanga</th>
                        <th className="py-2.5 px-3 text-center">Bando</th>
                        <th className="py-2.5 px-3 text-center">Goles</th>
                        <th className="py-2.5 px-3 text-center">Resultado</th>
                        <th className="py-2.5 px-3 text-right">Marcador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {playerMatchesHistory.map((m, i) => (
                        <tr key={i} className="hover:bg-white/40 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            {formatDate(m.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{m.matchTitle}</span>
                              {m.isMvp && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                                  ⭐ MVP
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.side === 'Azules' ? 'bg-blue-500/20 text-blue-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                            {m.goalsCount > 0 ? `${m.goalsCount} ⚽` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.outcome === 'Victoria'
                                ? 'bg-emerald-500/20 text-emerald-700'
                                : m.outcome === 'Derrota'
                                ? 'bg-rose-500/20 text-rose-700'
                                : 'bg-amber-500/20 text-amber-700'
                            }`}>
                              {m.outcome}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                            {m.score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => onEdit(player)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Jugador
            </button>
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

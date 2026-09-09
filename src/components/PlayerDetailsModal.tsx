import React from 'react';
import { Player } from '../types';
import { useClub } from '../context/ClubContext';
import { X, Calendar, Award, Plus, Edit2, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerDetailsModalProps {
  player: Player | null;
  onClose: () => void;
  onEdit: (player: Player) => void;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ player, onClose, onEdit }) => {
  const { matches, updatePlayer, isAdmin } = useClub();

  if (!player) return null;

  // Find all goals and matches where this player scored in the pachangas history
  const playerGoalsHistory: {
    matchId: string;
    date: string;
    matchTitle: string;
    minute?: number;
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
          minute: s.minute,
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

  const handleQuickAddGoal = () => {
    updatePlayer({
      ...player,
      goals: player.goals + 1,
    });
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#F59E0B'],
      });
    } catch {
      // Confetti fallback
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with Player Banner */}
        <div className="relative h-44 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 flex items-end justify-between border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-950/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-end gap-5">
            {/* Player Photo */}
            <div className="relative -mb-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-slate-800 flex-shrink-0">
              <img
                src={player.photoUrl}
                alt={player.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div className="text-white pb-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  player.preferredSide === 'Azules'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-200/20 text-slate-100 border border-slate-300/30'
                }`}>
                  Equipo {player.preferredSide || 'Azules'}
                </span>
                {player.age && (
                  <span className="text-xs text-slate-300 font-medium">
                    {player.age} años
                  </span>
                )}
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
                {player.name}
              </h2>
            </div>
          </div>

          {isAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onEdit(player)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
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
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center relative overflow-hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Goles Totales
              </span>
              <span className="font-display font-black text-3xl text-blue-400">
                {player.goals}
              </span>
              {isAdmin && (
                <button
                  onClick={handleQuickAddGoal}
                  title="Añadir +1 gol a su cuenta"
                  className="mt-2 text-[10px] font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> +1 Gol
                </button>
              )}
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pachangas
              </span>
              <span className="font-display font-black text-3xl text-white">
                {player.matchesPlayed}
              </span>
              <span className="text-[10px] text-slate-500 block mt-2">Jugadas</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Asistencias
              </span>
              <span className="font-display font-black text-3xl text-slate-200">
                {player.assists}
              </span>
              <span className="text-[10px] text-slate-500 block mt-2">Pases de gol</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Promedio
              </span>
              <span className="font-display font-black text-3xl text-emerald-400">
                {player.matchesPlayed > 0 ? (player.goals / player.matchesPlayed).toFixed(2) : '0.00'}
              </span>
              <span className="text-[10px] text-emerald-500/80 block mt-2">Goles / Partido</span>
            </div>
          </div>

          {/* Dossier info */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">En la peña desde:</span>
              <span className="font-semibold text-slate-200">{formatDate(player.joinedDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Pie dominante:</span>
              <span className="font-semibold text-slate-200">{player.preferredFoot || 'Diestro'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Bando preferido:</span>
              <span className="font-semibold text-blue-400">{player.preferredSide || 'Azules'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Promedio gol/pachanga:</span>
              <span className="font-semibold text-blue-400">
                {player.matchesPlayed > 0
                  ? (player.goals / player.matchesPlayed).toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </div>

          {/* HISTORIAL DE GOLES CON FECHAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Historial de Goles y Fechas de {player.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {playerGoalsHistory.length} goles en historial
              </span>
            </div>

            {playerGoalsHistory.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
                Aún no hay goles registrados para este jugador en el historial de pachangas. Al añadir un partido y asignarle un gol a su bando, aparecerá aquí automáticamente con la fecha exacta.
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Pachanga</th>
                      <th className="py-2.5 px-3 text-center">Bando</th>
                      <th className="py-2.5 px-3">Tipo de Gol</th>
                      <th className="py-2.5 px-3 text-right">Marcador Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {playerGoalsHistory.map((g, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-300 font-medium">
                          {formatDate(g.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {g.matchTitle}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.side === 'Azules' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-200'
                          }`}>
                            {g.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          ⚽ {g.type}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                          {g.finalScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => onEdit(player)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Jugador
            </button>
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

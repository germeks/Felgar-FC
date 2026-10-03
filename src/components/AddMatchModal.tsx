import React, { useState, useEffect, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { GoalScorer, Match } from '../types';
import { SeasonManagerModal } from './SeasonManagerModal';
import { getPlayerDisplayName } from '../utils/statsUtils';
import { X, Plus, Trash2, Calendar, MapPin, CheckCircle, Flame, Camera, Upload, Link, Image as ImageIcon, Edit3, Settings, Check, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { compressImage } from '../utils/imageCompression';

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchToEdit?: Match | null;
}

export const AddMatchModal: React.FC<AddMatchModalProps> = ({ isOpen, onClose, matchToEdit }) => {
  const { players, matches, seasons, addSeason, addMatch, updateMatch, addPhoto } = useClub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(matchToEdit);
  const today = new Date().toISOString().split('T')[0];
  const nextMatchNum = matches.length + 1;

  const [date, setDate] = useState(today);
  const [time, setTime] = useState('22:00');
  const [season, setSeason] = useState(seasons[0] || 'Temporada 25/26');
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [isQuickAddSeason, setIsQuickAddSeason] = useState(false);
  const [quickSeasonName, setQuickSeasonName] = useState('');

  const [location, setLocation] = useState('Polideportivo Vicente del Bosque');
  const [goalsBlue, setGoalsBlue] = useState<number>(6);
  const [goalsWhite, setGoalsWhite] = useState<number>(4);
  const [notes, setNotes] = useState('');

  // Image attachment
  const [matchImageUrl, setMatchImageUrl] = useState('');
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  const [playersBlue, setPlayersBlue] = useState<string[]>([]);
  const [playersWhite, setPlayersWhite] = useState<string[]>([]);
  const [scorersBlue, setScorersBlue] = useState<GoalScorer[]>([]);
  const [scorersWhite, setScorersWhite] = useState<GoalScorer[]>([]);
  const [mvp, setMvp] = useState<string>('');

  // All players sorted alphabetically by nickname (if available) or name
  const sortedAllPlayers = React.useMemo(() => {
    return [...players].sort((a, b) =>
      getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), 'es', { sensitivity: 'base' })
    );
  }, [players]);

  // Players in Azules lineup, sorted alphabetically
  const availableBluePlayers = React.useMemo(() => {
    return sortedAllPlayers.filter((p) => playersBlue.includes(p.id));
  }, [sortedAllPlayers, playersBlue]);

  // Players in Blancos lineup, sorted alphabetically
  const availableWhitePlayers = React.useMemo(() => {
    return sortedAllPlayers.filter((p) => playersWhite.includes(p.id));
  }, [sortedAllPlayers, playersWhite]);

  // All participants in this match, sorted alphabetically
  const matchParticipants = React.useMemo(() => {
    const ids = new Set([...playersBlue, ...playersWhite]);
    return sortedAllPlayers.filter((p) => ids.has(p.id));
  }, [sortedAllPlayers, playersBlue, playersWhite]);

  // Synchronize fields when opening or changing matchToEdit
  useEffect(() => {
    if (!isOpen) return;

    if (matchToEdit) {
      setDate(matchToEdit.date);
      setTime(matchToEdit.time || '22:00');
      setSeason(matchToEdit.season || seasons[0] || 'Temporada 25/26');
      setLocation(matchToEdit.location || 'Polideportivo Vicente del Bosque');
      setGoalsBlue(matchToEdit.goalsBlue);
      setGoalsWhite(matchToEdit.goalsWhite);
      setNotes(matchToEdit.notes || '');
      setMatchImageUrl(matchToEdit.imageUrl || '');
      setPlayersBlue(matchToEdit.playersBlue || []);
      setPlayersWhite(matchToEdit.playersWhite || []);
      setScorersBlue(
        (matchToEdit.scorersBlue || []).map((s) => {
          const p = players.find((pl) => pl.id === s.playerId);
          return p ? { ...s, playerName: getPlayerDisplayName(p) } : s;
        })
      );
      setScorersWhite(
        (matchToEdit.scorersWhite || []).map((s) => {
          const p = players.find((pl) => pl.id === s.playerId);
          return p ? { ...s, playerName: getPlayerDisplayName(p) } : s;
        })
      );
      setMvp(matchToEdit.mvp || '');
    } else {
      setDate(today);
      setTime('22:00');
      setSeason(seasons[0] || 'Temporada 25/26');
      setLocation('Polideportivo Vicente del Bosque');
      setGoalsBlue(6);
      setGoalsWhite(4);
      setNotes('');
      setMatchImageUrl('');
      setMvp('');
      
      const initialBlueIds = players.filter(p => p.preferredSide === 'Azules').map(p => p.id);
      const initialWhiteIds = players.filter(p => p.preferredSide === 'Blancos').map(p => p.id);
      setPlayersBlue(initialBlueIds);
      setPlayersWhite(initialWhiteIds);
      
      const defaultPBlue = players.filter(p => initialBlueIds.includes(p.id)).sort((a, b) => getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), 'es', { sensitivity: 'base' }))[0];
      const defaultPWhite = players.filter(p => initialWhiteIds.includes(p.id)).sort((a, b) => getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), 'es', { sensitivity: 'base' }))[0];
      setScorersBlue(defaultPBlue ? [{
        playerId: defaultPBlue.id,
        playerName: getPlayerDisplayName(defaultPBlue),
        side: 'Azules',
      }] : []);
      setScorersWhite(defaultPWhite ? [{
        playerId: defaultPWhite.id,
        playerName: getPlayerDisplayName(defaultPWhite),
        side: 'Blancos',
      }] : []);
    }
  }, [matchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }
    setIsCompressingImage(true);
    try {
      const compressed = await compressImage(file, {
        maxDimension: 1280,
        quality: 0.8,
        maxSizeBytes: 500 * 1024,
      });
      setMatchImageUrl(compressed);
    } catch (err) {
      console.error('Error optimizando imagen del partido:', err);
      alert('No se pudo procesar la imagen.');
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
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
    if (file) handleImageFile(file);
  };

  const handleAddScorerBlue = () => {
    const defaultP = availableBluePlayers[0];
    const newScorers = [
      ...scorersBlue,
      {
        playerId: defaultP ? defaultP.id : '',
        playerName: defaultP ? getPlayerDisplayName(defaultP) : '',
        type: 'Golazo' as const,
        side: 'Azules' as const,
      },
    ];
    setScorersBlue(newScorers);
    if (newScorers.length > goalsBlue) {
      setGoalsBlue(newScorers.length);
    }
  };

  const handleRemoveScorerBlue = (index: number) => {
    setScorersBlue(scorersBlue.filter((_, i) => i !== index));
  };

  const handleScorerBlueChange = (index: number, field: keyof GoalScorer, value: any) => {
    const updated = [...scorersBlue];
    if (field === 'playerId') {
      const selectedP = players.find((p) => p.id === value);
      updated[index].playerId = value;
      if (selectedP) {
        updated[index].playerName = getPlayerDisplayName(selectedP);
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setScorersBlue(updated);
  };

  const handleAddScorerWhite = () => {
    const defaultP = availableWhitePlayers[0];
    const newScorers = [
      ...scorersWhite,
      {
        playerId: defaultP ? defaultP.id : '',
        playerName: defaultP ? getPlayerDisplayName(defaultP) : '',
        type: 'Golazo' as const,
        side: 'Blancos' as const,
      },
    ];
    setScorersWhite(newScorers);
    if (newScorers.length > goalsWhite) {
      setGoalsWhite(newScorers.length);
    }
  };

  const handleRemoveScorerWhite = (index: number) => {
    setScorersWhite(scorersWhite.filter((_, i) => i !== index));
  };

  const handleScorerWhiteChange = (index: number, field: keyof GoalScorer, value: any) => {
    const updated = [...scorersWhite];
    if (field === 'playerId') {
      const selectedP = players.find((p) => p.id === value);
      updated[index].playerId = value;
      if (selectedP) {
        updated[index].playerName = getPlayerDisplayName(selectedP);
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setScorersWhite(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalLocation = location.trim() || 'Polideportivo Vicente del Bosque';

    const sanitizeScorers = (list: GoalScorer[]) =>
      list
        .filter((s) => (s.playerId && s.playerId.trim().length > 0) || s.playerName.trim().length > 0)
        .map((s) => {
          const p = s.playerId ? players.find((pl) => pl.id === s.playerId) : null;
          return {
            ...s,
            playerName: p ? getPlayerDisplayName(p) : s.playerName.trim(),
          };
        });

    if (matchToEdit) {
      updateMatch({
        ...matchToEdit,
        title: matchToEdit.title || `Pachanga`,
        date,
        time,
        season: season.trim() || 'Temporada 25/26',
        location: finalLocation,
        goalsBlue: Number(goalsBlue),
        goalsWhite: Number(goalsWhite),
        playersBlue,
        playersWhite,
        scorersBlue: sanitizeScorers(scorersBlue),
        scorersWhite: sanitizeScorers(scorersWhite),
        mvp: mvp.trim() || undefined,
        notes: notes.trim() || undefined,
        imageUrl: matchImageUrl.trim() || undefined,
      });
    } else {
      const finalTitle = `Pachanga #${nextMatchNum}`;
      const newMatch: Omit<Match, 'id'> = {
        title: finalTitle,
        date,
        time,
        season: season.trim() || 'Temporada 25/26',
        location: finalLocation,
        goalsBlue: Number(goalsBlue),
        goalsWhite: Number(goalsWhite),
        playersBlue,
        playersWhite,
        scorersBlue: sanitizeScorers(scorersBlue),
        scorersWhite: sanitizeScorers(scorersWhite),
        status: 'Finalizado',
        mvp: mvp.trim() || undefined,
        notes: notes.trim() || undefined,
        imageUrl: matchImageUrl.trim() || undefined,
      };

      addMatch(newMatch);

      // If a photo is attached to this match, automatically publish it to the Gallery
      if (matchImageUrl.trim()) {
        addPhoto({
          title: `Pachanga (${goalsBlue}-${goalsWhite})`,
          date,
          url: matchImageUrl.trim(),
          category: 'Partidos',
          description: `Foto de la pachanga en ${finalLocation}. ${notes.trim() || ''}`,
        });
      }
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#F8FAFC', '#38BDF8'],
      });
    } catch {
      // Ignored
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 via-white to-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 border border-blue-500/30">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                {isEditing ? 'Editar Pachanga: Azules vs Blancos' : 'Añadir Pachanga: Azules vs Blancos'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Modifica el marcador, goleadores y datos de este partidillo'
                  : 'Registra el resultado del partidillo entre nosotros y los goleadores de cada bando'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Match Details: Temporada, Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">Temporada</label>
                <button
                  type="button"
                  onClick={() => setIsSeasonModalOpen(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  title="Gestionar temporadas"
                >
                  <Settings className="w-3 h-3" />
                  <span>Gestionar</span>
                </button>
              </div>

              {!isQuickAddSeason ? (
                <select
                  value={season}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsQuickAddSeason(true);
                    } else {
                      setSeason(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__NEW__">+ Nueva temporada...</option>
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={quickSeasonName}
                    onChange={(e) => setQuickSeasonName(e.target.value)}
                    placeholder="Nombre temporada..."
                    className="flex-1 min-w-0 bg-white border border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = quickSeasonName.trim();
                      if (clean) {
                        addSeason(clean);
                        setSeason(clean);
                        setQuickSeasonName('');
                        setIsQuickAddSeason(false);
                      }
                    }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                    title="Añadir y seleccionar"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAddSeason(false);
                      setQuickSeasonName('');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha del Partido</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Marcador Azules vs Blancos */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              Marcador Final del Partidillo
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 items-center gap-4">
              {/* Equipo Azul */}
              <div className="sm:col-span-5 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                  🔵 Equipo Azul
                </span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={goalsBlue}
                  onChange={(e) => setGoalsBlue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center font-display font-black text-4xl bg-white border border-blue-500/60 rounded-xl py-2 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {scorersBlue.length !== goalsBlue ? (
                  <button
                    type="button"
                    onClick={() => setGoalsBlue(scorersBlue.length)}
                    className="text-[11px] text-blue-600 hover:underline mt-2 font-medium flex items-center gap-1 cursor-pointer"
                    title="Alinear marcador a la cantidad de goleadores asignados"
                  >
                    <span>{scorersBlue.length} {scorersBlue.length === 1 ? 'goleador' : 'goleadores'}</span>
                    <span className="bg-blue-100 text-blue-700 px-1 rounded text-[9px]">Alinear</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-medium mt-2">
                    ✓ {goalsBlue} {goalsBlue === 1 ? 'goleador' : 'goleadores'}
                  </span>
                )}
              </div>

              {/* VS Divider */}
              <div className="sm:col-span-1 text-center font-display font-black text-xl text-slate-600">
                VS
              </div>

              {/* Equipo Blanco */}
              <div className="sm:col-span-5 p-4 rounded-xl bg-white/60 border border-slate-300/80 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  ⚪ Equipo Blanco
                </span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={goalsWhite}
                  onChange={(e) => setGoalsWhite(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center font-display font-black text-4xl bg-white border border-slate-300 rounded-xl py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {scorersWhite.length !== goalsWhite ? (
                  <button
                    type="button"
                    onClick={() => setGoalsWhite(scorersWhite.length)}
                    className="text-[11px] text-slate-700 hover:underline mt-2 font-medium flex items-center gap-1 cursor-pointer"
                    title="Alinear marcador a la cantidad de goleadores asignados"
                  >
                    <span>{scorersWhite.length} {scorersWhite.length === 1 ? 'goleador' : 'goleadores'}</span>
                    <span className="bg-slate-200 text-slate-800 px-1 rounded text-[9px]">Alinear</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-medium mt-2">
                    ✓ {goalsWhite} {goalsWhite === 1 ? 'goleador' : 'goleadores'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alineaciones de Azules y Blancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alineación Azules */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-blue-900/40">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                  👥 Jugadores Azules ({playersBlue.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Orden alfabético</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedAllPlayers.map((p) => {
                  const isSelected = playersBlue.includes(p.id);
                  const isOtherTeam = playersWhite.includes(p.id);
                  const displayName = getPlayerDisplayName(p);
                  const tooltipText = p.nickname ? `${p.name} (mote: "${p.nickname}")` : p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPlayersBlue(playersBlue.filter(id => id !== p.id));
                        } else {
                          setPlayersBlue([...playersBlue, p.id]);
                          if (isOtherTeam) {
                            setPlayersWhite(playersWhite.filter(id => id !== p.id));
                          }
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : isOtherTeam
                          ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title={isOtherTeam ? `${tooltipText} (en Blancos - pulsa para pasar a Azules)` : tooltipText}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alineación Blancos */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  👥 Jugadores Blancos ({playersWhite.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Orden alfabético</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedAllPlayers.map((p) => {
                  const isSelected = playersWhite.includes(p.id);
                  const isOtherTeam = playersBlue.includes(p.id);
                  const displayName = getPlayerDisplayName(p);
                  const tooltipText = p.nickname ? `${p.name} (mote: "${p.nickname}")` : p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPlayersWhite(playersWhite.filter(id => id !== p.id));
                        } else {
                          setPlayersWhite([...playersWhite, p.id]);
                          if (isOtherTeam) {
                            setPlayersBlue(playersBlue.filter(id => id !== p.id));
                          }
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                          : isOtherTeam
                          ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                      title={isOtherTeam ? `${tooltipText} (en Azules - pulsa para pasar a Blancos)` : tooltipText}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Goleadores de Azules y Blancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goleadores Azules */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-blue-900/40">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                    ⚽ Goles de los Azules
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Solo jugadores del equipo Azul ({availableBluePlayers.length} alineados)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddScorerBlue}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg border border-blue-700 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Añadir Gol
                </button>
              </div>

              {availableBluePlayers.length === 0 && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  ⚠️ Primero debes seleccionar a los <strong>Jugadores Azules</strong> en la alineación superior para poder asignarles goles.
                </div>
              )}

              {scorersBlue.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-400 italic">
                  Sin goles registrados para los Azules.
                </div>
              ) : (
                <div className="space-y-2">
                  {scorersBlue.map((scorer, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <select
                        value={scorer.playerId || ''}
                        onChange={(e) => handleScorerBlueChange(idx, 'playerId', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="">
                          {availableBluePlayers.length === 0
                            ? '— Sin jugadores en el equipo Azul —'
                            : 'Seleccionar jugador azul (A-Z)...'}
                        </option>
                        {availableBluePlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {getPlayerDisplayName(p)}
                          </option>
                        ))}
                        {scorer.playerId && !availableBluePlayers.some((p) => p.id === scorer.playerId) && (
                          <option value={scorer.playerId}>
                            {scorer.playerName || 'Jugador seleccionado'} (No en alineación azul)
                          </option>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveScorerBlue(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                        title="Quitar gol"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goleadores Blancos */}
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    ⚽ Goles de los Blancos
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Solo jugadores del equipo Blanco ({availableWhitePlayers.length} alineados)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddScorerWhite}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-lg border border-slate-900 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" /> Añadir Gol
                </button>
              </div>

              {availableWhitePlayers.length === 0 && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  ⚠️ Primero debes seleccionar a los <strong>Jugadores Blancos</strong> en la alineación superior para poder asignarles goles.
                </div>
              )}

              {scorersWhite.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-400 italic">
                  Sin goles registrados para los Blancos.
                </div>
              ) : (
                <div className="space-y-2">
                  {scorersWhite.map((scorer, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <select
                        value={scorer.playerId || ''}
                        onChange={(e) => handleScorerWhiteChange(idx, 'playerId', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs font-medium focus:outline-none focus:border-slate-500"
                      >
                        <option value="">
                          {availableWhitePlayers.length === 0
                            ? '— Sin jugadores en el equipo Blanco —'
                            : 'Seleccionar jugador blanco (A-Z)...'}
                        </option>
                        {availableWhitePlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {getPlayerDisplayName(p)}
                          </option>
                        ))}
                        {scorer.playerId && !availableWhitePlayers.some((p) => p.id === scorer.playerId) && (
                          <option value={scorer.playerId}>
                            {scorer.playerName || 'Jugador seleccionado'} (No en alineación blanca)
                          </option>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveScorerWhite(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                        title="Quitar gol"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MVP, Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <span>⭐ MVP del Partido</span>
              </label>
              <select
                value={mvp}
                onChange={(e) => setMvp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Sin MVP asignado (Opcional)...</option>
                {matchParticipants.map((p) => {
                  const isBlue = playersBlue.includes(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {getPlayerDisplayName(p)} ({isBlue ? '🔵 Azules' : '⚪ Blancos'})
                    </option>
                  );
                })}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Solo jugadores que han participado en el partido
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Polideportivo / Cancha
                </span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Polideportivo Vicente del Bosque"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Anécdotas & Crónica
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Gol en el último suspiro, paradón de Santamaría..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Adjuntar Imagen a la Pachanga (también se muestra en la galería) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Adjuntar Foto de la Pachanga (Se publicará automáticamente en la Galería)
              </label>
              <div className="flex items-center gap-1 text-[11px] bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setImageInputMethod('upload')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    imageInputMethod === 'upload' ? 'bg-blue-400 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMethod('url')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    imageInputMethod === 'url' ? 'bg-blue-400 text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Enlace URL
                </button>
              </div>
            </div>

            {imageInputMethod === 'upload' ? (
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
                  onClick={() => !isCompressingImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-blue-400 bg-blue-500/10'
                      : matchImageUrl
                      ? 'border-slate-300 bg-white/50'
                      : 'border-slate-200 hover:border-blue-500/50 bg-white/30'
                  }`}
                >
                  {isCompressingImage ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-xs font-semibold text-blue-700">Optimizando foto de la pachanga...</p>
                    </div>
                  ) : matchImageUrl ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-300 group">
                      <img src={matchImageUrl} alt="Foto del partido" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-50/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                        <span className="text-xs text-slate-900 font-semibold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Cambiar foto
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMatchImageUrl('');
                          }}
                          className="px-2 py-1 bg-red-600 text-slate-900 text-[10px] font-bold rounded hover:bg-red-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <Upload className="w-6 h-6 text-blue-400 mb-1" />
                      <p className="text-xs font-semibold text-slate-600">
                        Haz clic o arrastra la foto del partidillo aquí
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Foto de grupo, celebración o jugada (PNG, JPG, WebP)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={matchImageUrl}
                    onChange={(e) => setMatchImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {matchImageUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-300">
                    <img src={matchImageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMatchImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-600 text-slate-900 rounded text-[10px] transition-colors"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-slate-400">
              💡 La imagen se adjuntará a la ficha de este partido y se añadirá de inmediato al álbum de la <strong>Galería</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCompressingImage}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {isCompressingImage ? 'Optimizando...' : isEditing ? 'Guardar Cambios' : 'Guardar Pachanga'}
            </button>
          </div>
        </form>
      </div>

      {/* Season Manager Modal */}
      <SeasonManagerModal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        onSelectSeason={(s) => setSeason(s)}
      />
    </div>
  );
};

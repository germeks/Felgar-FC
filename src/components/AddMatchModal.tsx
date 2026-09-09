import React, { useState, useRef } from 'react';
import { useClub } from '../context/ClubContext';
import { GoalScorer, Match } from '../types';
import { X, Plus, Trash2, Calendar, MapPin, CheckCircle, Flame, Camera, Upload, Link, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMatchModal: React.FC<AddMatchModalProps> = ({ isOpen, onClose }) => {
  const { players, matches, addMatch, addPhoto } = useClub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const nextMatchNum = matches.length + 1;

  const [title, setTitle] = useState(`Pachanga de los Lunes #${nextMatchNum}`);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('22:00');
  const [location, setLocation] = useState('Polideportivo Vicente del Bosque');
  const [goalsBlue, setGoalsBlue] = useState<number>(6);
  const [goalsWhite, setGoalsWhite] = useState<number>(4);
  const [notes, setNotes] = useState('');

  // Image attachment
  const [matchImageUrl, setMatchImageUrl] = useState('');
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  const [playersBlue, setPlayersBlue] = useState<string[]>(
    players.filter(p => p.preferredSide === 'Azules').map(p => p.id)
  );
  const [playersWhite, setPlayersWhite] = useState<string[]>(
    players.filter(p => p.preferredSide === 'Blancos').map(p => p.id)
  );

  // Scorers for Azules
  const [scorersBlue, setScorersBlue] = useState<GoalScorer[]>([
    {
      playerId: players.find((p) => p.preferredSide === 'Azules')?.id || players[0]?.id || '',
      playerName: players.find((p) => p.preferredSide === 'Azules')?.name || 'Mateo Ruiz',
      minute: 20,
      type: 'Golazo',
      side: 'Azules',
    },
  ]);

  // Scorers for Blancos
  const [scorersWhite, setScorersWhite] = useState<GoalScorer[]>([
    {
      playerId: players.find((p) => p.preferredSide === 'Blancos')?.id || players[1]?.id || '',
      playerName: players.find((p) => p.preferredSide === 'Blancos')?.name || 'Álvaro Felgar',
      minute: 35,
      type: 'Golazo',
      side: 'Blancos',
    },
  ]);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setMatchImageUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
    const defaultP = players.find((p) => p.preferredSide === 'Azules') || players[0];
    setScorersBlue([
      ...scorersBlue,
      {
        playerId: defaultP ? defaultP.id : '',
        playerName: defaultP ? defaultP.name : '',
        minute: 45,
        type: 'Golazo',
        side: 'Azules',
      },
    ]);
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
        updated[index].playerName = selectedP.name;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setScorersBlue(updated);
  };

  const handleAddScorerWhite = () => {
    const defaultP = players.find((p) => p.preferredSide === 'Blancos') || players[1] || players[0];
    setScorersWhite([
      ...scorersWhite,
      {
        playerId: defaultP ? defaultP.id : '',
        playerName: defaultP ? defaultP.name : '',
        minute: 45,
        type: 'Golazo',
        side: 'Blancos',
      },
    ]);
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
        updated[index].playerName = selectedP.name;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setScorersWhite(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = title.trim() || `Pachanga de los Lunes #${nextMatchNum}`;
    const finalLocation = location.trim() || 'Polideportivo Vicente del Bosque';

    const newMatch: Omit<Match, 'id'> = {
      title: finalTitle,
      date,
      time,
      location: finalLocation,
      goalsBlue: Number(goalsBlue),
      goalsWhite: Number(goalsWhite),
      playersBlue,
      playersWhite,
      scorersBlue: scorersBlue.filter((s) => s.playerName.trim().length > 0),
      scorersWhite: scorersWhite.filter((s) => s.playerName.trim().length > 0),
      status: 'Finalizado',
      notes: notes.trim() || undefined,
      imageUrl: matchImageUrl.trim() || undefined,
    };

    addMatch(newMatch);

    // If a photo is attached to this match, automatically publish it to the Gallery
    if (matchImageUrl.trim()) {
      addPhoto({
        title: `${finalTitle} (${goalsBlue}-${goalsWhite})`,
        date,
        url: matchImageUrl.trim(),
        category: 'Partidos',
        description: `Foto de la pachanga en ${finalLocation}. ${notes.trim() || ''}`,
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Añadir Pachanga: Azules vs Blancos
              </h3>
              <p className="text-xs text-slate-400">
                Registra el resultado del partidillo entre amigos y los goleadores de cada bando
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Match Title & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre / Edición</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Pachanga de los Lunes #27"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Fecha del Partido</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hora (Todos los lunes a las 22:00)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Marcador Azules vs Blancos */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
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
                  className="w-24 text-center font-display font-black text-4xl bg-slate-900 border border-blue-500/60 rounded-xl py-2 text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="text-[11px] text-slate-400 mt-2">
                  {scorersBlue.length} goles anotados
                </span>
              </div>

              {/* VS Divider */}
              <div className="sm:col-span-1 text-center font-display font-black text-xl text-slate-600">
                VS
              </div>

              {/* Equipo Blanco */}
              <div className="sm:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
                  ⚪ Equipo Blanco
                </span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={goalsWhite}
                  onChange={(e) => setGoalsWhite(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center font-display font-black text-4xl bg-slate-900 border border-slate-600 rounded-xl py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <span className="text-[11px] text-slate-400 mt-2">
                  {scorersWhite.length} goles anotados
                </span>
              </div>
            </div>
          </div>

          {/* Alineaciones de Azules y Blancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alineación Azules */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-blue-900/40">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                👥 Jugadores Azules
              </h4>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const isSelected = playersBlue.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPlayersBlue(playersBlue.filter(id => id !== p.id));
                        } else {
                          setPlayersBlue([...playersBlue, p.id]);
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alineación Blancos */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                👥 Jugadores Blancos
              </h4>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const isSelected = playersWhite.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setPlayersWhite(playersWhite.filter(id => id !== p.id));
                        } else {
                          setPlayersWhite([...playersWhite, p.id]);
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-slate-200/20 text-slate-200 border-slate-300/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Goleadores de Azules y Blancos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goleadores Azules */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-blue-900/40">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  ⚽ Goles de los Azules
                </h4>
                <button
                  type="button"
                  onClick={handleAddScorerBlue}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 rounded-lg border border-blue-500/40 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Añadir Gol
                </button>
              </div>

              {scorersBlue.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-500 italic">
                  Sin goles registrados para los Azules.
                </div>
              ) : (
                <div className="space-y-2">
                  {scorersBlue.map((scorer, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                      <select
                        value={scorer.playerId || ''}
                        onChange={(e) => handleScorerBlueChange(idx, 'playerId', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="">Seleccionar amigo...</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={scorer.type || 'Golazo'}
                        onChange={(e) => handleScorerBlueChange(idx, 'type', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white text-[11px]"
                      >
                        <option value="Golazo">Golazo</option>
                        <option value="Penalti">Penalti</option>
                        <option value="Falta">Falta</option>
                        <option value="Punterazo">Punterazo</option>
                        <option value="De rebote">De rebote</option>
                        <option value="Cabeza">Cabeza</option>
                        <option value="Propia Puerta">P. Puerta</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveScorerBlue(idx)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goleadores Blancos */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  ⚽ Goles de los Blancos
                </h4>
                <button
                  type="button"
                  onClick={handleAddScorerWhite}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Añadir Gol
                </button>
              </div>

              {scorersWhite.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-500 italic">
                  Sin goles registrados para los Blancos.
                </div>
              ) : (
                <div className="space-y-2">
                  {scorersWhite.map((scorer, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                      <select
                        value={scorer.playerId || ''}
                        onChange={(e) => handleScorerWhiteChange(idx, 'playerId', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="">Seleccionar amigo...</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={scorer.type || 'Golazo'}
                        onChange={(e) => handleScorerWhiteChange(idx, 'type', e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-white text-[11px]"
                      >
                        <option value="Golazo">Golazo</option>
                        <option value="Penalti">Penalti</option>
                        <option value="Falta">Falta</option>
                        <option value="Punterazo">Punterazo</option>
                        <option value="De rebote">De rebote</option>
                        <option value="Cabeza">Cabeza</option>
                        <option value="Propia Puerta">P. Puerta</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveScorerWhite(idx)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Polideportivo / Cancha
                </span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Polideportivo Vicente del Bosque"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Anécdotas & Crónica de la Pachanga
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Gol en el último suspiro, paradón de Santamaría, risas..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Adjuntar Imagen a la Pachanga (también se muestra en la galería) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Adjuntar Foto de la Pachanga (Se publicará automáticamente en la Galería)
              </label>
              <div className="flex items-center gap-1 text-[11px] bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageInputMethod('upload')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    imageInputMethod === 'upload' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMethod('url')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    imageInputMethod === 'url' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
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
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-blue-400 bg-blue-500/10'
                      : matchImageUrl
                      ? 'border-slate-700 bg-slate-900/50'
                      : 'border-slate-800 hover:border-blue-500/50 bg-slate-900/30'
                  }`}
                >
                  {matchImageUrl ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-700 group">
                      <img src={matchImageUrl} alt="Foto del partido" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                        <span className="text-xs text-white font-semibold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" /> Cambiar foto
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMatchImageUrl('');
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-500"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 flex flex-col items-center">
                      <Upload className="w-6 h-6 text-blue-400 mb-1" />
                      <p className="text-xs font-semibold text-slate-300">
                        Haz clic o arrastra la foto del partidillo aquí
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Foto de grupo, celebración o jugada (PNG, JPG, WebP)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={matchImageUrl}
                    onChange={(e) => setMatchImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                {matchImageUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-700">
                    <img src={matchImageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMatchImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-slate-900/80 hover:bg-red-600 text-white rounded text-[10px] transition-colors"
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
              Guardar Pachanga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

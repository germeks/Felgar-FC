import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { useClub } from '../context/ClubContext';
import { X, UserPlus, Check, Upload, Camera } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerToEdit?: Player | null;
}

const PRESET_PHOTOS = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=80',
];

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, playerToEdit }) => {
  const { addPlayer, updatePlayer } = useClub();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [preferredSide, setPreferredSide] = useState<'Azules' | 'Blancos'>('Azules');
  const [nationality, setNationality] = useState('España');
  const [age, setAge] = useState<number>(26);
  const [matchesPlayed, setMatchesPlayed] = useState<number>(10);
  const [goals, setGoals] = useState<number>(4);
  const [assists, setAssists] = useState<number>(2);
  const [yellowCards, setYellowCards] = useState<number>(0);
  const [redCards, setRedCards] = useState<number>(0);
  const [photoUrl, setPhotoUrl] = useState(PRESET_PHOTOS[0]);
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setPreferredSide(playerToEdit.preferredSide || 'Azules');
      setNationality(playerToEdit.nationality);
      setAge(playerToEdit.age);
      setMatchesPlayed(playerToEdit.matchesPlayed);
      setGoals(playerToEdit.goals);
      setAssists(playerToEdit.assists);
      setYellowCards(playerToEdit.yellowCards);
      setRedCards(playerToEdit.redCards);
      setPhotoUrl(playerToEdit.photoUrl);
      setJoinedDate(playerToEdit.joinedDate);
    } else {
      setName('');
      setPreferredSide('Azules');
      setNationality('España');
      setAge(26);
      setMatchesPlayed(0);
      setGoals(0);
      setAssists(0);
      setYellowCards(0);
      setRedCards(0);
      setPhotoUrl(PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)]);
      setJoinedDate(new Date().toISOString().split('T')[0]);
    }
  }, [playerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, introduce el nombre del amigo.');
      return;
    }

    if (playerToEdit) {
      updatePlayer({
        ...playerToEdit,
        name: name.trim(),
        preferredSide,
        nationality: nationality.trim(),
        age: Number(age),
        matchesPlayed: Number(matchesPlayed),
        goals: Number(goals),
        assists: Number(assists),
        yellowCards: Number(yellowCards),
        redCards: Number(redCards),
        photoUrl: photoUrl.trim() || PRESET_PHOTOS[0],
        joinedDate,
      });
    } else {
      addPlayer({
        name: name.trim(),
        preferredSide,
        nationality: nationality.trim(),
        age: Number(age),
        matchesPlayed: Number(matchesPlayed),
        goals: Number(goals),
        assists: Number(assists),
        yellowCards: Number(yellowCards),
        redCards: Number(redCards),
        photoUrl: photoUrl.trim() || PRESET_PHOTOS[0],
        joinedDate,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-950 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                {playerToEdit ? 'Editar Amigo' : 'Añadir Nuevo Jugador (Sin límites)'}
              </h3>
              <p className="text-xs text-slate-400">Puedes añadir a todos los amigos que quieras a Felgar FC</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo / Apodo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Edad</label>
              <input
                type="number"
                min="14"
                max="65"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bando Habitual</label>
              <select
                value={preferredSide}
                onChange={(e) => setPreferredSide(e.target.value as 'Azules' | 'Blancos')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Azules">🔵 Equipo Azul</option>
                <option value="Blancos">⚪ Equipo Blanco</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nacionalidad / Procedencia</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="España"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Stats section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
              Estadísticas de Partidillos
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Pachangas Jugadas</label>
                <input
                  type="number"
                  min="0"
                  value={matchesPlayed}
                  onChange={(e) => setMatchesPlayed(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Goles Totales</label>
                <input
                  type="number"
                  min="0"
                  value={goals}
                  onChange={(e) => setGoals(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Asistencias</label>
                <input
                  type="number"
                  min="0"
                  value={assists}
                  onChange={(e) => setAssists(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Photo Selection with File Upload + URL + Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Foto del Amigo / Avatar
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir foto desde dispositivo
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex-shrink-0">
                <img src={photoUrl} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="O pega una URL: https://..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <span className="text-[11px] text-slate-500 flex-shrink-0">Avatares rápidos:</span>
              {PRESET_PHOTOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoUrl(preset)}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    photoUrl === preset ? 'border-blue-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Fecha en que se unió a las pachangas
            </label>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit buttons */}
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
              <Check className="w-4 h-4" />
              {playerToEdit ? 'Guardar Cambios' : 'Añadir Jugador a la Peña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

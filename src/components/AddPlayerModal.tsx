import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { useClub } from '../context/ClubContext';
import { X, UserPlus, Check, Upload, Cake, Calendar, Keyboard, AlertCircle, Crop, Loader2 } from 'lucide-react';
import { PhotoFramingControl } from './PhotoFramingControl';
import { getPlayerPhotoStyle } from '../utils/photoUtils';
import { compressImage } from '../utils/imageCompression';
import {
  calculateAge,
  isoToDisplayDate,
  formatBirthDateInput,
  parseFlexibleDateToIso,
  formatBirthDate,
} from '../utils/birthdayUtils';

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
  const calendarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [preferredSide, setPreferredSide] = useState<'Azules' | 'Blancos'>('Azules');
  const [nationality, setNationality] = useState('España');
  const [birthDate, setBirthDate] = useState(''); // ISO string: YYYY-MM-DD
  const [birthDateInput, setBirthDateInput] = useState(''); // Text input: DD/MM/AAAA
  const [dateInputMode, setDateInputMode] = useState<'keyboard' | 'calendar'>('keyboard');
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);
  const [age, setAge] = useState<number>(26);
  const [isAgeManual, setIsAgeManual] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(PRESET_PHOTOS[0]);
  const [photoPosition, setPhotoPosition] = useState<string>('50% 20%');
  const [photoZoom, setPhotoZoom] = useState<number>(1.0);
  const [showFraming, setShowFraming] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setNickname(playerToEdit.nickname || '');
      setPreferredSide(playerToEdit.preferredSide || 'Azules');
      setNationality(playerToEdit.nationality || 'España');
      const pBirth = playerToEdit.birthDate || '';
      setBirthDate(pBirth);
      setBirthDateInput(isoToDisplayDate(pBirth));
      setDateValidationError(null);
      if (pBirth) {
        setAge(calculateAge(pBirth));
        setIsAgeManual(false);
      } else {
        setAge(playerToEdit.age ?? 26);
        setIsAgeManual(false);
      }
      setPhotoUrl(playerToEdit.photoUrl);
      setPhotoPosition(playerToEdit.photoPosition || '50% 20%');
      setPhotoZoom(playerToEdit.photoZoom || 1.0);
      setShowFraming(Boolean(playerToEdit.photoPosition));
      setJoinedDate(playerToEdit.joinedDate);
    } else {
      setName('');
      setNickname('');
      setPreferredSide('Azules');
      setNationality('España');
      setBirthDate('');
      setBirthDateInput('');
      setDateValidationError(null);
      setAge(26);
      setIsAgeManual(false);
      setPhotoUrl(PRESET_PHOTOS[Math.floor(Math.random() * PRESET_PHOTOS.length)]);
      setPhotoPosition('50% 20%');
      setPhotoZoom(1.0);
      setShowFraming(false);
      setJoinedDate(new Date().toISOString().split('T')[0]);
    }
  }, [playerToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle typing date directly with keyboard (e.g. DD/MM/AAAA)
  const handleKeyboardDateChange = (val: string) => {
    const formatted = formatBirthDateInput(val);
    setBirthDateInput(formatted);

    if (!formatted.trim()) {
      setBirthDate('');
      setDateValidationError(null);
      return;
    }

    const iso = parseFlexibleDateToIso(formatted);
    if (iso) {
      setBirthDate(iso);
      setDateValidationError(null);
      const calc = calculateAge(iso);
      if (calc > 0) {
        setAge(calc);
        setIsAgeManual(false);
      }
    } else {
      const digitsOnly = formatted.replace(/\D/g, '');
      if (digitsOnly.length === 8) {
        setDateValidationError('Fecha no válida. Revisa día (1-31), mes (1-12) y año.');
      } else {
        setDateValidationError(null);
      }
    }
  };

  // Handle date chosen via browser calendar
  const handleCalendarDateChange = (isoVal: string) => {
    setBirthDate(isoVal);
    if (isoVal) {
      setBirthDateInput(isoToDisplayDate(isoVal));
      setDateValidationError(null);
      const calc = calculateAge(isoVal);
      if (calc > 0) {
        setAge(calc);
        setIsAgeManual(false);
      }
    } else {
      setBirthDateInput('');
      setDateValidationError(null);
    }
  };

  const triggerCalendarPicker = () => {
    try {
      if (calendarInputRef.current) {
        if ('showPicker' in HTMLInputElement.prototype) {
          calendarInputRef.current.showPicker();
        } else {
          calendarInputRef.current.focus();
          calendarInputRef.current.click();
        }
      }
    } catch {
      setDateInputMode('calendar');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
        return;
      }
      setIsCompressingPhoto(true);
      try {
        const compressed = await compressImage(file, {
          maxDimension: 800,
          quality: 0.82,
          maxSizeBytes: 350 * 1024,
        });
        setPhotoUrl(compressed);
        setPhotoPosition('50% 15%');
        setPhotoZoom(1.05);
        setShowFraming(true);
      } catch (err) {
        console.error('Error optimizando foto del jugador:', err);
        alert('No se pudo procesar la foto.');
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, introduce el nombre del jugador.');
      return;
    }

    // If keyboard input has a valid date not yet synced, parse it now
    let finalBirthDate = birthDate ? birthDate.trim() : '';
    if (!finalBirthDate && birthDateInput && birthDateInput.trim()) {
      const parsed = parseFlexibleDateToIso(birthDateInput.trim());
      if (parsed) {
        finalBirthDate = parsed;
      }
    }

    const calculatedAge = finalBirthDate ? calculateAge(finalBirthDate) : Number(age);
    const parsedAge = isAgeManual ? Number(age) : (calculatedAge || Number(age));
    const finalAge = parsedAge && !isNaN(parsedAge) && parsedAge > 0 ? parsedAge : undefined;
    const cleanBirthDate = finalBirthDate ? finalBirthDate : undefined;
    const cleanNationality = nationality && nationality.trim() ? nationality.trim() : undefined;
    const cleanNickname = nickname && nickname.trim()
      ? nickname.trim().replace(/^["']+|["']+$/g, '').trim() || undefined
      : undefined;

    if (playerToEdit) {
      updatePlayer({
        ...playerToEdit,
        name: name.trim(),
        nickname: cleanNickname,
        preferredSide,
        nationality: cleanNationality,
        birthDate: cleanBirthDate,
        age: finalAge,
        photoUrl: photoUrl.trim() || PRESET_PHOTOS[0],
        photoPosition: photoPosition || '50% 20%',
        photoZoom: photoZoom || 1.0,
        joinedDate,
      });
    } else {
      addPlayer({
        name: name.trim(),
        nickname: cleanNickname,
        preferredSide,
        nationality: cleanNationality,
        birthDate: cleanBirthDate,
        age: finalAge,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        mvps: 0,
        photoUrl: photoUrl.trim() || PRESET_PHOTOS[0],
        photoPosition: photoPosition || '50% 20%',
        photoZoom: photoZoom || 1.0,
        joinedDate,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-slate-300/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900">
                {playerToEdit ? 'Editar Jugador' : 'Añadir Nuevo Jugador (Sin límites)'}
              </h3>
              <p className="text-xs text-slate-400">Puedes añadir a todos los jugadores que quieras a Felgar FC</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Basic Info: Nombre y Mote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Carlos Mendoza"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mote / Apodo <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder='Ej. El Muro, Pichichi, etc.'
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Fecha de Nacimiento y Edad vinculadas con entrada por teclado y calendario */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-4 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-blue-600" />
                Fecha de Nacimiento & Edad
              </span>

              {/* Selector de modo: Teclado vs Calendario */}
              <div className="flex items-center bg-white/90 p-0.5 rounded-lg border border-blue-200 shadow-xs text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDateInputMode('keyboard')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    dateInputMode === 'keyboard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                  title="Escribir fecha con el teclado (DD/MM/AAAA)"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Teclado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDateInputMode('calendar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    dateInputMode === 'calendar'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                  title="Elegir fecha desde un calendario interactivo"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendario</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-7">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    {dateInputMode === 'keyboard' ? 'Escribir Fecha (DD/MM/AAAA)' : 'Seleccionar del Calendario'}
                  </label>
                  {birthDate && !dateValidationError && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Válida
                    </span>
                  )}
                </div>

                {dateInputMode === 'keyboard' ? (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={birthDateInput}
                      onChange={(e) => handleKeyboardDateChange(e.target.value)}
                      placeholder="DD/MM/AAAA (ej. 15/03/1996)"
                      maxLength={10}
                      className={`w-full bg-white border rounded-lg px-3 py-2 pr-9 text-xs text-slate-900 focus:outline-none font-medium placeholder:text-slate-400 ${
                        dateValidationError
                          ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                          : 'border-slate-300 focus:border-blue-500'
                      }`}
                    />
                    {/* Botón rápido para abrir calendario también desde el modo teclado */}
                    <button
                      type="button"
                      onClick={triggerCalendarPicker}
                      title="Abrir calendario para elegir fecha"
                      className="absolute right-1.5 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => handleCalendarDateChange(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      min="1940-01-01"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                    />
                  </div>
                )}

                {/* Input oculto para activar showPicker() si el usuario clica el icono en modo teclado */}
                <input
                  ref={calendarInputRef}
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleCalendarDateChange(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min="1940-01-01"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Edad</span>
                  {birthDate && !isAgeManual ? (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Calculada
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Años</span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={age}
                    onChange={(e) => {
                      setAge(parseInt(e.target.value) || 0);
                      setIsAgeManual(true);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 text-center font-bold"
                  />
                  <span className="text-xs font-bold text-slate-600">años</span>
                </div>
              </div>
            </div>

            {/* Mensajes de ayuda y validación */}
            {dateValidationError ? (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {dateValidationError}
              </p>
            ) : birthDate ? (
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatBirthDate(birthDate, true)} — {calculateAge(birthDate)} años calculados automáticamente.</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 leading-tight">
                Puedes escribir la fecha directamente con el teclado (ej. <strong>15/03/1996</strong>) o pulsar en <strong>Calendario</strong> para elegirla visualmente.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bando Habitual</label>
              <select
                value={preferredSide}
                onChange={(e) => setPreferredSide(e.target.value as 'Azules' | 'Blancos')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="Azules">🔵 Equipo Azul</option>
                <option value="Blancos">⚪ Equipo Blanco</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nacionalidad / Procedencia</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="España"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Info automática sobre estadísticas */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2.5">
            <span className="text-base flex-shrink-0">⚽</span>
            <p className="leading-tight">
              Las estadísticas (pachangas jugadas, goles y promedios) se calculan y actualizan automáticamente según se vayan añadiendo los partidos.
            </p>
          </div>

          {/* Photo Selection with File Upload + URL + Presets + Framing Adjuster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-semibold text-slate-600">
                Foto del Jugador / Avatar
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFraming(!showFraming)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    showFraming
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                  }`}
                  title="Ajustar cómo se ve la foto en las tarjetas y en las miniaturas de lista"
                >
                  <Crop className="w-3.5 h-3.5" />
                  {showFraming ? 'Ocultar ajuste' : 'Ajustar encuadre (tarjeta y lista)'}
                </button>
                <button
                  type="button"
                  disabled={isCompressingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer"
                >
                  {isCompressingPhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      Optimizando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      Subir foto
                    </>
                  )}
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-300 bg-slate-100 flex-shrink-0 relative group cursor-pointer shadow-xs"
                onClick={() => setShowFraming(true)}
                title="Pulsar para ajustar encuadre y miniatura"
              >
                <img
                  src={photoUrl}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  style={getPlayerPhotoStyle({ photoPosition, photoZoom })}
                />
                <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold z-10">
                  Ajustar
                </div>
              </div>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="O pega una URL: https://..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <span className="text-[11px] text-slate-400 flex-shrink-0">Avatares rápidos:</span>
              {PRESET_PHOTOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPhotoUrl(preset);
                    setPhotoPosition('50% 20%');
                    setPhotoZoom(1.0);
                  }}
                  className={`w-9 h-9 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    photoUrl === preset ? 'border-blue-400 scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Ajuste interactivo de encuadre en vivo para tarjeta y lista */}
            {showFraming && (
              <PhotoFramingControl
                photoUrl={photoUrl}
                photoPosition={photoPosition}
                photoZoom={photoZoom}
                playerName={name}
                preferredSide={preferredSide}
                onChange={({ position, zoom }) => {
                  setPhotoPosition(position);
                  setPhotoZoom(zoom);
                }}
              />
            )}
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha en que se unió a las pachangas
            </label>
            <input
              type="date"
              value={joinedDate}
              onChange={(e) => setJoinedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit buttons */}
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
              disabled={isCompressingPhoto}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isCompressingPhoto ? 'Optimizando...' : playerToEdit ? 'Guardar Cambios' : 'Añadir Jugador al equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

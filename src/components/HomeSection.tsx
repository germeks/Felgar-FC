import React, { useMemo, useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { Crest } from './Crest';
import { Calendar, Users, Camera, ArrowRight, Flame, MapPin, Award, PlusCircle, BarChart3, Newspaper, Cake, Sparkles, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { isBirthdayToday, calculateAge, getDaysUntilBirthday, formatBirthDate } from '../utils/birthdayUtils';
import { getPlayerPhotoStyle } from '../utils/photoUtils';
import { groupScorers } from '../utils/statsUtils';
import { FeaturedGalleryViewer } from './FeaturedGalleryViewer';
import { LightboxModal } from './LightboxModal';

const formatPachangaDate = (dateStr: string, timeStr: string = '22:00') => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);

      const weekday = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });

      return `${weekday} ${day} de ${monthName} de ${year} · ${timeStr}`;
    }
  } catch (e) {
    console.error('Error formatting pachanga date:', e);
  }
  return `${dateStr} · ${timeStr}`;
};

export const HomeSection: React.FC = () => {
  const { matches, players, photos, stats, setActiveTab, isAdmin, chronicles, openChronicle } = useClub();

  // Latest match
  const lastMatch = matches[0];

  // Calcular la próxima fecha de pachanga semanal a partir de los partidos creados
  const nextMatchInfo = useMemo(() => {
    if (!matches || matches.length === 0) {
      return {
        formattedDate: 'Próxima pachanga · 22:00',
        location: 'Polideportivo Vicente del Bosque',
      };
    }

    // Ordenar partidos por fecha descendente
    const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];

    // Calculamos el siguiente encuentro (7 días tras la última pachanga registrada)
    const [y, m, d] = latest.date.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d);
    nextDate.setDate(nextDate.getDate() + 7);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const nextDateStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;
    const timeStr = latest.time || '22:00';

    return {
      formattedDate: formatPachangaDate(nextDateStr, timeStr),
      location: latest.location || 'Polideportivo Vicente del Bosque',
    };
  }, [matches]);

  // Top 3 scorers
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 3);

  // Gallery viewer state for Home section
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const formatPhotoDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // State for admin previewing/testing birthday banner on any player
  const [previewPlayerId, setPreviewPlayerId] = useState<string | null>(null);

  // Birthday celebrants today (or simulated preview player)
  const realBirthdayCelebrants = useMemo(() => {
    return players.filter((p) => isBirthdayToday(p.birthDate));
  }, [players]);

  const birthdayCelebrants = useMemo(() => {
    if (previewPlayerId) {
      const previewP = players.find((p) => p.id === previewPlayerId);
      if (previewP) {
        // Return preview player first if not already in real list
        const exists = realBirthdayCelebrants.some((p) => p.id === previewPlayerId);
        return exists ? realBirthdayCelebrants : [previewP, ...realBirthdayCelebrants];
      }
    }
    return realBirthdayCelebrants;
  }, [realBirthdayCelebrants, previewPlayerId, players]);

  // Upcoming birthdays within next 14 days
  const upcomingBirthdays = useMemo(() => {
    return players
      .map((p) => ({
        player: p,
        daysLeft: getDaysUntilBirthday(p.birthDate),
      }))
      .filter(
        (item): item is { player: typeof players[0]; daysLeft: number } =>
          item.daysLeft !== null && item.daysLeft > 0 && item.daysLeft <= 14
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [players]);

  // Confetti launcher
  const triggerCelebrationConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#3B82F6'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#2563EB', '#F59E0B', '#FFFFFF'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#2563EB', '#F59E0B', '#FFFFFF'],
        });
      }, 200);
    } catch {
      // fallback
    }
  };

  // Launch initial gentle confetti if there are real celebrants today
  useEffect(() => {
    if (realBirthdayCelebrants.length > 0) {
      const timer = setTimeout(() => {
        triggerCelebrationConfetti();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [realBirthdayCelebrants.length]);

  return (
    <div className="space-y-10">
      {/* =========================================================
          SPECIAL BIRTHDAY BANNER (CUMPLEAÑOS EN EL CLUB)
         ========================================================= */}
      {birthdayCelebrants.length > 0 && (
        <div className="space-y-4">
          {birthdayCelebrants.map((celebrant) => {
            const celebrantAge = celebrant.birthDate
              ? calculateAge(celebrant.birthDate)
              : celebrant.age;

            const isPreview = previewPlayerId === celebrant.id && !isBirthdayToday(celebrant.birthDate);

            return (
              <div
                key={celebrant.id}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 p-1 shadow-2xl transition-all"
              >
                <div className="relative rounded-[22px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white overflow-hidden">
                  {/* Glowing background circles */}
                  <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/4 -mb-12 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Avatar & Badges & Text */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                      {/* Photo with golden crown ring */}
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl bg-slate-800 ring-4 ring-amber-400/30">
                          <img
                            src={celebrant.photoUrl}
                            alt={celebrant.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            style={getPlayerPhotoStyle(celebrant)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <div className="absolute -top-2.5 -right-2 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg border border-amber-200 flex items-center gap-1">
                          <span>🎂</span> ¡HOY!
                        </div>
                      </div>

                      {/* Text details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                            <Cake className="w-3.5 h-3.5" /> ¡Cumpleaños en el Club!
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            celebrant.preferredSide === 'Azules'
                              ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                              : 'bg-slate-200/30 text-slate-200 border border-slate-300/40'
                          }`}>
                            Equipo {celebrant.preferredSide || 'Azules'}
                          </span>
                          {isPreview && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                              Modo Vista Previa
                            </span>
                          )}
                        </div>

                        <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                          ¡Muchas felicidades, <span className="text-amber-300">{celebrant.name}</span>!
                        </h2>

                        <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                          Hoy cumple <span className="font-extrabold text-amber-300 text-sm sm:text-base">{celebrantAge} años</span>. ¡De parte de toda la familia de <span className="font-bold text-white">Felgar FC</span> te deseamos un día inolvidable, mucha salud y que sigan cayendo muchos goles en las pachangas!
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2.5 w-full sm:w-auto flex-shrink-0">
                      <button
                        onClick={triggerCelebrationConfetti}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-lg shadow-amber-400/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>¡Felicitar con confeti! 🎉</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('jugadores')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver en la plantilla</span>
                      </button>

                      {isPreview && (
                        <button
                          onClick={() => setPreviewPlayerId(null)}
                          className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Cerrar vista previa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming birthday note (when no one celebrates birthday today) */}
      {birthdayCelebrants.length === 0 && upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/90 via-white to-blue-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-0.5">
                Próximo Cumpleaños en Felgar FC
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                <strong className="text-slate-900">{upcomingBirthdays[0].player.name}</strong> cumplirá años en{' '}
                <span className="text-blue-600 font-bold">
                  {upcomingBirthdays[0].daysLeft === 1 ? 'mañana' : `${upcomingBirthdays[0].daysLeft} días`}
                </span>{' '}
                ({formatBirthDate(upcomingBirthdays[0].player.birthDate, false)}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('jugadores')}
            className="self-end sm:self-auto flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            Ver plantilla <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Birthday Banner Preview Tester (Discrete) */}
      {isAdmin && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <PartyPopper className="w-4 h-4 text-amber-600" />
            <span>Herramienta de Administrador: Probar Banner de Cumpleaños</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={previewPlayerId || ''}
              onChange={(e) => {
                setPreviewPlayerId(e.target.value || null);
                if (e.target.value) {
                  triggerCelebrationConfetti();
                }
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="">-- Probar con un jugador --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.birthDate ? formatBirthDate(p.birthDate, false) : 'Sin fecha'})
                </option>
              ))}
            </select>
            {previewPlayerId && (
              <button
                onClick={() => setPreviewPlayerId(null)}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold text-[11px] cursor-pointer"
              >
                Quitar prueba
              </button>
            )}
          </div>
        </div>
      )}
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          {/* Left Column: Friends Team Concept */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-3">
              <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-900 tracking-tight leading-none">
                FELGAR <span className="text-blue-400">FC</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                Más de 30 años juntándonos para hacer lo que más nos gusta: jugar al fútbol, competir entre amigos y pasar un buen rato. Azules contra Blancos, goles, piques, risas y muchas historias dentro y fuera de la pista.
              </p>
            </div>

            {/* Duel Scoreboard Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Total Matches */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pachangas</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-xl text-slate-900">{stats.totalMatches}</span>
                    <span className="text-[10px] font-bold text-slate-400">jugadas</span>
                  </div>
                </div>
              </div>

              {/* Blue Team Wins */}
              <div className="bg-slate-50 border border-blue-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-600 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Gana Azules</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-xl text-blue-700">{stats.blueWins}</span>
                    <span className="text-[10px] font-medium text-slate-400">victorias ({stats.goalsBlue} goles)</span>
                  </div>
                </div>
              </div>

              {/* White Team Wins */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-slate-800 border border-slate-300 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Gana Blancos</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-xl text-slate-800">{stats.whiteWins}</span>
                    <span className="text-[10px] font-medium text-slate-400">victorias ({stats.goalsWhite} goles)</span>
                  </div>
                </div>
              </div>

              {/* Friends Roster */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Jugadores</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-black text-xl text-slate-900">{players.length}</span>
                    <span className="text-[10px] font-medium text-slate-400">inscritos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Next Fixture Card between Friends */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="p-5 rounded-3xl bg-white/90 border border-slate-300/80 shadow-2xl backdrop-blur-md flex flex-col items-center w-full max-w-sm text-center">
              <Crest size="xl" className="my-1 transform hover:scale-105 transition-transform duration-300" />

              <div className="mt-4 pt-4 border-t border-slate-200 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-blue-600" /> Próxima Pachanga Semanal
                </span>

                <div className="mt-3 flex items-center justify-between px-3 bg-white shadow-sm p-3 rounded-xl border border-slate-200">
                  <div className="text-center">
                    <span className="font-display font-black text-sm text-blue-600 block">AZULES</span>
                    <span className="text-[10px] text-slate-400">{stats.blueWins} Victorias</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-blue-400/20 border border-blue-500/30 font-display font-black text-xs text-blue-700">
                    VS
                  </div>
                  <div className="text-center">
                    <span className="font-display font-black text-sm text-slate-900 block">BLANCOS</span>
                    <span className="text-[10px] text-slate-400">{stats.whiteWins} Victorias</span>
                  </div>
                </div>

                <div className="mt-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="capitalize">{nextMatchInfo.formattedDate}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> {nextMatchInfo.location}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Highlights Grid: Latest Pachanga Spotlight + Top Scorers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Match Spotlight */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Última Pachanga Disputada
              </span>
              <button
                onClick={() => setActiveTab('partidos')}
                className="text-xs font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver todas las pachangas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lastMatch && (
              <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {lastMatch.season || 'Temporada 25/26'}
                    </span>
                  </div>
                  <span className="capitalize font-medium text-slate-500">
                    {formatPachangaDate(lastMatch.date, lastMatch.time)}
                  </span>
                </div>

                <div className="flex items-center justify-around py-3">
                  <div className="text-center">
                    <span className="font-display font-black text-lg text-blue-600 block">
                      EQUIPO AZUL
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-slate-200">
                    <span className={`font-display font-black text-3xl ${
                      lastMatch.goalsBlue > lastMatch.goalsWhite ? 'text-blue-600' : 'text-slate-600'
                    }`}>
                      {lastMatch.goalsBlue}
                    </span>
                    <span className="font-black text-xl text-slate-600">:</span>
                    <span className={`font-display font-black text-3xl ${
                      lastMatch.goalsWhite > lastMatch.goalsBlue ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {lastMatch.goalsWhite}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="font-display font-black text-lg text-slate-800 block">
                      EQUIPO BLANCO
                    </span>
                  </div>
                </div>

                {/* Scorers preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                  <div>
                    <span className="font-bold text-blue-600 block mb-1">
                      Goles Azules {lastMatch.goalsBlue !== lastMatch.scorersBlue.length ? `(${lastMatch.scorersBlue.length} de ${lastMatch.goalsBlue})` : `(${lastMatch.goalsBlue})`}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {groupScorers(lastMatch.scorersBlue, players).map((scorer) => (
                        <span key={scorer.id} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 text-[11px] font-medium">
                          {'⚽'.repeat(scorer.count)} {scorer.name}
                        </span>
                      ))}
                      {lastMatch.goalsBlue > lastMatch.scorersBlue.length && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px] border border-blue-200 border-dashed">
                          ⚽ +{lastMatch.goalsBlue - lastMatch.scorersBlue.length} sin asignar
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600 block mb-1">
                      Goles Blancos {lastMatch.goalsWhite !== lastMatch.scorersWhite.length ? `(${lastMatch.scorersWhite.length} de ${lastMatch.goalsWhite})` : `(${lastMatch.goalsWhite})`}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {groupScorers(lastMatch.scorersWhite, players).map((scorer) => (
                        <span key={scorer.id} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {'⚽'.repeat(scorer.count)} {scorer.name}
                        </span>
                      ))}
                      {lastMatch.goalsWhite > lastMatch.scorersWhite.length && (
                        <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[11px] border border-slate-200 border-dashed">
                          ⚽ +{lastMatch.goalsWhite - lastMatch.scorersWhite.length} sin asignar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            {lastMatch && (() => {
              const chronicle = chronicles.find((c) => c.matchId === lastMatch.id);
              if (!chronicle) return null;
              return (
                <button
                  onClick={() => openChronicle(chronicle.id)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Leer crónica oficial</span>
                </button>
              );
            })()}
            <button
              onClick={() => setActiveTab('partidos')}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer ml-auto transition-colors"
            >
              Registrar nuevo partidillo →
            </button>
          </div>
        </div>

        {/* Top Scorers */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Pichichis
              </span>
              <button
                onClick={() => setActiveTab('jugadores')}
                className="text-xs font-semibold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {topScorers.map((player, idx) => (
                <div
                  key={player.id}
                  onClick={() => setActiveTab('jugadores')}
                  className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={player.photoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={getPlayerPhotoStyle(player)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors block"
                          title={player.nickname ? `${player.name} ("${player.nickname}")` : player.name}
                        >
                          {player.nickname ? player.nickname : player.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${player.preferredSide === 'Azules' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      </div>
                      <span className="text-xs text-slate-400">
                        {player.matchesPlayed} pachangas jugadas
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-black text-lg text-blue-600 block leading-none">
                      {player.goals}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Goles
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setActiveTab('jugadores')}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors text-center block cursor-pointer"
            >
              Consultar estadísticas individuales y fechas de goles
            </button>
          </div>
        </div>
      </div>

      {/* Latest Photos Preview / Compact Gallery Module */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900">
                Fotos de las Pachangas & Galería
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visor interactivo de fotos de los partidos, anécdotas y momentos del club
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('galeria')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Subir Foto
              </button>
            )}
            <button
              onClick={() => setActiveTab('galeria')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ir a la galería completa ({photos.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {photos.length > 0 ? (
          <FeaturedGalleryViewer
            photos={photos}
            currentIndex={activePhotoIndex}
            onSelectIndex={setActivePhotoIndex}
            onOpenFullscreen={(idx) => setLightboxIndex(idx)}
            formatDate={formatPhotoDate}
            compact={true}
          />
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            No hay fotos disponibles en la galería todavía.
          </div>
        )}
      </div>

      {/* Modal Lightbox para pantalla completa desde el Inicio */}
      {lightboxIndex !== null && photos.length > 0 && (
        <LightboxModal
          photos={photos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => {
            setLightboxIndex(newIdx);
            setActivePhotoIndex(newIdx);
          }}
        />
      )}
    </div>
  );
};

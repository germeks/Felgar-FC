import React from 'react';
import { useClub } from '../context/ClubContext';
import { Crest } from './Crest';
import { Calendar, Users, Camera, ArrowRight, Flame, MapPin, Award, PlusCircle, BarChart3 } from 'lucide-react';

export const HomeSection: React.FC = () => {
  const { matches, players, photos, stats, setActiveTab } = useClub();

  // Latest match
  const lastMatch = matches[0];

  // Top 3 scorers
  const topScorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 3);

  // Latest 3 photos
  const latestPhotos = photos.slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Hero Peña Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950/60 to-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          {/* Left Column: Friends Team Concept */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-blue-400" />
                Equipo de Amigos
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                • Partidillos Azules vs Blancos
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight leading-none">
                FELGAR <span className="text-blue-400">FC</span>
              </h1>
              <p className="text-lg sm:text-xl font-display font-semibold text-slate-200 tracking-wide">
                El clásico de cada semana: <span className="text-blue-400">Azules</span> contra <span className="text-slate-100">Blancos</span>
              </p>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Somos un grupo de amigos unidos por el fútbol y el buen ambiente. No jugamos ligas ni contra rivales externos: nos dividimos en dos equipos (Azules y Blancos) y dejamos el sudor en la pista. Registra resultados, goleadores, alineaciones y sube las fotos de cada jornada.
            </p>

            {/* Quick action buttons - Standardized clean sizing */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('partidos')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Ver Pachangas & Duelos</span>
              </button>
              <button
                onClick={() => setActiveTab('jugadores')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Estadísticas</span>
              </button>
              <button
                onClick={() => setActiveTab('galeria')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Galería de Fotos</span>
              </button>
            </div>
          </div>

          {/* Right Column: Next Fixture Card between Friends */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center w-full max-w-sm text-center">
              <Crest size="xl" className="my-1 transform hover:scale-105 transition-transform duration-300" />

              <div className="mt-4 pt-4 border-t border-slate-800 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-blue-400" /> Próxima Pachanga Semanal
                </span>

                <div className="mt-3 flex items-center justify-between px-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <span className="font-display font-black text-sm text-blue-400 block">AZULES</span>
                    <span className="text-[10px] text-slate-400">{stats.blueWins} Victorias</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 font-display font-black text-xs text-blue-300">
                    VS
                  </div>
                  <div className="text-center">
                    <span className="font-display font-black text-sm text-white block">BLANCOS</span>
                    <span className="text-[10px] text-slate-400">{stats.whiteWins} Victorias</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Lunes • 22:00 h
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" /> Polideportivo Vicente del Bosque
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duel Scoreboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Matches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pachangas</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-white">{stats.totalMatches}</span>
              <span className="text-xs font-bold text-slate-400">jugadas</span>
            </div>
          </div>
        </div>

        {/* Blue Team Wins */}
        <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="w-4 h-4 rounded-full bg-blue-500" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Gana Azules</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-blue-300">{stats.blueWins}</span>
              <span className="text-xs font-medium text-slate-400">victorias ({stats.goalsBlue} goles)</span>
            </div>
          </div>
        </div>

        {/* White Team Wins */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-100 border border-slate-600 flex items-center justify-center flex-shrink-0">
            <span className="w-4 h-4 rounded-full bg-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">Gana Blancos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-slate-100">{stats.whiteWins}</span>
              <span className="text-xs font-medium text-slate-400">victorias ({stats.goalsWhite} goles)</span>
            </div>
          </div>
        </div>

        {/* Friends Roster */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Amigos Inscritos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-2xl text-white">{players.length}</span>
              <span className="text-xs font-medium text-slate-400">jugadores</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Highlights Grid: Latest Pachanga Spotlight + Top Scorers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Latest Match Spotlight */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Última Pachanga Disputada
              </span>
              <button
                onClick={() => setActiveTab('partidos')}
                className="text-xs font-semibold text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver todas las pachangas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lastMatch && (
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-300">{lastMatch.title}</span>
                  <span>{lastMatch.date}</span>
                </div>

                <div className="flex items-center justify-around py-3">
                  <div className="text-center">
                    <span className="font-display font-black text-lg text-blue-400 block">
                      EQUIPO AZUL
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {lastMatch.scorersBlue.length} goles
                    </span>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className={`font-display font-black text-3xl ${
                      lastMatch.goalsBlue > lastMatch.goalsWhite ? 'text-blue-400' : 'text-slate-300'
                    }`}>
                      {lastMatch.goalsBlue}
                    </span>
                    <span className="font-black text-xl text-slate-600">:</span>
                    <span className={`font-display font-black text-3xl ${
                      lastMatch.goalsWhite > lastMatch.goalsBlue ? 'text-white' : 'text-slate-400'
                    }`}>
                      {lastMatch.goalsWhite}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="font-display font-black text-lg text-slate-100 block">
                      EQUIPO BLANCO
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {lastMatch.scorersWhite.length} goles
                    </span>
                  </div>
                </div>

                {/* Scorers preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="font-bold text-blue-400 block mb-1">Goles Azules:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastMatch.scorersBlue.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[11px]">
                          ⚽ {s.playerName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-slate-300 block mb-1">Goles Blancos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lastMatch.scorersWhite.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">
                          ⚽ {s.playerName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('partidos')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              Registrar nuevo resultado del partidillo →
            </button>
          </div>
        </div>

        {/* Top Scorers */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Pichichis de la Peña
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
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-black text-xs ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors block">
                          {player.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${player.preferredSide === 'Azules' ? 'bg-blue-500' : 'bg-slate-200'}`} />
                      </div>
                      <span className="text-xs text-slate-400">
                        {player.matchesPlayed} pachangas jugadas
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-black text-lg text-blue-400 block leading-none">
                      {player.goals}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
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
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-center block cursor-pointer"
            >
              Consultar estadísticas individuales y fechas de goles
            </button>
          </div>
        </div>
      </div>

      {/* Latest Photos Preview */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              <h2 className="font-display font-black text-2xl text-white">
                Fotos de las Pachangas & Galería
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Imágenes de los partidos, anécdotas en el campo y fotos con los amigos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('galeria')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Subir Foto
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver todas ({photos.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {latestPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActiveTab('galeria')}
              className="relative h-60 rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 cursor-pointer group shadow-lg"
            >
              <img
                src={photo.url}
                alt={photo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent opacity-80" />

              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-white border border-slate-700">
                {photo.date}
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  {photo.category}
                </span>
                <h4 className="font-display font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors">
                  {photo.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

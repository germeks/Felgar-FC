import React from 'react';
import { Crest } from './Crest';
import { useClub } from '../context/ClubContext';
import { MapPin, Users, Heart, Calendar } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, stats } = useClub();

  const handleNavigate = (tab: 'inicio' | 'partidos' | 'jugadores' | 'galeria') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 text-xs mt-16">
      {/* Friendly Motto Banner */}
      <div className="border-b border-slate-300 bg-slate-50/50 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block border border-slate-300" />
            Felgar FC
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span>Marcador Histórico:</span>
            <span className="text-blue-700">Azules {stats.blueWins}</span>
            <span>-</span>
            <span className="text-slate-900">Blancos {stats.whiteWins}</span>
            <span className="text-slate-500">({stats.draws} empates)</span>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Col 1: Brand & Identity */}
        <div className="space-y-3">
          <div
            onClick={() => handleNavigate('inicio')}
            className="flex items-center gap-3 cursor-pointer group w-fit"
          >
            <Crest size="sm" />
            <div>
              <span className="font-display font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors tracking-wide block">
                FELGAR <span className="text-blue-400">FC</span>
              </span>
            </div>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
            Más de 30 años juntándonos para hacer lo que más nos gusta: jugar al fútbol, competir entre amigos y pasar un buen rato. Azules contra Blancos, goles, piques, risas y muchas historias dentro y fuera de la pista.
          </p>
        </div>

        {/* Col 2: Secciones */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
            Secciones de la Web
          </h4>
          <ul className="space-y-2 text-slate-600">
            <li>
              <button
                onClick={() => handleNavigate('inicio')}
                className="hover:text-blue-700 transition-colors cursor-pointer"
              >
                Panel de Inicio & Resumen
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('partidos')}
                className="hover:text-blue-700 transition-colors cursor-pointer"
              >
                Historial de Pachangas & Goleadores
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('jugadores')}
                className="hover:text-blue-700 transition-colors cursor-pointer"
              >
                Estadísticas de Jugadores & Goles
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigate('galeria')}
                className="hover:text-blue-700 transition-colors cursor-pointer"
              >
                Galería de Fotos & Recuerdos
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: La Pista y Las Reglas */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-700" /> Sede & Convocatoria
          </h4>
          <div className="space-y-2 text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>
                Polideportivo Vicente del Bosque<br />
                Pachangas semanales a las 22:00 h
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>Convocatoria por el grupo de WhatsApp</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <span>Equipos: Camiseta Azul vs Camiseta Blanca</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="border-t border-slate-300 py-5 px-4 text-center text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          © 2026 Felgar FC • Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> para los jugadores.
        </p>
      </div>
    </footer>
  );
};

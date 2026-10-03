import React from 'react';
import { useClub } from '../context/ClubContext';
import { Home, Calendar, BarChart3, Newspaper, Camera } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, chronicles } = useClub();

  const navItems: {
    id: 'inicio' | 'partidos' | 'jugadores' | 'cronicas' | 'galeria';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'partidos', label: 'Pachangas', icon: Calendar },
    { id: 'jugadores', label: 'Estadísticas', icon: BarChart3 },
    {
      id: 'cronicas',
      label: 'Crónicas',
      icon: Newspaper,
      badge: chronicles.length > 0 ? chronicles.length : undefined,
    },
    { id: 'galeria', label: 'Galería', icon: Camera },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-all select-none"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className={`relative flex flex-col items-center justify-center h-full w-full min-h-[48px] py-1 cursor-pointer transition-all duration-150 active:scale-95 ${
                isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {/* Active top accent indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-full shadow-xs animate-in fade-in zoom-in-50 duration-200" />
              )}

              {/* Icon with potential badge */}
              <div className="relative mt-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-3.5 h-3.5 flex items-center justify-center text-[9px] font-black bg-blue-600 text-white rounded-full border border-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-0.5 ${
                  isActive ? 'font-bold text-blue-600' : 'font-medium text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

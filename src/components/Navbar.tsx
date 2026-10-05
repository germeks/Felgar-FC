import React, { useState, useRef } from 'react';
import { Crest } from './Crest';
import { useClub } from '../context/ClubContext';
import { AdminUnlockModal } from './AdminUnlockModal';
import { Calendar, Users, Camera, Home, Menu, X, PlusCircle, RotateCcw, Flame, ShieldCheck, BarChart3, Newspaper, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, stats, resetToDefaults, isAdmin, chronicles, logoutSite } = useClub();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSecretLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSecretClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setShowAdminModal(true);
        return 0;
      }
      return next;
    });

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setSecretClicks(0);
    }, 2500);
  };

  const navItems: { id: 'inicio' | 'partidos' | 'jugadores' | 'cronicas' | 'galeria'; label: string; fullLabel?: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'inicio', label: 'Inicio', fullLabel: 'Inicio', icon: <Home className="w-4 h-4" /> },
    { id: 'partidos', label: 'Pachangas', fullLabel: 'Pachangas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'jugadores', label: 'Estadísticas', fullLabel: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cronicas', label: 'Crónicas', fullLabel: 'Crónicas de Partido', icon: <Newspaper className="w-4 h-4" />, badge: chronicles.length > 0 ? String(chronicles.length) : undefined },
    { id: 'galeria', label: 'Galería', fullLabel: 'Galería de Fotos', icon: <Camera className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 shadow-xl">
      {/* Top micro bar with club status */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-slate-50 text-slate-500 text-xs py-1.5 px-4 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-slate-500 font-semibold text-xs">
              Marcador Histórico: <strong className="text-blue-400">{stats.blueWins} Azules</strong> vs <strong className="text-slate-800">{stats.whiteWins} Blancos</strong> ({stats.draws} empates)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1 text-slate-500 font-semibold whitespace-nowrap">
              <Flame className="w-3.5 h-3.5 text-red-500" /> {stats.totalMatches} Pachangas Jugadas
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Activo</span>
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="text-[10px] text-emerald-400 hover:text-slate-900 underline cursor-pointer ml-1"
                >
                  (Gestionar)
                </button>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  if (confirmReset) {
                    resetToDefaults();
                    setConfirmReset(false);
                  } else {
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 3500);
                  }
                }}
                title="Restaurar datos predeterminados"
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                {confirmReset ? '¿Confirmar reinicio?' : 'Restaurar demo'}
              </button>
            )}
            <button
              onClick={logoutSite}
              title="Cerrar sesión y bloquear acceso al club"
              className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer ml-1 px-2 py-0.5 rounded-full hover:bg-slate-200/60"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation bar - more compact height */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">
          {/* Menu bar custom notch / tab extending downward to cover the crest with rounded shape */}
          <div
            className="absolute -left-1.5 sm:-left-2 lg:-left-2.5 w-[68px] sm:w-[88px] lg:w-[100px] top-[calc(100%-2px)] h-[18px] sm:h-[26px] lg:h-[30px] bg-slate-50 border-b border-l border-r border-slate-200/90 rounded-b-2xl shadow-lg pointer-events-none z-30"
            aria-hidden="true"
          />

          {/* Logo & Brand with secret 3-click trigger on the Crest - larger and protruding downward */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              onClick={handleSecretLogoClick}
              className="relative z-50 cursor-pointer select-none group/crest transition-all duration-200 hover:scale-105 active:scale-95 translate-y-2 sm:translate-y-3.5"
              title={isAdmin ? "Modo Administrador activado (Haz 3 clics para gestionar)" : "Escudo Felgar FC (3 clics para acceso de administrador)"}
            >
              <div className="w-14 h-14 sm:w-18 sm:h-18 lg:w-20 lg:h-20 flex-shrink-0 drop-shadow-xl filter transition-transform">
                <img
                  src="/logo.png"
                  alt="Felgar FC Escudo"
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>
              {secretClicks > 0 && secretClicks < 3 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-black text-white flex items-center justify-center animate-bounce shadow">
                  {secretClicks}
                </span>
              )}
            </div>
            <div
              onClick={() => setActiveTab('inicio')}
              className="flex flex-col cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-slate-900 group-hover:text-blue-600 transition-colors">
                  FELGAR <span className="text-blue-600">FC</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links - Uniform Button Size */}
          <nav className="hidden md:flex items-center gap-1 bg-white/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center gap-2 w-36 lg:w-40 xl:w-44 h-9 sm:h-9.5 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.fullLabel || item.label}</span>
                  <span className="xl:hidden">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action buttons - Only visible for admin */}
          {isAdmin && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setActiveTab('partidos')}
                className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Añadir Pachanga</span>
              </button>
              <button
                onClick={() => setActiveTab('galeria')}
                className="flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Subir Foto</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-blue-400 text-slate-900 font-bold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-slate-900' : 'bg-blue-500/20 text-blue-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-200/80">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logoutSite();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Secret Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </header>
  );
};

import React, { useState, useRef } from 'react';
import { Crest } from './Crest';
import { useClub } from '../context/ClubContext';
import { AdminUnlockModal } from './AdminUnlockModal';
import { Calendar, Users, Camera, Home, Menu, X, PlusCircle, RotateCcw, Flame, ShieldCheck, BarChart3 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, stats, resetToDefaults, isAdmin } = useClub();
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

  const navItems: { id: 'inicio' | 'partidos' | 'jugadores' | 'galeria'; label: string; fullLabel?: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'inicio', label: 'Inicio', fullLabel: 'Inicio Peña', icon: <Home className="w-4 h-4" /> },
    { id: 'partidos', label: 'Pachangas', fullLabel: 'Pachangas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'jugadores', label: 'Estadísticas', fullLabel: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'galeria', label: 'Galería', fullLabel: 'Galería de Fotos', icon: <Camera className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-xl">
      {/* Top micro bar with club status */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-slate-300 font-semibold text-xs">
              Marcador Histórico: <strong className="text-blue-400">{stats.blueWins} Azules</strong> vs <strong className="text-slate-100">{stats.whiteWins} Blancos</strong> ({stats.draws} empates)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-amber-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {stats.totalMatches} Pachangas Jugadas
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-emerald-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Activo</span>
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="text-[10px] text-emerald-400 hover:text-white underline cursor-pointer ml-1"
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
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand with secret 3-click trigger on the Crest */}
          <div className="flex items-center gap-3">
            <div
              onClick={handleSecretLogoClick}
              className="relative cursor-pointer select-none group/crest"
              title={isAdmin ? "Modo Administrador activado (Haz 3 clics para gestionar)" : "Escudo Felgar FC (3 clics para acceso de administrador)"}
            >
              <Crest size="md" />
              {secretClicks > 0 && secretClicks < 3 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-black text-white flex items-center justify-center animate-bounce shadow">
                  {secretClicks}
                </span>
              )}
            </div>
            <div
              onClick={() => setActiveTab('inicio')}
              className="flex flex-col cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl tracking-wider text-white group-hover:text-blue-400 transition-colors">
                  FELGAR <span className="text-blue-400">FC</span>
                </span>
              </div>
              <span className="text-[11px] font-medium tracking-wide text-slate-400 hidden sm:block">
                Azules vs Blancos
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links - Uniform Button Size */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center gap-2 w-44 xl:w-48 h-10 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:inline">{item.fullLabel || item.label}</span>
                  <span className="xl:hidden">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
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
            <div className="hidden lg:flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('partidos')}
                className="flex items-center justify-center gap-2 w-40 h-10 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Añadir Pachanga</span>
              </button>
              <button
                onClick={() => setActiveTab('galeria')}
                className="flex items-center justify-center gap-2 w-40 h-10 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Subir Foto</span>
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-5 space-y-1">
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
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
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

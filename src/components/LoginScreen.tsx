import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoginScreen: React.FC = () => {
  const { loginSite } = useClub();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (!password.trim()) {
      setError(true);
      return;
    }

    const ok = loginSite(password);
    if (ok) {
      setSuccess(true);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#F59E0B', '#FFFFFF'],
        });
      } catch {
        // Confetti fallback
      }
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-200 text-slate-900 text-center relative overflow-hidden">
          {/* Subtle top decorative bar with club colors */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-500" />

          {/* Club Crest */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 drop-shadow-xl transform hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Escudo oficial de Felgar FC"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Acceso Privado</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight leading-none">
              FELGAR <span className="text-blue-600">FC</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Web oficial del club de amigos • Azules vs Blancos
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Introduce la contraseña para consultar el historial de pachangas, goleadores, crónicas y galería del equipo.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="club-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Contraseña del Club
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="club-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  autoFocus
                  placeholder="Introduce la contraseña..."
                  className={`w-full bg-slate-50 border ${
                    error
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500/20'
                  } rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Contraseña incorrecta. Inténtalo de nuevo.</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold mt-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>¡Contraseña correcta! Entrando a Felgar FC...</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={success}
              className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <span>{success ? 'Accediendo...' : 'Entrar al Club'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
            <span>¿No sabes la clave? Pídela por el grupo del club</span>
          </div>
        </div>

        {/* Small copyright below card */}
        <p className="text-center text-xs text-slate-400 mt-4">
          © Felgar FC • Más de 30 años de fútbol y amistad
        </p>
      </div>
    </div>
  );
};

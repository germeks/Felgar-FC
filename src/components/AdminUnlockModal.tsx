import React, { useState } from 'react';
import { useClub } from '../context/ClubContext';
import { ShieldCheck, Lock, Unlock, X, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({ isOpen, onClose }) => {
  const { isAdmin, loginAdmin, logoutAdmin } = useClub();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    if (!password.trim()) {
      setError(true);
      return;
    }

    const ok = loginAdmin(password);
    if (ok) {
      setSuccess(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
      setTimeout(() => {
        setSuccess(false);
        setPassword('');
        onClose();
      }, 1200);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setPassword('');
    setError(false);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-950/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl border ${
            isAdmin
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              {isAdmin ? 'Modo Administrador Activo' : 'Panel Secreto de Administración'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'Todos los permisos de edición están habilitados'
                : 'Protección de veracidad de datos de Felgar FC'}
            </p>
          </div>
        </div>

        {isAdmin ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Tienes permisos para <strong>añadir nuevas pachangas</strong>, <strong>inscribir jugadores</strong>, <strong>editar estadísticas</strong> y <strong>subir fotos</strong>.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Bloquear / Cerrar Sesión
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Para evitar modificaciones no autorizadas en los goles y resultados, introduce la clave para desbloquear el sistema.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Contraseña Secreta
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Introduce la clave secreta..."
                  className={`w-full bg-slate-950 border ${
                    error ? 'border-rose-500 focus:border-rose-400' : 'border-slate-700 focus:border-blue-500'
                  } rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {error && (
                <div className="flex items-center gap-1 text-[11px] text-rose-400 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Contraseña incorrecta. Inténtalo de nuevo.</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>¡Contraseña correcta! Desbloqueando todo...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Desbloquear Todo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

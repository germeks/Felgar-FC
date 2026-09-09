import React from 'react';

interface CrestProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const Crest: React.FC<CrestProps> = ({ className = '', size = 'md', showText = false, onClick }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? 'cursor-pointer select-none' : ''} ${className}`}
    >
      <div className={`relative ${sizeClasses} flex-shrink-0 drop-shadow-md`}>
        <img src="/logo.png" alt="Felgar FC Escudo" className="w-full h-full object-contain" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black tracking-wider text-xl leading-none text-white">
              FELGAR <span className="text-blue-400">FC</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              AMIGOS
            </span>
          </div>
          <span className="text-[11px] font-medium tracking-wider text-slate-400">
            Azules vs Blancos • Pachangas
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
  };

  return (
    <div id="fabric-reality-brand-logo" className={`flex items-center gap-3 select-none ${className}`}>
      {/* Elegant Dark Gold Monogram & Needle Emblem */}
      <div className={`relative ${iconSizes[size]} bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20 group hover:scale-105 transition-transform`}>
        <span className="text-black font-black text-lg italic tracking-tighter leading-none select-none">
          FR
        </span>
        {/* Subtle glowing thread dot */}
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_8px_rgba(254,240,138,0.9)] animate-pulse" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-light tracking-[0.2em] uppercase text-white ${textSizes[size]}`}>
            Fabric <span className="font-bold text-amber-500">Reality</span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-[0.3em] font-semibold text-amber-400/80 uppercase mt-1">
            Bespoke Haute Couture
          </span>
        </div>
      )}
    </div>
  );
};


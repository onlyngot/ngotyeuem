import React from 'react';
import { ImageEffectType } from '@/src/data/artStorage';

interface DecoratedImageProps {
  src: string;
  alt?: string;
  effect?: ImageEffectType;
  className?: string;
  imageClassName?: string;
  showAura?: boolean;
}

export default function DecoratedImage({
  src,
  alt = 'Artwork',
  effect = 'none',
  className = '',
  imageClassName = '',
  showAura = false,
}: DecoratedImageProps) {
  let animationClass = '';
  if (effect === 'bunny-jump') animationClass = 'animate-bunny-jump';
  else if (effect === 'floating') animationClass = 'animate-float-soft';
  else if (effect === 'pulse') animationClass = 'animate-pulse-soft';
  else if (effect === 'wiggle') animationClass = 'animate-wiggle-soft';
  else if (effect === 'spin-pop') animationClass = 'animate-spin-pop';
  else if (effect === 'wobble-spin') animationClass = 'animate-wobble-spin';
  else if (effect === 'bounce-tilt') animationClass = 'animate-bounce-tilt';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Soft circular aura glow if enabled or effect is soft-glow */}
      {(showAura || effect === 'soft-glow') && (
        <div
          className="absolute w-48 h-48 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
          style={{
            background:
              'radial-gradient(circle, var(--theme-border-glow, rgba(255, 194, 209, 0.65)) 0%, var(--theme-accent-glow, rgba(255, 143, 171, 0.35)) 40%, transparent 72%)',
            filter: 'blur(18px)',
          }}
        />
      )}

      {/* Orbiting Sparkles Effect */}
      {effect === 'sparkles' && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <span className="absolute -top-2 -left-2 text-sm animate-bounce">✨</span>
          <span className="absolute -top-3 right-0 text-xs animate-pulse" style={{ animationDelay: '0.4s' }}>🌸</span>
          <span className="absolute -bottom-2 -right-2 text-sm animate-bounce" style={{ animationDelay: '0.8s' }}>✨</span>
          <span className="absolute bottom-0 -left-3 text-xs animate-pulse" style={{ animationDelay: '1.2s' }}>💖</span>
        </div>
      )}

      {/* Polaroid / Vintage Frame Effect */}
      {effect === 'polaroid' ? (
        <div className="p-2 sm:p-2.5 pb-4 bg-[var(--theme-card-bg,#fffff2)] rounded-2xl border-2 border-[var(--theme-border,#ffb3c6)] shadow-md transform rotate-[-1.5deg] hover:rotate-0 transition duration-300 relative group">
          {/* Cute Washi Tape at Top */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 rounded-xs shadow-2xs opacity-85 pointer-events-none"
            style={{
              backgroundColor: 'var(--theme-accent,#ff8fab)',
              clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
            }}
          />
          <img
            src={src}
            alt={alt}
            className={`max-h-48 w-auto object-contain rounded-xl select-none ${imageClassName}`}
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      ) : (
        /* Standard Decorated Image */
        <div className={`relative ${animationClass} z-10 flex items-center justify-center`}>
          <img
            src={src}
            alt={alt}
            className={`max-h-48 w-auto object-contain select-none ${imageClassName}`}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

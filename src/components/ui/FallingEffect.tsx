import { useState, useEffect, useMemo } from 'react';
import { getFallingEffectSettings, FallingEffectSettings } from '@/src/data/artStorage';

const PRESET_EMOJIS: Record<string, string[]> = {
  strawberry: ['🍓', '🍓', '🍓', '🍰', '🌸'],
  sakura: ['🌸', '🌺', '🌸', '✨', '🌸'],
  sparkle: ['✨', '⭐', '🌟', '✦', '✧'],
  bow: ['🎀', '🎀', '🌸', '💖', '🎀'],
  heart: ['💖', '💕', '💗', '💓', '♥'],
  bunny: ['🐇', '🐰', '🌸', '🍓', '🐇'],
  sweet_candy: ['🍬', '🍭', '🧁', '🍩', '✨'],
  angel_wings: ['🕊️', '🪶', '✨', '☁️', '🤍'],
  starry_night: ['⭐', '🌟', '✨', '💫', '🌙'],
  pastel_blossom: ['🌸', '💮', '🌷', '🌿', '🎀'],
  clover_luck: ['🍀', '✨', '💚', '🌱', '⭐'],
};

interface Particle {
  id: string;
  index: number;
  left: number; // percentage 0 - 100
  duration: number; // seconds
  delay: number; // seconds negative so already falling
  driftX: number; // px drift left/right
  rotation: number; // deg
  scale: number;
  content: string;
}

export default function FallingEffect() {
  const [settings, setSettings] = useState<FallingEffectSettings>(getFallingEffectSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getFallingEffectSettings());
    };

    window.addEventListener('caomei_falling_effect_updated', handleUpdate);
    window.addEventListener('yimeo_palette_updated', handleUpdate);
    return () => {
      window.removeEventListener('caomei_falling_effect_updated', handleUpdate);
      window.removeEventListener('yimeo_palette_updated', handleUpdate);
    };
  }, []);

  // Determine number of particles based on density
  const particleCount = useMemo(() => {
    switch (settings.density) {
      case 'few':
        return 14;
      case 'many':
        return 38;
      case 'medium':
      default:
        return 24;
    }
  }, [settings.density]);

  // Determine base duration in seconds based on speed
  const baseDuration = useMemo(() => {
    switch (settings.speed) {
      case 'slow':
        return 9;
      case 'fast':
        return 3.8;
      case 'normal':
      default:
        return 6;
    }
  }, [settings.speed]);

  // Determine size in pixels based on size setting
  const sizePx = useMemo(() => {
    switch (settings.size) {
      case 'small':
        return 20;
      case 'large':
        return 42;
      case 'medium':
      default:
        return 30;
    }
  }, [settings.size]);

  // Generate deterministic particle attributes
  const particles = useMemo<Particle[]>(() => {
    if (!settings.enabled) return [];

    const items = PRESET_EMOJIS[settings.preset] || PRESET_EMOJIS.strawberry;
    const generated: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const left = Math.round((i * (100 / particleCount) + (i % 7) * 3) % 98);
      const durationVariation = ((i % 5) - 2) * (baseDuration * 0.18);
      const duration = Math.max(2.5, baseDuration + durationVariation);
      // Stagger delays so particles are immediately spread vertically across the viewport
      const delay = -1 * ((i * 1.3) % duration);
      const driftX = ((i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 15));
      const rotation = (i % 2 === 0 ? 1 : -1) * (180 + (i % 6) * 60);
      const scale = 0.8 + ((i % 4) * 0.12);
      const content = items[i % items.length];

      generated.push({
        id: `falling_p_${i}`,
        index: i,
        left,
        duration,
        delay,
        driftX,
        rotation,
        scale,
        content,
      });
    }

    return generated;
  }, [settings.enabled, settings.preset, particleCount, baseDuration]);

  // Glow shadow styling based on admin setting (or theme default)
  const glowColor = settings.glowColor && settings.glowColor !== '#ff9ebb' ? settings.glowColor : 'var(--theme-bubble-shadow, #ff9ebb)';
  const customImagesList = settings.customImages && settings.customImages.length > 0 
    ? settings.customImages 
    : (settings.customImageUrl ? [settings.customImageUrl] : []);

  if (!settings.enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[45] overflow-hidden select-none"
    >
      <style>{`
        @keyframes caomeiFallDown {
          0% {
            transform: translate3d(0, -60px, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.95;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(var(--drift-x), 108vh, 0) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>

      {particles.map((p) => {
        const customImg = customImagesList.length > 0 
          ? customImagesList[p.index % customImagesList.length] 
          : null;

        return (
          <div
            key={p.id}
            className="absolute top-0 will-change-transform flex items-center justify-center relative"
            style={
              {
                left: `${p.left}%`,
                animationName: 'caomeiFallDown',
                animationDuration: `${p.duration}s`,
                animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                animationIterationCount: 'infinite',
                animationDelay: `${p.delay}s`,
                '--drift-x': `${p.driftX}px`,
                '--rot': `${p.rotation}deg`,
                fontSize: `${sizePx * p.scale}px`,
                width: `${sizePx * p.scale * 1.3}px`,
                height: `${sizePx * p.scale * 1.3}px`,
              } as React.CSSProperties
            }
          >
            {/* Bóng thực sự của vật thể rơi theo đúng đường viền (không dùng khối tròn mờ) */}
            {settings.type === 'custom' && customImg ? (
              <img
                src={customImg}
                alt="Falling object"
                style={{
                  filter: `drop-shadow(2px 3px 2px ${glowColor}) drop-shadow(0 1px 1px ${glowColor})`,
                }}
                className="relative z-10 w-full h-full object-contain select-none"
              />
            ) : (
              <span
                style={{
                  filter: `drop-shadow(2px 3px 2px ${glowColor}) drop-shadow(0 1px 1px ${glowColor})`,
                }}
                className="relative z-10 select-none inline-block"
              >
                {p.content}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

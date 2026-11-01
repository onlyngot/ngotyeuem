import { useEffect, useState } from 'react';
import { getClickBurstSettings, ClickBurstSettings, ClickEffectStyle } from '@/src/data/artStorage';
import { playCuteSound } from '@/src/utils/soundEffects';

interface BurstParticle {
  id: string;
  seed: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  opacity: number;
  age: number;
  style: ClickEffectStyle;
  item: {
    type: 'emoji' | 'image';
    content: string;
  };
}

interface ClickRipple {
  id: string;
  x: number;
  y: number;
}

const PRESET_EMOJIS: Record<string, string[]> = {
  hearts: ['💖', '💕', '💗', '💓', '✨'],
  strawberries: ['🍓', '🌸', '✨', '🍓', '🍰'],
  stars: ['⭐', '🌟', '✨', '💫', '🌠'],
  sparkles: ['✨', '💎', '💫', '✧', '✦'],
  sakura: ['🌸', '🌺', '✨', '🍃', '🌸'],
  bows: ['🎀', '✨', '💖', '🎀', '🍬'],
  mixed: ['💖', '🍓', '✨', '🌸', '🎀', '⭐', '🍬', '🐰'],
};

export default function ClickBurstEffect() {
  const [settings, setSettings] = useState<ClickBurstSettings>(getClickBurstSettings());
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setSettings(e.detail || getClickBurstSettings());
    };
    window.addEventListener('yimeo_click_burst_updated', handleUpdate);
    return () => window.removeEventListener('yimeo_click_burst_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!settings.enabled) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      // Don't burst on input or textarea typing
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      let clientX = 0;
      let clientY = 0;

      if ('clientX' in e && typeof e.clientX === 'number') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ('touches' in e && (e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0].clientX;
        clientY = (e as TouchEvent).touches[0].clientY;
      } else {
        return;
      }

      if (clientX === 0 && clientY === 0) return;

      // Play cute sound on click
      playCuteSound('pop');

      const clickStyle = settings.style || 'combo';

      // 1. Spawning ripples centered precisely at touch point (r.x, r.y)
      if (clickStyle === 'ripple' || clickStyle === 'combo') {
        const rippleId = `rip_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        setRipples((prev) => [...prev.slice(-8), { id: rippleId, x: clientX, y: clientY }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== rippleId));
        }, 800);
      }

      // 2. If style is strictly 'ripple', skip particle spawning
      if (clickStyle === 'ripple') return;

      const count = Math.max(3, Math.min(14, settings.particleCount || 8));
      const newItems: BurstParticle[] = [];

      const customList = settings.customImages || [];
      const hasCustom = customList.length > 0;
      const emojiPool = PRESET_EMOJIS[settings.preset] || PRESET_EMOJIS.mixed;
      const batchTimestamp = Date.now();

      for (let i = 0; i < count; i++) {
        let vx = 0;
        let vy = 0;

        if (clickStyle === 'floating') {
          // Floating up gently like sweet dream bubbles
          vx = (Math.random() - 0.5) * 2.2;
          vy = -(1.8 + Math.random() * 2.5);
        } else if (clickStyle === 'sparkle_burst') {
          // Fast sparkling firework burst
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
          const speed = 4.5 + Math.random() * 4.0;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
        } else {
          // Standard burst or combo
          const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
          const speed = 2.5 + Math.random() * 4.2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 1.2;
        }

        let item: { type: 'emoji' | 'image'; content: string };

        if (settings.preset === 'custom' && hasCustom) {
          item = {
            type: 'image',
            content: customList[Math.floor(Math.random() * customList.length)],
          };
        } else if (hasCustom && Math.random() > 0.5) {
          item = {
            type: 'image',
            content: customList[Math.floor(Math.random() * customList.length)],
          };
        } else {
          item = {
            type: 'emoji',
            content: emojiPool[Math.floor(Math.random() * emojiPool.length)],
          };
        }

        newItems.push({
          id: `burst_${batchTimestamp}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          seed: Math.random() * 10,
          x: clientX,
          y: clientY,
          vx,
          vy,
          scale: 0.85 + Math.random() * 0.45,
          rotation: (Math.random() - 0.5) * 50,
          opacity: 1,
          age: 0,
          style: clickStyle,
          item,
        });
      }

      setParticles((prev) => [...prev.slice(-35), ...newItems]);
    };

    window.addEventListener('pointerdown', handleClick, { capture: true, passive: true });
    return () => window.removeEventListener('pointerdown', handleClick, { capture: true } as any);
  }, [settings]);

  // Particle Physics Animation Loop - exactly as originally designed
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => {
            const age = p.age + 1;
            let vx = p.vx;
            let vy = p.vy;
            let opacity = p.opacity;
            let scale = p.scale;

            if (p.style === 'floating') {
              // Gentle upward float with soft sine sway
              vy = vy * 0.98 - 0.05;
              vx = Math.sin(age * 0.15 + p.seed) * 1.2;
              opacity = Math.max(0, opacity - 0.022);
              scale = Math.max(0, scale - 0.01);
            } else {
              // Burst gravity
              vy = vy + 0.16;
              scale = Math.max(0, scale - 0.024);
              opacity = Math.max(0, opacity - 0.032);
            }

            return {
              ...p,
              x: p.x + vx,
              y: p.y + vy,
              vx,
              vy,
              age,
              scale,
              opacity,
              rotation: p.rotation + (vx > 0 ? 2.5 : -2.5),
            };
          })
          .filter((p) => p.opacity > 0.05 && p.scale > 0.1)
      );
    }, 24);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (!settings.enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Expanding Water Ripple Rings - Centered on exact touch/click coordinate */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute pointer-events-none"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
          }}
        >
          {/* Inner ripple ring */}
          <div
            className="absolute top-0 left-0 w-16 h-16 rounded-full border-2 animate-ripple-expand shadow-sm pointer-events-none"
            style={{
              borderColor: 'var(--theme-accent, #ff8fab)',
              backgroundColor:
                'color-mix(in srgb, var(--theme-border-glow, rgba(255, 194, 209, 0.4)) 40%, transparent)',
            }}
          />
          {/* Outer softer ripple glow */}
          <div
            className="absolute top-0 left-0 w-24 h-24 rounded-full border border-dashed animate-ripple-expand opacity-70 pointer-events-none"
            style={{
              borderColor: 'var(--theme-border, #ffb3c6)',
              animationDelay: '0.1s',
            }}
          />
        </div>
      ))}

      {/* Floating or Burst Particles - restored 100% to original physics */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 will-change-transform pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            transition: 'transform 0.02s linear, opacity 0.02s linear',
          }}
        >
          {p.item.type === 'image' ? (
            <img
              src={p.item.content}
              alt="Particle"
              className="w-6 h-6 object-contain drop-shadow-xs"
            />
          ) : (
            <span className="text-xl leading-none drop-shadow-xs filter">{p.item.content}</span>
          )}
        </div>
      ))}
    </div>
  );
}

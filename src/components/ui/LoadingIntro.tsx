import { useState, useEffect } from 'react';
import {
  getWelcomeMascotArt,
  getLoadingBarSettings,
  LoadingBarSettings,
} from '@/src/data/artStorage';
import VietnamesePacifico from '@/src/components/ui/VietnamesePacifico';

interface LoadingIntroProps {
  onFinish?: () => void;
  autoCloseDelay?: number; // ms, default 5200ms (at least 5s)
}

function getCurrentSeasonWord(): 'xuân' | 'hạ' | 'thu' | 'đông' {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return 'xuân';
  if (month >= 4 && month <= 6) return 'hạ';
  if (month >= 7 && month <= 9) return 'thu';
  return 'đông';
}

export default function LoadingIntro({ onFinish, autoCloseDelay = 5200 }: LoadingIntroProps) {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [welcomeMascot, setWelcomeMascot] = useState<string | null>(getWelcomeMascotArt());
  const [barSettings, setBarSettings] = useState<LoadingBarSettings>(getLoadingBarSettings());

  // Mark session immediately so duplicate render never re-triggers intro unexpectedly
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('caomei_intro_shown', 'true');
    }
  }, []);

  // Sync mascot & bar settings when updated via Admin LoadingSettingsModal
  useEffect(() => {
    const handleMascotUpdate = () => {
      setWelcomeMascot(getWelcomeMascotArt());
    };
    const handleBarUpdate = (e: any) => {
      setBarSettings(e.detail || getLoadingBarSettings());
    };

    window.addEventListener('yimeo_welcome_mascot_updated', handleMascotUpdate);
    window.addEventListener('yimeo_loading_bar_updated', handleBarUpdate);
    return () => {
      window.removeEventListener('yimeo_welcome_mascot_updated', handleMascotUpdate);
      window.removeEventListener('yimeo_loading_bar_updated', handleBarUpdate);
    };
  }, []);

  // Cycling dots: "" -> "." -> ".." -> "..." -> "" -> ...
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  // Butter-smooth progress simulation: 60ms interval matching 60fps frame budgeting
  useEffect(() => {
    const stepTime = 60;
    const totalSteps = autoCloseDelay / stepTime;
    const increment = 100 / totalSteps;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(100, prev + increment);
      });
    }, stepTime);

    return () => clearInterval(progressInterval);
  }, [autoCloseDelay]);

  // Handle auto close strictly after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('caomei_intro_shown', 'true');
    }
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, 380);
  };

  if (!isVisible) return null;

  const currentSeason = getCurrentSeasonWord();

  return (
    <div
      className={`fixed inset-0 z-[1002] flex items-center justify-center p-4 transition-all duration-350 select-none ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: 'var(--theme-bg-overlay, rgba(255, 221, 231, 0.96))',
      }}
    >
      {/* Decorative floating sparkles with lightweight CSS transforms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-[16%] left-[18%] text-2xl animate-bounce">✨</span>
        <span className="absolute top-[26%] right-[16%] text-xl animate-pulse">🌸</span>
        <span className="absolute bottom-[20%] left-[22%] text-2xl animate-pulse">🎀</span>
        <span className="absolute bottom-[24%] right-[20%] text-2xl animate-bounce">✨</span>
      </div>

      {/* Retro Window themed with active palette */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border-4 shadow-2xl overflow-hidden text-[#8d2d48] will-change-transform"
        style={{
          backgroundColor: 'var(--theme-card-bg, #fffff2)',
          borderColor: 'var(--theme-border, #ffb3c6)',
          boxShadow: '0 15px 35px var(--theme-shadow, rgba(255, 179, 198, 0.45))',
        }}
      >
        {/* Retro Title Bar: "mùa này có em rùii" */}
        <div
          className="px-4 py-2.5 flex items-center justify-between border-b-2"
          style={{
            backgroundColor: 'var(--theme-bg, #ffdde7)',
            borderColor: 'var(--theme-border, #ffb3c6)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border inline-block shadow-inner"
              style={{
                backgroundColor: 'var(--theme-card-bg, #fffff2)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            />
            {/* Title: mùa này có em rùii (chỉ sửa ở welcome screen theo yêu cầu) */}
            <span
              className="text-xs font-black tracking-wider lowercase drop-shadow-xs"
              style={{ color: 'var(--theme-secondary, #8d2d48)' }}
            >
              {currentSeason} này có em rùii
            </span>
          </div>

          {/* Retro window decorative dots in palette colors */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: 'var(--theme-card-bg, #fffff2)',
              borderColor: 'var(--theme-border, #ffb3c6)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-accent, #ff8fab)' }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border, #ffb3c6)' }} />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border-light, #ffd4e0)' }} />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 flex flex-col items-center text-center relative">
          {/* Animated welcome mascot (có thể tách biệt với mascot home, tùy admin chỉnh sửa) */}
          <div className="relative w-full max-w-[340px] h-36 flex items-center justify-center mb-4 select-none">
            {/* Soft lightweight accent halo behind the artwork (no heavy blur filter) */}
            <div
              className="absolute w-44 h-44 rounded-full pointer-events-none opacity-40"
              style={{
                background: 'radial-gradient(circle, var(--theme-border-glow, #ffc2d1) 0%, transparent 70%)',
              }}
            />

            {welcomeMascot ? (
              <div className="relative animate-float-soft flex items-center justify-center z-10">
                <img
                  src={welcomeMascot}
                  alt="Welcome Mascot"
                  className="max-h-32 max-w-full h-auto select-none object-contain pointer-events-none"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
              </div>
            ) : (
              <div
                className="w-full max-w-[300px] h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 z-10"
                style={{
                  borderColor: 'var(--theme-border, #ffb3c6)',
                  backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                }}
              >
                <span className="text-3xl mb-1">🌸</span>
                <span className="text-xs font-bold" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                  Yimeo's Home
                </span>
              </div>
            )}
          </div>

          {/* Text: "Just a minute" in font Rhaikane with cycling dots */}
          <div className="mb-4">
            <h2
              className="text-3xl sm:text-4xl tracking-wide flex items-center justify-center drop-shadow-xs select-none"
              style={{ color: 'var(--theme-primary, #d45d79)' }}
            >
              <span className="font-rhaikane">Just a minute</span>
              <span
                className="font-sans font-black tracking-widest text-left inline-block w-8 ml-1 text-2xl"
                style={{ color: 'var(--theme-accent, #ff8fab)' }}
              >
                {dots}
              </span>
            </h2>

            {/* "Bé iu..." in font Pacifico with authentic native Vietnamese glyphs */}
            <div className="mt-2 text-center" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
              <VietnamesePacifico className="text-sm sm:text-base" />
            </div>
          </div>

          {/* Loading Bar with Runner Sprite & Active Effects (Ảnh 8) */}
          <div className="w-full relative mb-2 pt-4">
            {/* Outer Loading Bar Track */}
            <div
              className="w-full rounded-full h-4 sm:h-5 p-0.5 border-2 shadow-inner relative overflow-hidden transition-colors"
              style={{
                backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            >
              {/* Progress Bar Fill with Active Effect */}
              <div
                className={`h-full rounded-full transition-[width] duration-75 ease-linear relative overflow-hidden ${
                  barSettings.effect === 'candy_stripes' ? 'animate-candy-stripes' : ''
                }`}
                style={{
                  width: `${progress}%`,
                  background:
                    barSettings.effect === 'candy_stripes'
                      ? 'repeating-linear-gradient(45deg, var(--theme-accent, #ff8fab), var(--theme-accent, #ff8fab) 8px, var(--theme-primary, #d45d79) 8px, var(--theme-primary, #d45d79) 16px)'
                      : 'linear-gradient(to right, var(--theme-bubble-fill, #ffaac4), var(--theme-accent, #ff8fab), var(--theme-primary, #d45d79))',
                }}
              >
                {/* Shimmer Glow Sweep Effect */}
                {barSettings.effect === 'shimmer_glow' && (
                  <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer-sweep pointer-events-none" />
                )}

                {/* Cloud Drift / Sparkle trail inside progress */}
                {barSettings.effect === 'cloud_drift' && (
                  <div className="absolute inset-0 flex items-center justify-around opacity-40 pointer-events-none text-[8px]">
                    <span>☁️</span>
                    <span>☁️</span>
                    <span>☁️</span>
                  </div>
                )}
                {barSettings.effect === 'sparkle_trail' && (
                  <div className="absolute inset-0 flex items-center justify-around opacity-50 pointer-events-none text-[9px] animate-pulse">
                    <span>✨</span>
                    <span>✦</span>
                    <span>✨</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hoạt ảnh bé cưng lướt trên thanh loading - bám sát chính xác đầu mũi tiến trình (Ảnh 8) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-[left] duration-75 ease-linear"
              style={{
                left: `${Math.max(3, Math.min(97, progress))}%`,
              }}
            >
              <div className="animate-runner-bounce flex items-center justify-center filter drop-shadow-xs">
                {barSettings.runnerSprite ? (
                  <img
                    src={barSettings.runnerSprite}
                    alt="Runner"
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-full bg-white/90 border border-white shadow-xs"
                  />
                ) : barSettings.runnerPreset === 'bunny' ? (
                  <span className="text-xl sm:text-2xl">🐰</span>
                ) : barSettings.runnerPreset === 'star' ? (
                  <span className="text-xl sm:text-2xl animate-spin" style={{ animationDuration: '4s' }}>⭐</span>
                ) : barSettings.runnerPreset === 'strawberry' ? (
                  <span className="text-xl sm:text-2xl">🍓</span>
                ) : barSettings.runnerPreset === 'cat' ? (
                  <span className="text-xl sm:text-2xl">🐾</span>
                ) : (
                  /* Default Cloud Runner Sprite (Ảnh 8 - đám mây trắng phúng phính má hồng) */
                  <div className="w-8 h-8 rounded-full bg-white/95 border-2 border-white shadow-xs flex items-center justify-center p-0.5">
                    <svg viewBox="0 0 32 32" className="w-full h-full text-sky-300" fill="currentColor">
                      <path d="M24 18c0-3.3-2.7-6-6-6-0.3 0-0.7 0-1 0.1C16.1 9.7 13.8 8 11 8c-3.9 0-7 3.1-7 7 0 0.5 0.1 0.9 0.2 1.4C2.3 17.2 1 19 1 21c0 2.8 2.2 5 5 5h18c2.8 0 5-2.2 5-5 0-1.8-1-3.4-2.5-4.2C26.8 17.5 27 17.8 27 18z" fill="#ffffff" stroke="var(--theme-border,#ffb3c6)" strokeWidth="1.5"/>
                      <circle cx="10" cy="18" r="1.2" fill="#5c1629"/>
                      <circle cx="17" cy="18" r="1.2" fill="#5c1629"/>
                      <circle cx="7.5" cy="19.5" r="1" fill="#ff8fab"/>
                      <circle cx="19.5" cy="19.5" r="1" fill="#ff8fab"/>
                      <path d="M12.5 20.5 Q13.5 22 14.5 20.5" stroke="#5c1629" strokeWidth="1" fill="none" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

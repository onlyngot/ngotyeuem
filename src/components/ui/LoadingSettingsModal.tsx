import { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  getWelcomeMascotArt,
  setWelcomeMascotArt,
  removeWelcomeMascotArt,
  getLoadingBarSettings,
  setLoadingBarSettings,
  LoadingBarSettings,
  LoadingBarEffect,
  compressImage,
  getGateViewerImage,
  setGateViewerImage,
  removeGateViewerImage,
  getGateAdminImage,
  setGateAdminImage,
  removeGateAdminImage,
} from '@/src/data/artStorage';

interface LoadingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewWelcome?: () => void;
}

export default function LoadingSettingsModal({
  isOpen,
  onClose,
  onPreviewWelcome,
}: LoadingSettingsModalProps) {
  const [welcomeMascot, setWelcomeMascot] = useState<string | null>(getWelcomeMascotArt());
  const [barSettings, setBarSettings] = useState<LoadingBarSettings>(getLoadingBarSettings());
  const [previewProgress, setPreviewProgress] = useState(55);
  const [viewerGateImg, setViewerGateImg] = useState<string | null>(getGateViewerImage());
  const [adminGateImg, setAdminGateImg] = useState<string | null>(getGateAdminImage());

  const mascotFileInputRef = useRef<HTMLInputElement>(null);
  const runnerFileInputRef = useRef<HTMLInputElement>(null);
  const viewerGateFileRef = useRef<HTMLInputElement>(null);
  const adminGateFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setWelcomeMascot(getWelcomeMascotArt());
      setBarSettings(getLoadingBarSettings());
    }
  }, [isOpen]);

  // Subtle animated scrubber for the live preview bar inside modal
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPreviewProgress((prev) => (prev >= 95 ? 15 : prev + 1.5));
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectWelcomeMascot = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 450, 0.85);
      setWelcomeMascotArt(dataUrl);
      setWelcomeMascot(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setWelcomeMascotArt(res);
        setWelcomeMascot(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectCustomRunner = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 120, 0.85);
      const next: LoadingBarSettings = {
        ...barSettings,
        runnerPreset: 'custom',
        runnerSprite: dataUrl,
      };
      setLoadingBarSettings(next);
      setBarSettings(next);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        const next: LoadingBarSettings = {
          ...barSettings,
          runnerPreset: 'custom',
          runnerSprite: res,
        };
        setLoadingBarSettings(next);
        setBarSettings(next);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectViewerGateImg = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 300, 0.85);
      setGateViewerImage(dataUrl);
      setViewerGateImg(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setGateViewerImage(res);
        setViewerGateImg(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectAdminGateImg = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 300, 0.85);
      setGateAdminImage(dataUrl);
      setAdminGateImg(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        setGateAdminImage(res);
        setAdminGateImg(res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetEffect = (effect: LoadingBarEffect) => {
    const next: LoadingBarSettings = { ...barSettings, effect };
    setLoadingBarSettings(next);
    setBarSettings(next);
  };

  const handleSetPreset = (preset: LoadingBarSettings['runnerPreset']) => {
    const next: LoadingBarSettings = {
      ...barSettings,
      runnerPreset: preset,
      runnerSprite: preset === 'custom' ? barSettings.runnerSprite : null,
    };
    setLoadingBarSettings(next);
    setBarSettings(next);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border-4 p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col gap-4 text-[#8d2d48]"
        style={{
          backgroundColor: 'var(--theme-card-bg, #fffff2)',
          borderColor: 'var(--theme-border, #ffb3c6)',
          boxShadow: '0 20px 50px var(--theme-shadow, rgba(255, 179, 198, 0.45))',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ffc2d1]/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏳</span>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-wide" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                Tùy Chỉnh Hoạt Ảnh Loading & Mascot
              </h3>
              <p className="text-[11px] font-bold opacity-75" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                Chủ khu tự trị • Quản lý hiệu ứng thanh loading & màn chào mừng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-base font-black flex items-center justify-center cursor-pointer border shadow-xs transition"
            style={{
              borderColor: 'var(--theme-border, #ffb3c6)',
              color: 'var(--theme-secondary, #8d2d48)',
            }}
          >
            ×
          </button>
        </div>

        {/* 1. LIVE PREVIEW BOX */}
        <div
          className="p-4 rounded-2xl border-2 flex flex-col items-center relative overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-light-bg, #ffe0df)',
            borderColor: 'var(--theme-border, #ffb3c6)',
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-wider mb-2 opacity-70">
            ✦ Xem trước trực tiếp hiệu ứng thanh loading ✦
          </span>

          {/* Mini preview bar */}
          <div className="w-full relative py-2">
            <div
              className="w-full rounded-full h-4 p-0.5 border-2 shadow-inner relative overflow-hidden"
              style={{
                backgroundColor: 'var(--theme-card-bg, #fffff2)',
                borderColor: 'var(--theme-border, #ffb3c6)',
              }}
            >
              <div
                className={`h-full rounded-full transition-all duration-100 ease-out relative overflow-hidden ${
                  barSettings.effect === 'candy_stripes' ? 'animate-candy-stripes' : ''
                }`}
                style={{
                  width: `${previewProgress}%`,
                  background:
                    barSettings.effect === 'candy_stripes'
                      ? 'repeating-linear-gradient(45deg, var(--theme-accent, #ff8fab), var(--theme-accent, #ff8fab) 8px, var(--theme-primary, #d45d79) 8px, var(--theme-primary, #d45d79) 16px)'
                      : 'linear-gradient(to right, var(--theme-bubble-fill, #ffaac4), var(--theme-accent, #ff8fab), var(--theme-primary, #d45d79))',
                }}
              >
                {barSettings.effect === 'shimmer_glow' && (
                  <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-sweep pointer-events-none" />
                )}
                {barSettings.effect === 'cloud_drift' && (
                  <div className="absolute inset-0 flex items-center justify-around opacity-40 pointer-events-none text-[8px]">
                    <span>☁️</span>
                    <span>☁️</span>
                  </div>
                )}
                {barSettings.effect === 'sparkle_trail' && (
                  <div className="absolute inset-0 flex items-center justify-around opacity-60 pointer-events-none text-[9px] animate-pulse">
                    <span>✨</span>
                    <span>✦</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live runner preview */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-[left] duration-100 ease-linear"
              style={{
                left: `${Math.max(3, Math.min(97, previewProgress))}%`,
              }}
            >
              <div className="animate-runner-bounce flex items-center justify-center filter drop-shadow-xs">
                {barSettings.runnerSprite ? (
                  <img
                    src={barSettings.runnerSprite}
                    alt="Runner"
                    className="w-7 h-7 object-contain rounded-full bg-white/90 border border-white shadow-xs"
                  />
                ) : barSettings.runnerPreset === 'bunny' ? (
                  <span className="text-xl">🐰</span>
                ) : barSettings.runnerPreset === 'star' ? (
                  <span className="text-xl animate-spin" style={{ animationDuration: '4s' }}>⭐</span>
                ) : barSettings.runnerPreset === 'strawberry' ? (
                  <span className="text-xl">🍓</span>
                ) : barSettings.runnerPreset === 'cat' ? (
                  <span className="text-xl">🐾</span>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/95 border border-white shadow-xs flex items-center justify-center p-0.5">
                    <svg viewBox="0 0 32 32" className="w-full h-full text-sky-300" fill="currentColor">
                      <path d="M24 18c0-3.3-2.7-6-6-6-0.3 0-0.7 0-1 0.1C16.1 9.7 13.8 8 11 8c-3.9 0-7 3.1-7 7 0 0.5 0.1 0.9 0.2 1.4C2.3 17.2 1 19 1 21c0 2.8 2.2 5 5 5h18c2.8 0 5-2.2 5-5 0-1.8-1-3.4-2.5-4.2C26.8 17.5 27 17.8 27 18z" fill="#ffffff" stroke="var(--theme-border,#ffb3c6)" strokeWidth="1.5"/>
                      <circle cx="10" cy="18" r="1.2" fill="#5c1629"/>
                      <circle cx="17" cy="18" r="1.2" fill="#5c1629"/>
                      <circle cx="7.5" cy="19.5" r="1" fill="#ff8fab"/>
                      <circle cx="19.5" cy="19.5" r="1" fill="#ff8fab"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. CHỌN HIỆU ỨNG THANH LOADING */}
        <div>
          <label className="block text-xs font-black mb-1.5" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
            ✨ Chọn hiệu ứng thanh loading:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'runner_sprite', label: '☁️ Bé lướt (Ảnh 8)' },
              { id: 'candy_stripes', label: '🍬 Sọc kẹo chảy' },
              { id: 'shimmer_glow', label: '✨ Ánh sáng quét' },
              { id: 'cloud_drift', label: '☁️ Mây trôi êm' },
              { id: 'sparkle_trail', label: '⭐ Sao lấp lánh' },
            ].map((eff) => (
              <button
                key={eff.id}
                type="button"
                onClick={() => handleSetEffect(eff.id as LoadingBarEffect)}
                className={`px-3 py-2 rounded-2xl border-2 text-xs font-black cursor-pointer transition flex items-center justify-center text-center ${
                  barSettings.effect === eff.id
                    ? 'text-white border-transparent shadow-sm scale-102'
                    : 'bg-white hover:bg-pink-50/60'
                }`}
                style={{
                  backgroundColor: barSettings.effect === eff.id ? 'var(--theme-accent, #ff8fab)' : '#ffffff',
                  borderColor: barSettings.effect === eff.id ? 'transparent' : 'var(--theme-border-light, #ffd4e0)',
                }}
              >
                {eff.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. NHÂN VẬT LƯỚT TRÊN THANH (RUNNER SPRITE) */}
        <div>
          <label className="block text-xs font-black mb-1.5" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
            🐾 Nhân vật lướt trên thanh (Runner Sprite):
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'cloud', label: '☁️ Bé Mây (Ảnh 8)' },
              { id: 'bunny', label: '🐰 Thỏ Con' },
              { id: 'star', label: '⭐ Ngôi Sao' },
              { id: 'strawberry', label: '🍓 Dâu Tây' },
              { id: 'cat', label: '🐾 Mèo Con' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSetPreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-2xl border-2 text-xs font-black cursor-pointer transition ${
                  barSettings.runnerPreset === preset.id && !barSettings.runnerSprite
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white hover:bg-pink-50/60'
                }`}
                style={{
                  backgroundColor:
                    barSettings.runnerPreset === preset.id && !barSettings.runnerSprite
                      ? 'var(--theme-primary, #d45d79)'
                      : '#ffffff',
                  borderColor:
                    barSettings.runnerPreset === preset.id && !barSettings.runnerSprite
                      ? 'transparent'
                      : 'var(--theme-border-light, #ffd4e0)',
                }}
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => runnerFileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-2xl border-2 border-dashed bg-pink-50 hover:bg-pink-100 text-xs font-black text-pink-700 cursor-pointer transition flex items-center gap-1"
            >
              <span>📁</span>
              <span>Tải ảnh runner riêng</span>
            </button>

            {barSettings.runnerSprite && (
              <button
                type="button"
                onClick={() => handleSetPreset('cloud')}
                className="px-2.5 py-1.5 rounded-2xl text-xs font-black text-red-500 hover:bg-red-50 cursor-pointer transition"
              >
                ✕ Xóa ảnh runner
              </button>
            )}
          </div>
        </div>

        {/* 4. MASCOT CHÀO MỪNG (WELCOME SCREEN MASCOT) */}
        <div className="p-3.5 rounded-2xl border-2 bg-white flex flex-col gap-2" style={{ borderColor: 'var(--theme-border-light, #ffd4e0)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-black" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                🎀 Ảnh Mascot Màn Hình Chào Mừng:
              </span>
              <span className="text-[11px] opacity-75 block">
                Mascot này riêng cho màn hình chào, có thể khác với mascot ở trang chủ.
              </span>
            </div>
            {welcomeMascot && (
              <img
                src={welcomeMascot}
                alt="Mascot preview"
                className="w-12 h-12 object-contain rounded-xl border p-0.5 shadow-2xs"
                style={{ borderColor: 'var(--theme-border, #ffb3c6)' }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-dashed border-[#ffc2d1]/60">
            <button
              type="button"
              onClick={() => mascotFileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-2xl text-white text-xs font-black shadow-xs hover:opacity-90 cursor-pointer flex items-center gap-1 transition"
              style={{ backgroundColor: 'var(--theme-accent, #ff8fab)' }}
            >
              <span>📁</span>
              <span>Tải ảnh mascot mới</span>
            </button>

            {welcomeMascot && (
              <button
                type="button"
                onClick={() => {
                  removeWelcomeMascotArt();
                  setWelcomeMascot(null);
                }}
                className="px-3 py-1.5 rounded-2xl bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-black cursor-pointer transition"
              >
                ↺ Dùng mascot mặc định
              </button>
            )}
          </div>
        </div>

        {/* 5. ẢNH 2 LỐI VÀO CỔNG CHÀO ("ngọt và chỉ có ngọt") */}
        <div className="p-3.5 rounded-2xl border-2 bg-white flex flex-col gap-3" style={{ borderColor: 'var(--theme-border-light, #ffd4e0)' }}>
          <div>
            <span className="block text-xs font-black" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
              🎀 Ảnh Cho 2 Mục Lựa Chọn Cổng Vào:
            </span>
            <span className="text-[11px] opacity-75 block">
              Tùy chỉnh ảnh đại diện riêng cho 2 lựa chọn tại cổng vào web (người xem & chủ khu tự trị).
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-dashed border-[#ffc2d1]/60">
            {/* Lựa chọn 1: Người xem */}
            <div className="p-2.5 rounded-xl border flex flex-col gap-2 bg-pink-50/40" style={{ borderColor: 'var(--theme-border-light, #ffd4e0)' }}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center shrink-0">
                  {viewerGateImg ? (
                    <img src={viewerGateImg} alt="Gate 1" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🌸</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-black block truncate" style={{ color: 'var(--theme-primary, #d45d79)' }}>
                    Người trong lòng
                  </span>
                  <span className="text-[10px] opacity-70 block truncate">
                    "đến gặp người trong lòng..."
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => viewerGateFileRef.current?.click()}
                  className="flex-1 py-1 rounded-lg bg-[var(--theme-accent,#ff8fab)] text-white text-[10px] font-black cursor-pointer hover:opacity-90 transition text-center"
                >
                  Tải ảnh
                </button>
                {viewerGateImg && (
                  <button
                    type="button"
                    onClick={() => {
                      removeGateViewerImage();
                      setViewerGateImg(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-red-50 text-red-600 text-[10px] font-bold cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>

            {/* Lựa chọn 2: Admin */}
            <div className="p-2.5 rounded-xl border flex flex-col gap-2 bg-pink-50/40" style={{ borderColor: 'var(--theme-border-light, #ffd4e0)' }}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center shrink-0">
                  {adminGateImg ? (
                    <img src={adminGateImg} alt="Gate 2" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">⚡</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-black block truncate" style={{ color: 'var(--theme-secondary, #8d2d48)' }}>
                    Cầm đầu tự trị
                  </span>
                  <span className="text-[10px] opacity-70 block truncate">
                    "đến cầm đầu khu tự trị..."
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adminGateFileRef.current?.click()}
                  className="flex-1 py-1 rounded-lg bg-[var(--theme-secondary,#8d2d48)] text-white text-[10px] font-black cursor-pointer hover:opacity-90 transition text-center"
                >
                  Tải ảnh
                </button>
                {adminGateImg && (
                  <button
                    type="button"
                    onClick={() => {
                      removeGateAdminImage();
                      setAdminGateImg(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-red-50 text-red-600 text-[10px] font-bold cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#ffc2d1]/80">
          {onPreviewWelcome && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onPreviewWelcome();
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[var(--theme-light-bg,#ffe0df)] to-[var(--theme-card-bg,#fffff2)] border text-xs font-black hover:scale-102 cursor-pointer shadow-xs transition flex items-center gap-1.5"
              style={{
                borderColor: 'var(--theme-border, #ffb3c6)',
                color: 'var(--theme-secondary, #8d2d48)',
              }}
            >
              <span>✨</span>
              <span>Xem thử màn hình chào mừng</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-2xl text-white text-xs font-black shadow-sm cursor-pointer hover:opacity-90 transition active:scale-95"
            style={{ backgroundColor: 'var(--theme-primary, #d45d79)' }}
          >
            Hoàn tất & Đóng
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          type="file"
          ref={mascotFileInputRef}
          onChange={handleSelectWelcomeMascot}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={runnerFileInputRef}
          onChange={handleSelectCustomRunner}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={viewerGateFileRef}
          onChange={handleSelectViewerGateImg}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={adminGateFileRef}
          onChange={handleSelectAdminGateImg}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}

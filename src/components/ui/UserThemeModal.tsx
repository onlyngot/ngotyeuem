import { useState, useEffect } from 'react';
import {
  ThemeSnapshot,
  getThemeSnapshots,
  applyThemeSnapshot,
} from '@/src/data/backupStorage';
import { playCuteSound } from '@/src/utils/soundEffects';

interface UserThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export default function UserThemeModal({ isOpen, onClose, onApplied }: UserThemeModalProps) {
  const [snapshots, setSnapshots] = useState<ThemeSnapshot[]>([]);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getThemeSnapshots());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setSnapshots(getThemeSnapshots());
    };
    window.addEventListener('yimeo_snapshots_updated', handleUpdate);
    return () => {
      window.removeEventListener('yimeo_snapshots_updated', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleApplySnapshot = (snap: ThemeSnapshot) => {
    playCuteSound('sparkle');
    const success = applyThemeSnapshot(snap);
    if (success) {
      setAppliedMsg(`✨ Đã đổi sang giao diện: "${snap.name}"`);
      if (onApplied) onApplied();
      setTimeout(() => setAppliedMsg(null), 3000);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[var(--theme-card-bg,#fffff2)] rounded-3xl border-4 border-[var(--theme-border,#ffb3c6)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[var(--theme-secondary,#8d2d48)] my-auto"
      >
        {/* Retro Header Bar: "⋆.𐙚 ̊." */}
        <div className="bg-[var(--theme-bg,#ffdde7)] px-4 py-3 flex items-center justify-between border-b-2 border-[var(--theme-border,#ffb3c6)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⋆.𐙚 ̊.</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--theme-secondary,#8d2d48)]">
                Bộ Sưu Tập Giao Diện Yimeo
              </h2>
              <span className="text-[10px] text-[var(--theme-primary,#d45d79)] font-medium block">
                Chọn giao diện do Chủ khu tự trị lưu sẵn để trải nghiệm ♡
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-base font-black flex items-center justify-center cursor-pointer border border-[var(--theme-border,#ffb3c6)] text-[var(--theme-secondary,#8d2d48)] shadow-xs transition"
          >
            ×
          </button>
        </div>

        {/* Applied notification */}
        {appliedMsg && (
          <div className="mx-4 mt-3 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold text-center animate-fadeIn shadow-xs">
            {appliedMsg}
          </div>
        )}

        {/* Modal Body - User only picks pre-saved theme snapshots, no palettes */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-[#ffc2d1]/60">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-secondary,#8d2d48)] flex items-center gap-1.5">
                <span>🎀</span>
                <span>Giao diện Admin lưu sẵn ({snapshots.length})</span>
              </span>
              <span className="text-[10px] text-[var(--theme-primary,#d45d79)] font-bold">
                Chọn để nạp tức thì
              </span>
            </div>

            {snapshots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {snapshots.map((snap) => (
                  <button
                    key={snap.id}
                    type="button"
                    onClick={() => handleApplySnapshot(snap)}
                    className="p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 cursor-pointer bg-white hover:bg-[var(--theme-light-bg,#ffe0df)]/40 hover:shadow-md flex flex-col justify-between gap-2.5"
                    style={{
                      borderColor: 'var(--theme-border-light, #ffc2d1)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">𐙚</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-black block truncate" style={{ color: 'var(--theme-primary, #d45d79)' }}>
                          {snap.name}
                        </span>
                        <span className="text-[10px] text-[#8d2d48]/70 block truncate">
                          {new Date(snap.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-[#ffc2d1]/60 text-[10px] font-bold">
                      <span className="text-[var(--theme-primary,#d45d79)] truncate">
                        {snap.activePaletteId ? `Tone: ${snap.activePaletteId}` : 'Tone chuẩn'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[var(--theme-accent,#ff8fab)] text-white text-[9px] font-black shrink-0">
                        Áp dụng ➔
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-[#ffc2d1] text-center bg-white/70 flex flex-col items-center gap-2">
                <span className="text-3xl">🌸</span>
                <p className="text-xs font-bold text-[#8d2d48]/85 max-w-xs">
                  Chưa có bản lưu giao diện nào do Chủ khu tự trị lưu sẵn. Hãy đón chờ những giao diện tuyệt đẹp sắp tới nhé!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--theme-light-bg,#ffe0df)]/60 border-t border-[var(--theme-border,#ffb3c6)] flex items-center justify-between text-xs font-bold">
          <span className="text-[11px] text-[var(--theme-secondary,#8d2d48)]/80">
            Giao diện được đồng bộ tự động trên thiết bị của bạn ♡
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--theme-primary,#d45d79)] text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 hover:opacity-90 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

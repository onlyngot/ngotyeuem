import { useState, useEffect } from 'react';
import {
  ThemeSnapshot,
  getThemeSnapshots,
  saveThemeSnapshot,
  applyThemeSnapshot,
  deleteThemeSnapshot,
  clearAllThemeSnapshots,
  resetToDefaultUI,
} from '@/src/data/backupStorage';
import { getActivePalette } from '@/src/data/paletteStorage';
import { pushCurrentConfigToServer } from '@/src/utils/syncManager';

interface ThemeBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export default function ThemeBackupModal({ isOpen, onClose, onApplied }: ThemeBackupModalProps) {
  const [snapshots, setSnapshots] = useState<ThemeSnapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmResetDefault, setConfirmResetDefault] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getThemeSnapshots());
      const active = getActivePalette();
      const date = new Date();
      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setSnapshotName(`Giao diện ${active.name} (${timeStr})`);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setSnapshots(getThemeSnapshots());
    };
    window.addEventListener('yimeo_snapshots_updated', handleUpdate);
    return () => window.removeEventListener('yimeo_snapshots_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3200);
  };

  const handleSave = () => {
    try {
      const snap = saveThemeSnapshot(snapshotName);
      setSnapshots(getThemeSnapshots());
      showNotification(`✨ Đã lưu bản thiết kế "${snap.name}" thành công!`);
      setSnapshotName('');
    } catch {
      showNotification('Không thể lưu giao diện. Bộ nhớ trình duyệt có thể đã đầy.');
    }
  };

  const handleForceSyncNow = async () => {
    setIsSyncing(true);
    try {
      const ok = await pushCurrentConfigToServer();
      if (ok) {
        showNotification('☁️ Đã đồng bộ giao diện lên hệ thống! Mọi thiết bị khác sẽ tự động nhận giao diện này.');
      } else {
        showNotification('Không thể đồng bộ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApply = (snap: ThemeSnapshot) => {
    const success = applyThemeSnapshot(snap);
    if (success) {
      showNotification(`🌸 Đã nạp và áp dụng bản lưu "${snap.name}"!`);
      if (onApplied) onApplied();
    } else {
      showNotification('Không thể áp dụng bản lưu này.');
    }
  };

  const handleDelete = (id: string) => {
    deleteThemeSnapshot(id);
    setSnapshots(getThemeSnapshots());
    setConfirmDeleteId(null);
    showNotification('🗑️ Đã xóa bản lưu trữ giao diện.');
  };

  const handleClearAll = () => {
    clearAllThemeSnapshots();
    setSnapshots([]);
    setConfirmClearAll(false);
    showNotification('🗑️ Đã xóa sạch toàn bộ bản lưu trữ!');
  };

  const handleResetToDefault = () => {
    resetToDefaultUI();
    setConfirmResetDefault(false);
    showNotification('🌱 Đã khôi phục giao diện về mặc định ban đầu!');
    if (onApplied) onApplied();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-[#fffff2] rounded-3xl border-4 border-[#ffb3c6] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#8d2d48] my-auto">
        {/* Retro Header Bar */}
        <div className="bg-[#ffdde7] px-4 py-3 flex items-center justify-between border-b-2 border-[#ffb3c6]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💾</span>
            <span className="text-[#8d2d48] text-xs sm:text-sm font-black tracking-wider uppercase">
              Lưu Trữ & Quản Lý Giao Diện Web
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#ffc2d1] hover:bg-[#ff9ebb] text-[#7a1f38] font-bold flex items-center justify-center text-sm transition border border-[#ffb3c6] cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="bg-[#ffe0df] border-b border-[#ffb3c6] px-4 py-2 text-[#8d2d48] text-xs font-bold text-center animate-fadeIn">
            {statusMsg}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm flex-1">
          {/* Automated Cross-Device Sync Status Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-pink-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">☁️</span>
              <div>
                <span className="font-black text-emerald-800 block">
                  Tự động hóa hiển thị đa thiết bị (Active)
                </span>
                <span className="text-[11px] text-[#8d2d48]/80 block font-medium">
                  Mọi tùy chỉnh giao diện của bạn đều được đồng bộ và tự động hiển thị trên điện thoại, máy tính và mọi thiết bị khác!
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleForceSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <span>{isSyncing ? '⏳' : '🔄'}</span>
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
            </button>
          </div>

          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-[#ffe0df]/50 border border-[#ffb3c6] text-xs text-[#8d2d48] leading-relaxed">
            🎀 <strong>Tính năng lưu trữ giao diện:</strong> Cho phép bạn lưu lại toàn bộ các thiết lập tùy biến vừa chỉnh (palette màu sắc, phụ kiện trang trí ảnh, vật thể rơi, hiệu ứng chạm click, icon web, v.v.). Bạn có thể lưu nhiều phong cách khác nhau và chuyển đổi qua lại bất kỳ lúc nào!
          </div>

          {/* Form: Save Current Theme */}
          <div className="p-4 rounded-2xl bg-[#ffdde7]/40 border-2 border-[#ffb3c6] space-y-3 shadow-2xs">
            <h3 className="font-extrabold text-[#d45d79] text-xs sm:text-sm flex items-center gap-1.5">
              <span>💾</span> Lưu Giao Diện Hiện Tại
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="Đặt tên cho bản lưu (vd: Mùa Thu Pastel, Hồng Dâu...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#fffff2] border border-[#ffb3c6] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ff8fab] text-[#8d2d48]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff8fab] to-[#e56b82] hover:from-[#ff7b99] hover:to-[#d4556f] text-white font-extrabold text-xs shadow-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>💾</span>
                <span>Lưu ngay</span>
              </button>
            </div>
          </div>

          {/* List of Saved Snapshots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-xs sm:text-sm flex items-center gap-1.5">
                <span>📁</span> Danh Sách Bản Lưu Trữ ({snapshots.length})
              </h3>
              {snapshots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="text-[11px] text-red-600 hover:text-red-700 underline font-bold cursor-pointer"
                >
                  Xóa tất cả bản lưu
                </button>
              )}
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#fffff2] border-2 border-dashed border-[#ffc2d1] text-center text-[#b33959]">
                <span className="text-3xl block mb-2">📭</span>
                <p className="font-bold text-xs">Chưa có bản lưu giao diện nào.</p>
                <p className="text-[11px] mt-1 text-[#b33959]/80">
                  Hãy nhấn <strong>"Lưu ngay"</strong> ở trên để lưu phong cách hiện tại của bạn nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {snapshots.map((snap) => {
                  const dateStr = new Date(snap.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={snap.id}
                      className="p-3 sm:p-3.5 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] hover:border-[#ff9ebb] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[#8d2d48] text-xs sm:text-sm truncate">
                            {snap.name}
                          </span>
                          {/* Color dots preview */}
                          {snap.paletteColors && (
                            <div className="flex items-center gap-1 shrink-0 p-1 bg-[#ffe0df]/50 rounded-full border border-[#ffb3c6]">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
                                style={{ backgroundColor: snap.paletteColors.primary }}
                                title="Primary"
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
                                style={{ backgroundColor: snap.paletteColors.accent }}
                                title="Accent"
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
                                style={{ backgroundColor: snap.paletteColors.bg }}
                                title="Background"
                              />
                            </div>
                          )}
                        </div>

                        {/* Snapshot details tag */}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#b33959] flex-wrap">
                          <span>🕒 {dateStr}</span>
                          <span>•</span>
                          <span>🎨 Palette: {snap.activePaletteId}</span>
                          <span>•</span>
                          <span>
                            ✨ Rơi:{' '}
                            {snap.fallingSettings?.enabled
                              ? snap.fallingSettings.preset || 'custom'
                              : 'tắt'}
                          </span>
                          <span>•</span>
                          <span>👆 Chạm: {snap.clickBurstSettings?.style || 'combo'}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleApply(snap)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-1"
                          title="Áp dụng ngay bản lưu này vào giao diện"
                        >
                          <span>🌸</span>
                          <span>Áp dụng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(snap.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#ffe0df] hover:bg-red-100 text-red-600 font-bold text-xs border border-[#ffb3c6] transition cursor-pointer active:scale-95 flex items-center gap-1"
                          title="Xóa bản lưu này"
                        >
                          <span>🗑️</span>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danger / Reset zone */}
          <div className="pt-3 border-t border-[#ffc2d1]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-[#b33959] text-[11px]">
              Muốn trở về thiết kế gốc ban đầu?
            </span>
            <button
              type="button"
              onClick={() => setConfirmResetDefault(true)}
              className="px-3 py-1.5 rounded-xl bg-[#ffe0df] hover:bg-[#ffc2d1] text-[#8d2d48] font-bold text-[11px] border border-[#ffb3c6] cursor-pointer transition active:scale-95"
            >
              🌱 Khôi phục giao diện mặc định
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#ffdde7] border-t-2 border-[#ffb3c6] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 border border-[#f888a7] cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirmation Dialog: Delete single snapshot */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-[#fffff2] p-5 rounded-3xl border-4 border-[#ffb3c6] max-w-sm w-full text-center space-y-3 shadow-2xl">
            <span className="text-3xl block">🗑️</span>
            <h4 className="font-extrabold text-[#d45d79] text-sm">Xác nhận xóa bản lưu này?</h4>
            <p className="text-xs text-[#8d2d48]">
              Bản lưu sẽ bị xóa vĩnh viễn khỏi danh sách lưu trữ của bạn.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-1.5 rounded-xl bg-[#ffe0df] text-[#8d2d48] font-bold text-xs cursor-pointer hover:bg-[#ffc2d1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Clear All Snapshots */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-[#fffff2] p-5 rounded-3xl border-4 border-red-300 max-w-sm w-full text-center space-y-3 shadow-2xl">
            <span className="text-3xl block">⚠️</span>
            <h4 className="font-extrabold text-red-600 text-sm">Xóa TOÀN BỘ bản lưu trữ?</h4>
            <p className="text-xs text-[#8d2d48]">
              Tất cả các bản thiết kế giao diện đã lưu ({snapshots.length} bản) sẽ bị xóa hết. Hành động này không thể hoàn tác!
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-1.5 rounded-xl bg-[#ffe0df] text-[#8d2d48] font-bold text-xs cursor-pointer hover:bg-[#ffc2d1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Reset UI to Defaults */}
      {confirmResetDefault && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div className="bg-[#fffff2] p-5 rounded-3xl border-4 border-[#ffb3c6] max-w-sm w-full text-center space-y-3 shadow-2xl">
            <span className="text-3xl block">🌱</span>
            <h4 className="font-extrabold text-[#d45d79] text-sm">Khôi phục về giao diện gốc?</h4>
            <p className="text-xs text-[#8d2d48]">
              Giao diện sẽ trở lại tone Dâu Tây Hồng, các icon và hiệu ứng sẽ được đưa về giá trị mặc định ban đầu.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetDefault(false)}
                className="px-4 py-1.5 rounded-xl bg-[#ffe0df] text-[#8d2d48] font-bold text-xs cursor-pointer hover:bg-[#ffc2d1]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff8fab] to-[#e56b82] text-white font-bold text-xs cursor-pointer"
              >
                Xác nhận Đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

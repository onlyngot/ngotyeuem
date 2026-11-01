import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  getBunniesArt,
  setBunniesArt,
  removeBunniesArt,
  getBackgroundArt,
  setBackgroundArt,
  removeBackgroundArt,
  getCustomStickers,
  addCustomSticker,
  removeCustomSticker,
  getCustomIconSlots,
  setCustomIconSlot,
  clearAllCustomIcons,
  ICON_SLOT_DEFINITIONS,
  CustomIconSlots,
  getFallingEffectSettings,
  setFallingEffectSettings,
  FallingEffectSettings,
  getSiteAvatarArt,
  setSiteAvatarArt,
  removeSiteAvatarArt,
  getClickBurstSettings,
  setClickBurstSettings,
  ClickBurstSettings,
  ClickEffectStyle,
  getImageDecorSettings,
  setImageDecorSettings,
  ImageDecorSettings,
  ImageEffectType,
} from '@/src/data/artStorage';
import {
  COLOR_PALETTES,
  getAllPalettes,
  getActivePaletteId,
  setActivePalette,
} from '@/src/data/paletteStorage';
import PaletteModal from '@/src/components/ui/PaletteModal';
import ThemeBackupModal from '@/src/components/ui/ThemeBackupModal';
import {
  getSoundSettings,
  setSoundSettings,
  playCuteSound,
  SoundEffectsSettings,
} from '@/src/utils/soundEffects';

interface ArtSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

// Compress client-side images using Canvas to prevent localStorage QuotaExceededError
function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        let mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        let compressed = canvas.toDataURL(mimeType, quality);

        if (compressed.length > 250000 && mimeType === 'image/png') {
          compressed = canvas.toDataURL('image/jpeg', 0.85);
        }

        resolve(compressed);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function ArtSettingsContent({ onClose, onUpdated }: { onClose: () => void; onUpdated?: () => void }) {
  const [bunniesImg, setBunniesImg] = useState<string | null>(getBunniesArt());
  const [activePaletteId, setActivePaletteId] = useState<string>(getActivePaletteId());
  const [siteAvatarImg, setSiteAvatarImg] = useState<string | null>(getSiteAvatarArt());
  const [bgImg, setBgImg] = useState<string | null>(getBackgroundArt());
  const [stickers, setStickers] = useState<string[]>(getCustomStickers());
  const [iconSlots, setIconSlots] = useState<CustomIconSlots>(getCustomIconSlots());
  const [fallingSettings, setFallingSettingsState] = useState<FallingEffectSettings>(getFallingEffectSettings());
  const [clickBurst, setClickBurstState] = useState<ClickBurstSettings>(getClickBurstSettings());
  const [soundSettings, setSoundSettingsState] = useState<SoundEffectsSettings>(getSoundSettings());
  const [imageDecor, setImageDecorState] = useState<ImageDecorSettings>(getImageDecorSettings());
  const [showPaletteEditorModal, setShowPaletteEditorModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedStickerForSlot, setSelectedStickerForSlot] = useState<string | null>(null);

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bunniesFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const stickerFileRef = useRef<HTMLInputElement>(null);
  const iconSlotUploadRef = useRef<HTMLInputElement>(null);
  const fallingImgFileRef = useRef<HTMLInputElement>(null);
  const clickParticleFileRef = useRef<HTMLInputElement>(null);
  const customSoundFileRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<keyof CustomIconSlots | null>(null);

  useEffect(() => {
    setIconSlots(getCustomIconSlots());
    setActivePaletteId(getActivePaletteId());

    const handlePaletteUpdate = () => {
      setActivePaletteId(getActivePaletteId());
    };
    const handleBurstUpdate = () => setClickBurstState(getClickBurstSettings());
    const handleSoundUpdate = () => setSoundSettingsState(getSoundSettings());
    const handleDecorUpdate = () => setImageDecorState(getImageDecorSettings());

    window.addEventListener('yimeo_palette_updated', handlePaletteUpdate);
    window.addEventListener('yimeo_click_burst_updated', handleBurstUpdate);
    window.addEventListener('yimeo_sound_updated', handleSoundUpdate);
    window.addEventListener('yimeo_image_decor_updated', handleDecorUpdate);

    return () => {
      window.removeEventListener('yimeo_palette_updated', handlePaletteUpdate);
      window.removeEventListener('yimeo_click_burst_updated', handleBurstUpdate);
      window.removeEventListener('yimeo_sound_updated', handleSoundUpdate);
      window.removeEventListener('yimeo_image_decor_updated', handleDecorUpdate);
    };
  }, []);

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleBunniesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 800);
      setBunniesArt(dataUrl);
      setBunniesImg(dataUrl);
      showNotification('Đã nạp file ảnh 3 chú thỏ gốc của bạn thành công! ✨');
      if (onUpdated) onUpdated();
    } catch {
      showNotification('Không thể đọc file ảnh.');
    }
  };

  const handleBackgroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 1000);
      setBackgroundArt(dataUrl);
      setBgImg(dataUrl);
      showNotification('Đã cài đặt ảnh nền gốc của bạn thành công! 🌸');
      if (onUpdated) onUpdated();
    } catch {
      showNotification('Không thể đọc file ảnh.');
    }
  };

  const handleStickerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 300);
      addCustomSticker(dataUrl);
      setStickers(getCustomStickers());
      showNotification('Đã thêm sticker mới vào bộ sưu tập! 🍓');
      if (onUpdated) onUpdated();
    } catch {
      showNotification('Không thể tải sticker.');
    }
  };

  const handleDirectIconUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const slot = targetSlotRef.current;
    if (!file || !slot) return;
    try {
      const dataUrl = await compressImage(file, 200);
      setCustomIconSlot(slot, dataUrl);
      setIconSlots(getCustomIconSlots());
      addCustomSticker(dataUrl);
      setStickers(getCustomStickers());
      showNotification(`Đã cập nhật icon cho [${slot}]! ✨`);
      if (onUpdated) onUpdated();
    } catch {
      showNotification('Không thể tải icon.');
    } finally {
      targetSlotRef.current = null;
      if (iconSlotUploadRef.current) {
        iconSlotUploadRef.current.value = '';
      }
    }
  };

  const handleAssignStickerToSlot = (slotKey: keyof CustomIconSlots, stickerData: string) => {
    setCustomIconSlot(slotKey, stickerData);
    setIconSlots(getCustomIconSlots());
    setSelectedStickerForSlot(null);
    showNotification(`Đã gán sticker làm icon cho [${slotKey}]! ✨`);
    if (onUpdated) onUpdated();
  };

  const handleResetSlot = (slotKey: keyof CustomIconSlots) => {
    setCustomIconSlot(slotKey, null);
    setIconSlots(getCustomIconSlots());
    showNotification(`Đã đặt lại icon [${slotKey}] về mặc định.`);
    if (onUpdated) onUpdated();
  };

  const handleDeleteSticker = (idx: number) => {
    removeCustomSticker(idx);
    setStickers(getCustomStickers());
    showNotification('Đã xóa sticker.');
  };

  const handleResetBunnies = () => {
    removeBunniesArt();
    setBunniesImg(null);
    showNotification('Đã gỡ ảnh thỏ.');
    if (onUpdated) onUpdated();
  };

  const handleSiteAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 500);
      setSiteAvatarArt(dataUrl);
      setSiteAvatarImg(dataUrl);
      showNotification("Đã cài đặt ảnh đại diện Yimeo's home thành công! 🎀");
      if (onUpdated) onUpdated();
    } catch {
      showNotification('Không thể đọc file ảnh avatar.');
    }
  };

  const handleResetSiteAvatar = () => {
    removeSiteAvatarArt();
    setSiteAvatarImg(null);
    showNotification('Đã gỡ ảnh đại diện.');
    if (onUpdated) onUpdated();
  };

  const handleResetBg = () => {
    removeBackgroundArt();
    setBgImg(null);
    showNotification('Đã đặt lại hình nền mặc định.');
    if (onUpdated) onUpdated();
  };

  const updateFallingSettings = (newSettings: FallingEffectSettings) => {
    setFallingSettingsState(newSettings);
    setFallingEffectSettings(newSettings);
    showNotification('Đã cập nhật cài đặt vật thể rơi! ✨');
  };

  const handleCustomFallingUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 200);
      const prevImages = fallingSettings.customImages || (fallingSettings.customImageUrl ? [fallingSettings.customImageUrl] : []);
      const nextImages = [...prevImages, dataUrl];
      const next: FallingEffectSettings = {
        ...fallingSettings,
        type: 'custom',
        customImageUrl: dataUrl,
        customImages: nextImages,
      };
      updateFallingSettings(next);
      addCustomSticker(dataUrl);
      setStickers(getCustomStickers());
      showNotification('Đã thêm ảnh vật thể rơi mới vào danh sách! 🌸');
    } catch {
      showNotification('Không thể đọc ảnh vật thể.');
    } finally {
      if (fallingImgFileRef.current) {
        fallingImgFileRef.current.value = '';
      }
    }
  };

  const handleDeleteCustomFallingImage = (index: number) => {
    const prevImages = fallingSettings.customImages || [];
    const nextImages = prevImages.filter((_, i) => i !== index);
    const next: FallingEffectSettings = {
      ...fallingSettings,
      customImages: nextImages,
      customImageUrl: nextImages[0] || null,
      type: nextImages.length > 0 ? 'custom' : 'preset',
    };
    updateFallingSettings(next);
    showNotification('Đã xóa bớt 1 ảnh vật thể rơi.');
  };

  const handleClearAllFallingImages = () => {
    const next: FallingEffectSettings = {
      ...fallingSettings,
      customImages: [],
      customImageUrl: null,
      type: 'preset',
    };
    updateFallingSettings(next);
    showNotification('Đã xóa tất cả ảnh rơi tùy chỉnh.');
  };

  const handleClearAllStickers = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('caomei_custom_stickers');
    }
    setStickers([]);
    showNotification('Đã xóa tất cả sticker đã tải lên.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fffff2] rounded-3xl border-4 border-[#ffb3c6] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#8d2d48] my-auto">
        {/* Title Bar in #ffdde7 */}
        <div className="bg-[#ffdde7] px-4 py-3 flex items-center justify-between border-b-2 border-[#ffb3c6]">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <span className="text-[#8d2d48] text-sm font-black tracking-wider uppercase">
              Cài đặt Ảnh, Icon & Sticker của Bạn (Admin)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#ffc2d1] hover:bg-[#ff9ebb] text-[#7a1f38] font-bold flex items-center justify-center text-sm transition border border-[#ffb3c6] cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className="bg-[#ffe0df] border-b border-[#ffb3c6] px-4 py-2 text-[#8d2d48] text-xs font-bold text-center animate-fadeIn">
            {statusMsg}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-[#8d2d48] text-xs sm:text-sm">
          {/* Copyright notice */}
          <p className="text-xs text-[#8d2d48] leading-relaxed bg-[#ffe0df]/60 p-3.5 rounded-2xl border border-[#ffb3c6]">
            🔒 <strong>Bảo vệ tác quyền:</strong> Website chỉ hiển thị trực tiếp file ảnh nguyên bản từ máy của bạn (lưu trên trình duyệt). Hoàn toàn <strong>KHÔNG</strong> huấn luyện AI, <strong>KHÔNG</strong> tái tạo tranh của bạn.
          </p>

          {/* Prominent Guidance Banner for Universal Image Editor */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ffdde7] to-[#ffe0df] border-2 border-[#ffb3c6] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✂️</span>
              <div className="text-xs">
                <span className="font-extrabold text-[#d45d79] text-sm block">
                  Studio Chỉnh Sửa Ảnh Toàn Diện (Zoom, Pan, Rotate, Crop, Filter)
                </span>
                <span className="text-[#8d2d48]">
                  Bạn có thể chỉnh sửa <strong>bất kỳ ảnh nào</strong>: ảnh nền (background), 6 icon emote (kính lúp, tim, nơ, dâu tây...), vật thể rơi, thỏ mascot hay avatar/tranh nhân vật!
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('caomei_open_image_editor', {
                    detail: {
                      initialImage: bgImg || null,
                      targetTitle: 'Studio Chỉnh Sửa Ảnh Toàn Diện',
                      targetType: 'general',
                    },
                  })
                );
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff8fab] to-[#e56b82] hover:from-[#ff7b99] hover:to-[#d4556f] text-white text-xs font-black shadow-md cursor-pointer flex-shrink-0 whitespace-nowrap active:scale-95 flex items-center gap-1.5"
            >
              <span>✂️</span>
              <span>Mở Studio Sửa Ảnh ➔</span>
            </button>
          </div>

          {/* Section: Save & Restore Web Theme (Lưu trữ và Xóa lưu trữ cấu hình giao diện web) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ffe0df] to-[#ffdde7] border-2 border-[#ffb3c6] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💾</span>
              <div className="text-xs">
                <span className="font-extrabold text-[#d45d79] text-sm block">
                  Lưu Trữ & Quản Lý Bản Thiết Kế Giao Diện Web
                </span>
                <span className="text-[#8d2d48]">
                  Lưu lại toàn bộ tùy biến vừa chỉnh (palette màu sắc, phụ kiện trang trí, vật thể rơi, click chuột, icon emote...) hoặc xóa bỏ, khôi phục bản lưu bất kỳ lúc nào!
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowBackupModal(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e56b82] text-white text-xs font-black shadow-md cursor-pointer flex-shrink-0 whitespace-nowrap active:scale-95 flex items-center gap-1.5 border border-[#f888a7]"
            >
              <span>💾</span>
              <span>Quản Lý Bản Lưu ➔</span>
            </button>
          </div>

          {/* Section: Custom Web Icons Assignment (Yêu cầu thay sticker cho icon kính lúp, v.v.) */}
          <div className="p-4 rounded-2xl bg-[#ffdde7]/40 border-2 border-[#ffb3c6] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🔍</span> Thay thế Icon Web bằng Ảnh / Sticker của Bạn
              </h3>
              <button
                onClick={() => {
                  clearAllCustomIcons();
                  setIconSlots({});
                  showNotification('Đã đặt lại toàn bộ icon về mặc định.');
                }}
                className="text-[11px] text-[#b33959] hover:text-[#8d2d48] underline cursor-pointer"
              >
                Đặt lại tất cả icon
              </button>
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Bạn có thể thay thế các icon mặc định của web (kính lúp, trái tim, ngôi sao, nơ...) bằng ảnh sticker bạn tự tải lên!
            </p>

            {/* List of Icon Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ICON_SLOT_DEFINITIONS.map((slot) => {
                const currentIcon = iconSlots[slot.key];
                return (
                  <div
                    key={slot.key}
                    className="p-3 rounded-xl bg-[#fffff2] border-2 border-[#ffc2d1] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Current Icon Preview Box */}
                      <div className="w-10 h-10 rounded-xl bg-[#ffe0df]/40 border-2 border-[#ffb3c6] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {currentIcon ? (
                          <img
                            src={currentIcon}
                            alt={slot.label}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-lg">{slot.defaultEmoji}</span>
                        )}
                      </div>

                      {/* Slot Description */}
                      <div className="min-w-0">
                        <span className="font-bold text-[#8d2d48] text-xs block truncate">
                          {slot.label}
                        </span>
                        <span className="text-[10px] text-[#b33959] block truncate">
                          {currentIcon ? 'Đang dùng ảnh tự chọn' : `Mặc định: ${slot.defaultEmoji}`}
                        </span>
                      </div>
                    </div>

                      {/* Actions for this slot */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('caomei_open_image_editor', {
                              detail: {
                                initialImage: currentIcon || null,
                                targetTitle: `Chỉnh sửa Icon / Emote: ${slot.label}`,
                                targetType: 'icon',
                                targetSlotKey: slot.key,
                              },
                            })
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-gradient-to-r from-[#ff8fab] to-[#e56b82] hover:from-[#ff7b99] hover:to-[#d4556f] text-white text-[11px] font-black shadow-2xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                        title="Phóng to, thu nhỏ, xoay, lật, di chuyển và cắt cho icon này"
                      >
                        <span>✂️</span>
                        <span>Sửa ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          targetSlotRef.current = slot.key;
                          iconSlotUploadRef.current?.click();
                        }}
                        className="px-2 py-1 rounded-lg bg-[#ffdde7] hover:bg-[#ffe0df] text-[#8d2d48] text-[11px] font-bold border border-[#ffb3c6] transition cursor-pointer"
                        title="Tải ảnh trực tiếp cho icon này"
                      >
                        Tải ảnh
                      </button>

                      {currentIcon && (
                        <button
                          type="button"
                          onClick={() => handleResetSlot(slot.key)}
                          className="w-6 h-6 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold flex items-center justify-center transition cursor-pointer"
                          title="Đặt lại emoji mặc định"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden direct upload for slots */}
            <input
              type="file"
              ref={iconSlotUploadRef}
              onChange={handleDirectIconUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Section: Sticker Collection & Direct Assignment */}
          <div className="p-4 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🎀</span> Kho Sticker & Ảnh Tải Lên Của Bạn
              </h3>
              <span className="text-xs text-[#b33959] font-bold">{stickers.length} ảnh</span>
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Tải thêm ảnh sticker lên. Bấm vào bất kỳ sticker nào bên dưới để gán làm icon cho web!
            </p>

            <input
              type="file"
              ref={stickerFileRef}
              onChange={handleStickerUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => stickerFileRef.current?.click()}
                className="py-2 px-4 rounded-xl bg-[#ffdde7] hover:bg-[#ffe0df] text-[#8d2d48] font-bold text-xs transition border border-[#ffb3c6] cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <span>+</span>
                <span>Tải thêm ảnh / sticker mới từ máy</span>
              </button>

              {stickers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllStickers}
                  className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition cursor-pointer flex items-center gap-1"
                >
                  <span>🗑️</span>
                  <span>Xóa tất cả sticker</span>
                </button>
              )}
            </div>

            {stickers.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-2.5 bg-[#ffe0df]/30 rounded-xl border border-[#ffb3c6]/60">
                  {stickers.map((st, idx) => (
                    <div
                      key={idx}
                      className="relative group w-16 h-16 rounded-xl bg-[#fffff2] border-2 border-[#ffb3c6] p-1 flex items-center justify-center shadow-2xs hover:scale-105 transition cursor-pointer"
                      onClick={() => setSelectedStickerForSlot(selectedStickerForSlot === st ? null : st)}
                      title="Bấm để chọn làm icon"
                    >
                      <img src={st} alt={`Sticker ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                      
                      {/* Edit sticker button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(
                            new CustomEvent('caomei_open_image_editor', {
                              detail: {
                                initialImage: st,
                                targetTitle: `Chỉnh sửa Sticker #${idx + 1}`,
                                targetType: 'sticker',
                              },
                            })
                          );
                        }}
                        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#ff8fab] hover:bg-[#e56b82] text-white font-black text-[9px] flex items-center justify-center shadow-xs opacity-90 sm:opacity-75 group-hover:opacity-100 transition cursor-pointer z-20"
                        title="Chỉnh sửa sticker này"
                      >
                        ✂️
                      </button>

                      {/* Delete badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSticker(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs opacity-90 sm:opacity-75 group-hover:opacity-100 transition cursor-pointer z-20"
                        title="Xóa sticker này"
                      >
                        ×
                      </button>

                      {/* Selected indicator */}
                      {selectedStickerForSlot === st && (
                        <div className="absolute inset-0 border-2 border-[#ff8fab] bg-[#ff8fab]/20 rounded-xl flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* If a sticker is selected, show slot picker buttons */}
                {selectedStickerForSlot && (
                  <div className="p-3 bg-[#ffdde7] rounded-xl border border-[#ffb3c6] animate-fadeIn">
                    <span className="text-xs font-bold text-[#8d2d48] block mb-2">
                      👉 Chọn icon bạn muốn thay bằng sticker này:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ICON_SLOT_DEFINITIONS.map((slot) => (
                        <button
                          key={slot.key}
                          type="button"
                          onClick={() => handleAssignStickerToSlot(slot.key, selectedStickerForSlot)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] text-xs font-bold border border-[#ffb3c6] shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{slot.defaultEmoji}</span>
                          <span>{slot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[#ffb3c6] text-center text-[#b33959] text-xs">
                Chưa có sticker nào. Hãy bấm nút "+ Tải thêm ảnh / sticker mới từ máy" ở trên!
              </div>
            )}
          </div>

          {/* Section: Color Palette Themes & Custom Palette Studio */}
          <div className="p-4 rounded-2xl bg-[var(--theme-bg,#ffdde7)]/60 border-2 border-[var(--theme-border,#ffb3c6)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[var(--theme-primary,#d45d79)] text-sm sm:text-base flex items-center gap-2">
                <span>🌈</span> Bảng Màu Chủ Đạo & Tự Phối Màu (Color Palettes)
              </h3>
              <button
                type="button"
                onClick={() => setShowPaletteEditorModal(true)}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-[var(--theme-accent,#ff8fab)] to-[var(--theme-bubble-fill,#ffaac4)] hover:opacity-95 text-white font-black text-xs shadow-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>🎨</span>
                <span>Tự phối màu mới ➔</span>
              </button>
            </div>
            <p className="text-xs text-[var(--theme-secondary,#8d2d48)] mb-3">
              Chọn từ các bảng màu phong phú (14+ phong cách kết hợp) hoặc tự tạo palette riêng biệt với mã màu HEX bạn yêu thích!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 custom-scrollbar">
              {getAllPalettes().map((p) => {
                const isSelected = activePaletteId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePalette(p.id);
                      setActivePaletteId(p.id);
                      showNotification(`Đã chuyển sang bảng màu: ${p.name}! ✨`);
                      if (onUpdated) onUpdated();
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-[var(--theme-primary,#d45d79)] ring-2 ring-[var(--theme-accent,#ff8fab)]/50 bg-white shadow-xs scale-102 font-black'
                        : 'border-[var(--theme-border,#ffb3c6)] bg-[var(--theme-card-bg,#fffff2)] hover:bg-white hover:border-[var(--theme-accent,#ff8fab)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{p.emoji}</span>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--theme-primary,#d45d79)] text-white">
                          ✓ Chọn
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[var(--theme-secondary,#8d2d48)] block truncate">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.colors.bg }} title="Nền trang" />
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.colors.border }} title="Viền" />
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.colors.primary }} title="Màu chính" />
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.colors.accent }} title="Điểm nhấn" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Screen Click Burst Particles Effect (Chạm vào màn hình bung vật thể) */}
          <div className="p-4 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>✨</span> Hiệu Ứng Chạm Màn Hình (Click Particle Burst)
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#8d2d48]">
                <input
                  type="checkbox"
                  checked={clickBurst.enabled}
                  onChange={(e) => {
                    const next = { ...clickBurst, enabled: e.target.checked };
                    setClickBurstSettings(next);
                    setClickBurstState(next);
                    showNotification(e.target.checked ? 'Đã bật hiệu ứng chạm bung hạt! 💖' : 'Đã tắt hiệu ứng chạm.');
                  }}
                  className="rounded-sm accent-[#ff8fab] w-4 h-4 cursor-pointer"
                />
                <span>Bật hiệu ứng</span>
              </label>
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Khi chạm / click vào bất kỳ đâu trên màn hình, các vật thể dễ thương (trái tim, dâu tây, ngôi sao hoặc ảnh của chính bạn) sẽ bung tỏa ra xung quanh kèm âm thanh pop ngọt ngào!
            </p>

            {clickBurst.enabled && (
              <div className="space-y-3 p-3 bg-[#ffe0df]/30 rounded-xl border border-[#ffb3c6]/60">
                {/* Click Effect Style Selection */}
                <div>
                  <label className="text-[11px] font-bold text-[#8d2d48] block mb-1.5">
                    Kiểu hiệu ứng click (Sóng gợn, Bay bồng lên, Bung tỏa...):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'combo', label: 'Sóng gợn + Bay bồng', emoji: '🫧🌸', desc: 'Kết hợp hài hòa' },
                      { key: 'ripple', label: 'Sóng gợn nước pastel', emoji: '🌊', desc: 'Gợn vòng tròn êm dịu' },
                      { key: 'floating', label: 'Nổi bồng bềnh lên trời', emoji: '🎈', desc: 'Bay chậm lãng mạn' },
                      { key: 'burst', label: 'Bung tỏa xung quanh', emoji: '💥', desc: 'Bung nổ nhí nhảnh' },
                      { key: 'sparkle_burst', label: 'Pháo hoa lấp lánh', emoji: '✨', desc: 'Tia sáng tỏa tròn' },
                    ].map((st) => {
                      const isSel = (clickBurst.style || 'combo') === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => {
                            const next: ClickBurstSettings = { ...clickBurst, style: st.key as ClickEffectStyle };
                            setClickBurstSettings(next);
                            setClickBurstState(next);
                            showNotification(`Đã chuyển kiểu click: ${st.label}! ✨`);
                          }}
                          className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer flex flex-col gap-0.5 ${
                            isSel
                              ? 'bg-[#ffe0df] border-[#ff8fab] text-[#d45d79] font-bold shadow-2xs scale-102 ring-1 ring-[#ff8fab]'
                              : 'bg-white border-[#ffc2d1] text-[#8d2d48] hover:bg-[#ffdde7]/50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{st.emoji}</span>
                            <span className="truncate font-bold text-[11px]">{st.label}</span>
                          </div>
                          <span className="text-[9px] text-[#b33959] opacity-80">{st.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <label className="text-[11px] font-bold text-[#8d2d48] block mb-1.5">Loại vật thể bung ra:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'mixed', label: 'Hỗn hợp dễ thương', emoji: '💖🍓✨' },
                      { key: 'hearts', label: 'Trái tim hồng', emoji: '💕' },
                      { key: 'strawberries', label: 'Dâu tây bánh ngọt', emoji: '🍓' },
                      { key: 'stars', label: 'Ngôi sao mơ màng', emoji: '⭐' },
                      { key: 'sparkles', label: 'Lấp lánh kim cương', emoji: '✨' },
                      { key: 'sakura', label: 'Hoa anh đào', emoji: '🌸' },
                      { key: 'bows', label: 'Nơ ruy băng', emoji: '🎀' },
                      { key: 'custom', label: 'Ảnh Admin tải lên', emoji: '📁' },
                    ].map((item) => {
                      const isSel = clickBurst.preset === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            const next: ClickBurstSettings = { ...clickBurst, preset: item.key as any };
                            setClickBurstSettings(next);
                            setClickBurstState(next);
                          }}
                          className={`p-2 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? 'bg-[#ffe0df] border-[#ff8fab] text-[#d45d79] shadow-2xs'
                              : 'bg-white border-[#ffc2d1] text-[#8d2d48] hover:bg-[#ffdde7]/50'
                          }`}
                        >
                          <span>{item.emoji}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Particle Count Slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#8d2d48] mb-1">
                    <span>Số lượng vật thể bung ra mỗi lần click:</span>
                    <span className="font-mono text-[#d45d79]">{clickBurst.particleCount || 8} hạt</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="14"
                    step="1"
                    value={clickBurst.particleCount || 8}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10);
                      const next = { ...clickBurst, particleCount: count };
                      setClickBurstSettings(next);
                      setClickBurstState(next);
                    }}
                    className="w-full accent-[#ff8fab] cursor-pointer"
                  />
                </div>

                {/* Custom Particle Images Upload */}
                <div className="pt-2 border-t border-[#ffb3c6]/60">
                  <span className="text-[11px] font-bold text-[#8d2d48] block mb-1">
                    Tải ảnh vật thể riêng của bạn (Admin cung cấp ảnh, AI hỗ trợ hiệu ứng bay):
                  </span>
                  <input
                    type="file"
                    ref={clickParticleFileRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const dataUrl = await compressImage(file, 200, 0.9);
                        const list = clickBurst.customImages || [];
                        const next: ClickBurstSettings = {
                          ...clickBurst,
                          preset: 'custom',
                          customImages: [...list, dataUrl],
                        };
                        setClickBurstSettings(next);
                        setClickBurstState(next);
                        showNotification('Đã thêm ảnh vật thể click mới! 🌸');
                      } catch {
                        showNotification('Không thể đọc file ảnh.');
                      } finally {
                        if (clickParticleFileRef.current) clickParticleFileRef.current.value = '';
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => clickParticleFileRef.current?.click()}
                      className="py-1.5 px-3 rounded-xl bg-[#ffdde7] hover:bg-[#ffe0df] text-[#8d2d48] text-xs font-bold border border-[#ffb3c6] cursor-pointer transition flex items-center gap-1.5"
                    >
                      <span>➕</span>
                      <span>Tải ảnh vật thể mới từ máy</span>
                    </button>
                    {(clickBurst.customImages || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next: ClickBurstSettings = { ...clickBurst, customImages: [], preset: 'mixed' };
                          setClickBurstSettings(next);
                          setClickBurstState(next);
                          showNotification('Đã xóa tất cả ảnh vật thể click.');
                        }}
                        className="py-1.5 px-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 text-xs font-bold border border-red-200 cursor-pointer"
                      >
                        Xóa ảnh ({clickBurst.customImages.length})
                      </button>
                    )}
                  </div>
                  {/* Preview uploaded particle images */}
                  {(clickBurst.customImages || []).length > 0 && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {clickBurst.customImages.map((img, i) => (
                        <div key={i} className="relative w-10 h-10 rounded-lg bg-white border border-[#ffb3c6] p-0.5 flex items-center justify-center">
                          <img src={img} alt="Particle" className="max-h-full max-w-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              const list = clickBurst.customImages.filter((_, idx) => idx !== i);
                              const next: ClickBurstSettings = { ...clickBurst, customImages: list };
                              setClickBurstSettings(next);
                              setClickBurstState(next);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Sound Effects (Hiệu ứng âm thanh ngọt ngào) */}
          <div className="p-4 rounded-2xl bg-[#ffdde7]/50 border-2 border-[#ffb3c6] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🔔</span> Hiệu Ứng Âm Thanh SFX (Sound Effects)
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-[#8d2d48]">
                <input
                  type="checkbox"
                  checked={soundSettings.enabled}
                  onChange={(e) => {
                    const next = { ...soundSettings, enabled: e.target.checked };
                    setSoundSettings(next);
                    setSoundSettingsState(next);
                    if (e.target.checked) playCuteSound('sparkle');
                  }}
                  className="rounded-sm accent-[#ff8fab] w-4 h-4 cursor-pointer"
                />
                <span>Bật âm thanh</span>
              </label>
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Âm thanh dễ thương khi bấm nút, chạm màn hình hay chuyển trang. Admin có toàn quyền thử nghe, đổi âm thanh có sẵn hoặc chèn file âm thanh riêng!
            </p>

            {soundSettings.enabled && (
              <div className="space-y-3 p-3 bg-white/70 rounded-xl border border-[#ffb3c6]/60">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'bubble', label: 'Bong bóng Pop', emoji: '🫧' },
                    { key: 'sparkle', label: 'Lấp lánh Sparkle', emoji: '✨' },
                    { key: 'bell', label: 'Chuông pha lê', emoji: '🔔' },
                    { key: 'soft_blip', label: 'Blip êm dịu', emoji: '🎀' },
                  ].map((s) => {
                    const isSel = soundSettings.preset === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          const next: SoundEffectsSettings = { ...soundSettings, preset: s.key as any };
                          setSoundSettings(next);
                          setSoundSettingsState(next);
                          playCuteSound(s.key as any);
                        }}
                        className={`p-2 rounded-xl text-left border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                          isSel
                            ? 'bg-[#ffe0df] border-[#ff8fab] text-[#d45d79] shadow-2xs'
                            : 'bg-white border-[#ffc2d1] text-[#8d2d48] hover:bg-[#ffdde7]/50'
                        }`}
                      >
                        <span className="truncate">{s.emoji} {s.label}</span>
                        <span className="text-[10px] text-[#ff8fab]">▶</span>
                      </button>
                    );
                  })}
                </div>

                {/* Volume slider */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-[#8d2d48] mb-1">
                    <span>Âm lượng hiệu ứng:</span>
                    <span className="font-mono text-[#d45d79]">{Math.round((soundSettings.volume || 0.45) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={soundSettings.volume || 0.45}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      const next = { ...soundSettings, volume: v };
                      setSoundSettings(next);
                      setSoundSettingsState(next);
                    }}
                    className="w-full accent-[#ff8fab] cursor-pointer"
                  />
                </div>

                {/* Test button & Custom sound file upload */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#ffb3c6]/60 flex-wrap">
                  <button
                    type="button"
                    onClick={() => playCuteSound('sparkle')}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[var(--theme-accent,#ff8fab)] to-[var(--theme-bubble-fill,#ffaac4)] text-white text-xs font-bold cursor-pointer transition active:scale-95 shadow-2xs"
                  >
                    ▶ Thử nghe âm thanh
                  </button>

                  <input
                    type="file"
                    ref={customSoundFileRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        const next: SoundEffectsSettings = {
                          ...soundSettings,
                          preset: 'custom',
                          customAudioUrl: dataUrl,
                        };
                        setSoundSettings(next);
                        setSoundSettingsState(next);
                        showNotification('Đã lưu file âm thanh riêng của bạn!');
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="audio/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => customSoundFileRef.current?.click()}
                    className="py-1.5 px-3 rounded-xl bg-white hover:bg-[#ffe0df] text-[#8d2d48] text-xs font-bold border border-[#ffb3c6] cursor-pointer transition"
                  >
                    📁 Tải file âm thanh riêng (.mp3 / .wav)
                  </button>

                  {soundSettings.customAudioUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const next: SoundEffectsSettings = { ...soundSettings, preset: 'bubble', customAudioUrl: null };
                        setSoundSettings(next);
                        setSoundSettingsState(next);
                      }}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Xóa file riêng
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Image Decor Effects (AI hỗ trợ hiệu ứng cho ảnh Admin up) */}
          <div className="p-4 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] shadow-xs">
            <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2 mb-1.5">
              <span>🪄</span> Hiệu Ứng Decor Cho Ảnh Upload (AI Hỗ Trợ Hiệu Ứng)
            </h3>
            <p className="text-xs text-[#b33959] mb-3">
              Ảnh là do Admin upload lên, AI hỗ trợ các hiệu ứng chuyển động, quầng sáng mềm và khung polaroid vintage để decor website lung linh!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Mascot effect */}
              <div className="p-3 rounded-xl bg-[#ffe0df]/30 border border-[#ffb3c6]">
                <label className="text-[11px] font-bold text-[#8d2d48] block mb-1">
                  🐰 Ảnh Mascot (3 chú thỏ / hoa):
                </label>
                <select
                  value={imageDecor.mascotEffect}
                  onChange={(e) => {
                    const next: ImageDecorSettings = { ...imageDecor, mascotEffect: e.target.value as ImageEffectType };
                    setImageDecorSettings(next);
                    setImageDecorState(next);
                    showNotification('Đã cập nhật hiệu ứng Mascot!');
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#ffb3c6] bg-white text-xs text-[#8d2d48] font-bold"
                >
                  <option value="bunny-jump">Thỏ nhảy nhí nhảnh (Jumping)</option>
                  <option value="floating">Bồng bềnh nhẹ nhàng (Floating)</option>
                  <option value="pulse">Nhịp thở dịu êm (Breathing Pulse)</option>
                  <option value="wiggle">Lắc lư ngộ nghĩnh (Wiggle)</option>
                  <option value="sparkles">Hào quang lấp lánh (Sparkles)</option>
                  <option value="polaroid">Khung Polaroid Vintage</option>
                  <option value="soft-glow">Quầng sáng hào quang mềm</option>
                  <option value="none">Không hiệu ứng</option>
                </select>
              </div>

              {/* Welcome screen image effect */}
              <div className="p-3 rounded-xl bg-[#ffe0df]/30 border border-[#ffb3c6]">
                <label className="text-[11px] font-bold text-[#8d2d48] block mb-1">
                  🌸 Ảnh Màn Hình Chào Mừng:
                </label>
                <select
                  value={imageDecor.welcomeEffect}
                  onChange={(e) => {
                    const next: ImageDecorSettings = { ...imageDecor, welcomeEffect: e.target.value as ImageEffectType };
                    setImageDecorSettings(next);
                    setImageDecorState(next);
                    showNotification('Đã cập nhật hiệu ứng màn hình chào mừng!');
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#ffb3c6] bg-white text-xs text-[#8d2d48] font-bold"
                >
                  <option value="floating">Bồng bềnh thơ mộng (Floating)</option>
                  <option value="pulse">Nhịp thở dịu êm (Pulse)</option>
                  <option value="bunny-jump">Nhảy nhí nhảnh (Jump)</option>
                  <option value="sparkles">Lấp lánh xung quanh (Sparkles)</option>
                  <option value="polaroid">Khung ảnh Polaroid Vintage</option>
                  <option value="soft-glow">Hào quang mềm mại (Soft Glow)</option>
                  <option value="none">Tĩnh nguyên bản</option>
                </select>
              </div>

              {/* Avatar effect */}
              <div className="p-3 rounded-xl bg-[#ffe0df]/30 border border-[#ffb3c6]">
                <label className="text-[11px] font-bold text-[#8d2d48] block mb-1">
                  🎀 Ảnh Avatar (cạnh "ngọt."):
                </label>
                <select
                  value={imageDecor.avatarEffect}
                  onChange={(e) => {
                    const next: ImageDecorSettings = { ...imageDecor, avatarEffect: e.target.value as ImageEffectType };
                    setImageDecorSettings(next);
                    setImageDecorState(next);
                    showNotification('Đã cập nhật hiệu ứng avatar!');
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#ffb3c6] bg-white text-xs text-[#8d2d48] font-bold"
                >
                  <option value="none">Chuẩn tròn gọn gàng</option>
                  <option value="pulse">Nhịp thở dịu êm (Pulse)</option>
                  <option value="floating">Bồng bềnh nhẹ (Float)</option>
                  <option value="soft-glow">Quầng sáng hào quang (Glow)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Site Avatar (Ảnh đại diện Yimeo's home góc trái thanh điều hướng) */}
          <div className="p-4 rounded-2xl bg-[#ffdde7]/60 border-2 border-[#ffb3c6] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🎀</span> Ảnh Đại Diện / Avatar (Yimeo's home)
              </h3>
              {siteAvatarImg && (
                <button
                  onClick={handleResetSiteAvatar}
                  className="text-[11px] text-[#b33959] hover:text-[#8d2d48] underline cursor-pointer"
                >
                  Gỡ avatar
                </button>
              )}
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Ảnh đại diện tròn hiển thị ở góc trái thanh điều hướng, ngay cạnh tên <strong>Yimeo's home</strong> (vị trí được khoanh tròn).
            </p>

            {siteAvatarImg ? (
              <div className="flex items-center gap-4 p-3 bg-[#fffff2] rounded-xl border border-[#ffb3c6]">
                <img
                  src={siteAvatarImg}
                  alt="Site Avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#ffb3c6] shadow-xs"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-[#8d2d48] block">Đang dùng ảnh đại diện tùy chỉnh!</span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('caomei_open_image_editor', {
                            detail: {
                              initialImage: siteAvatarImg,
                              targetTitle: "Chỉnh Sửa Avatar Yimeo's home",
                              targetType: 'avatar',
                            },
                          })
                        );
                      }}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff8fab] to-[#e56b82] text-white text-[11px] font-black shadow-2xs hover:from-[#ff7b99] hover:to-[#d4556f] transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>✂️</span>
                      <span>Chỉnh sửa & Cắt avatar</span>
                    </button>
                    <button
                      onClick={() => avatarFileRef.current?.click()}
                      className="text-xs text-[#d45d79] font-bold underline hover:text-[#8d2d48] cursor-pointer"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => avatarFileRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#ffb3c6] bg-[#fffff2] hover:bg-[#ffe0df]/50 text-[#8d2d48] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>📷</span>
                <span>Tải ảnh đại diện (Avatar) từ máy tính hoặc điện thoại</span>
              </button>
            )}

            <input
              type="file"
              ref={avatarFileRef}
              onChange={handleSiteAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Section: Bunnies Art */}
          <div className="p-4 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🐰</span> Ảnh 3 Chú Thỏ (Mascot & Loading)
              </h3>
              {bunniesImg && (
                <button
                  onClick={handleResetBunnies}
                  className="text-[11px] text-[#b33959] hover:text-[#8d2d48] underline cursor-pointer"
                >
                  Gỡ ảnh
                </button>
              )}
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Tải lên file ảnh gốc của bạn để hiển thị trong hiệu ứng loading "Just a minutes" và trang chủ.
            </p>

            {bunniesImg ? (
              <div className="flex items-center gap-4 p-3 bg-[#ffe0df]/40 rounded-xl border border-[#ffb3c6]">
                <img
                  src={bunniesImg}
                  alt="Current Bunnies"
                  className="h-16 w-auto object-contain rounded-lg border border-[#ffb3c6]"
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-[#8d2d48] block">Đang sử dụng tác phẩm gốc của bạn!</span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('caomei_open_image_editor', {
                            detail: {
                              initialImage: bunniesImg,
                              targetTitle: 'Chỉnh Sửa Ảnh 3 Chú Thỏ Mascot',
                              targetType: 'bunnies',
                            },
                          })
                        );
                      }}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff8fab] to-[#e56b82] text-white text-[11px] font-black shadow-2xs hover:from-[#ff7b99] hover:to-[#d4556f] transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>✂️</span>
                      <span>Chỉnh sửa ảnh thỏ</span>
                    </button>
                    <button
                      onClick={() => bunniesFileRef.current?.click()}
                      className="text-xs text-[#d45d79] font-bold underline hover:text-[#8d2d48] cursor-pointer"
                    >
                      Đổi file khác
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => bunniesFileRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#ffb3c6] bg-[#ffdde7]/40 hover:bg-[#ffdde7]/80 text-[#8d2d48] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>📁</span>
                <span>Chọn file ảnh 3 chú thỏ từ máy tính của bạn</span>
              </button>
            )}

            <input
              type="file"
              ref={bunniesFileRef}
              onChange={handleBunniesUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Section: Falling Objects Effect (Hiệu ứng vật thể rơi) */}
          <div className="p-4 rounded-2xl bg-[#ffdde7]/50 border-2 border-[#ffb3c6] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🌸</span> Hiệu Ứng Vật Thể Rơi Trên Web (Falling Objects)
              </h3>
              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() =>
                  updateFallingSettings({
                    ...fallingSettings,
                    enabled: !fallingSettings.enabled,
                  })
                }
                className={`px-3 py-1 rounded-full text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                  fallingSettings.enabled
                    ? 'bg-[#ff9ebb] text-white border-[#f888a7] shadow-xs'
                    : 'bg-[#fffff2] text-[#8d2d48] border-[#ffc2d1]'
                }`}
              >
                <span>{fallingSettings.enabled ? '✓ Đang Bật' : '✕ Đang Tắt'}</span>
              </button>
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Tùy chọn vật thể rơi nhẹ nhàng trên màn hình: chọn mẫu sẵn (dâu tây, hoa đào, nơ, ngôi sao...) hoặc tải ảnh/vật phẩm riêng của admin!
            </p>

            {fallingSettings.enabled && (
              <div className="space-y-4 pt-1">
                {/* 1. Choose Falling Item / Preset */}
                <div>
                  <label className="font-bold text-[#8d2d48] text-xs block mb-1.5">
                    1. Chọn đồ / vật thể rơi:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { key: 'strawberry', label: 'Dâu tây', emoji: '🍓' },
                      { key: 'sakura', label: 'Hoa đào', emoji: '🌸' },
                      { key: 'sparkle', label: 'Ngôi sao', emoji: '✨' },
                      { key: 'bow', label: 'Nơ hồng', emoji: '🎀' },
                      { key: 'heart', label: 'Trái tim', emoji: '💖' },
                      { key: 'bunny', label: 'Thỏ con', emoji: '🐇' },
                    ].map((preset) => {
                      const isSelected =
                        fallingSettings.type === 'preset' && fallingSettings.preset === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() =>
                            updateFallingSettings({
                              ...fallingSettings,
                              type: 'preset',
                              preset: preset.key as any,
                            })
                          }
                          className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#fffff2] border-[#ff8fab] shadow-xs scale-102 font-black text-[#d45d79]'
                              : 'bg-[#fffff2]/70 border-[#ffc2d1] hover:bg-[#fffff2] text-[#8d2d48]'
                          }`}
                        >
                          <span className="text-xl">{preset.emoji}</span>
                          <span className="text-[10px]">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Custom Uploaded Image / Sticker to Fall (Cho phép thêm và xóa bớt tùy ý admin) */}
                <div className="p-3.5 rounded-xl bg-[#fffff2] border-2 border-[#ffc2d1] flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-[#8d2d48] block">
                        Bộ sưu tập ảnh vật thể rơi riêng (Tự do thêm & xóa bớt):
                      </span>
                      <span className="text-[10px] text-[#b33959] block">
                        Các ảnh này sẽ cùng rơi ngẫu nhiên, hòa trộn với hiệu ứng loang bóng mờ nhỏ gọn ngọt ngào!
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fallingImgFileRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white text-xs font-black shadow-xs cursor-pointer transition active:scale-95 flex items-center gap-1 flex-shrink-0"
                      >
                        <span>+</span>
                        <span>Thêm ảnh rơi mới</span>
                      </button>

                      {(fallingSettings.customImages && fallingSettings.customImages.length > 0) && (
                        <button
                          type="button"
                          onClick={handleClearAllFallingImages}
                          className="px-2.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold border border-red-200 cursor-pointer transition flex items-center gap-1 flex-shrink-0"
                        >
                          <span>🗑️</span>
                          <span>Xóa tất cả</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Gallery of all custom falling images */}
                  {(fallingSettings.customImages && fallingSettings.customImages.length > 0) ? (
                    <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-2 bg-[#ffe0df]/30 rounded-xl border border-[#ffb3c6]/60">
                      {fallingSettings.customImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group w-14 h-14 rounded-xl bg-[#fffff2] border-2 border-[#ffb3c6] p-1 flex items-center justify-center shadow-2xs hover:scale-105 transition"
                        >
                          <img
                            src={imgUrl}
                            alt={`Falling object ${idx + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(
                                new CustomEvent('caomei_open_image_editor', {
                                  detail: {
                                    initialImage: imgUrl,
                                    targetTitle: `Sửa ảnh vật thể rơi #${idx + 1}`,
                                    targetType: 'falling',
                                  },
                                })
                              );
                            }}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#ff8fab] hover:bg-[#e56b82] text-white font-black text-[9px] flex items-center justify-center shadow-xs opacity-90 sm:opacity-75 group-hover:opacity-100 transition cursor-pointer z-20"
                            title="Sửa ảnh này"
                          >
                            ✂️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomFallingImage(idx)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs opacity-90 sm:opacity-75 group-hover:opacity-100 transition cursor-pointer z-20"
                            title="Xóa bớt ảnh rơi này"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-[#ffb3c6] text-center text-[#b33959] text-xs">
                      Chưa có ảnh rơi riêng nào. Hãy bấm <strong>"+ Thêm ảnh rơi mới"</strong> để tải bất kỳ ảnh PNG/Sticker nào bạn muốn!
                    </div>
                  )}

                  {/* Lớp loang bóng mờ sau mỗi hiệu ứng rơi (Glow shadow color settings) */}
                  <div className="pt-2 border-t border-[#ffc2d1]/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-[#8d2d48] flex items-center gap-1">
                        <span>✨</span>
                        <span>Màu lớp loang bóng mờ sau vật thể rơi:</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#b33959]">
                        {fallingSettings.glowColor || '#ff9ebb'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { name: '🍓 Hồng dâu', color: '#ff9ebb' },
                        { name: '🌸 Phấn ngọt', color: '#ffcad4' },
                        { name: '💜 Tím nhạt', color: '#e0c3fc' },
                        { name: '⭐ Vàng tươi', color: '#ffd166' },
                        { name: '☁️ Xanh mây', color: '#b5e2fa' },
                        { name: '💖 Đỏ cherry', color: '#ff6584' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => {
                            updateFallingSettings({
                              ...fallingSettings,
                              glowColor: item.color,
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            (fallingSettings.glowColor || '#ff9ebb') === item.color
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7] shadow-xs'
                              : 'bg-[#fffff2] text-[#8d2d48] border-[#ffb3c6] hover:bg-[#ffe0df]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/20"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </button>
                      ))}

                      {/* Custom color input */}
                      <label className="flex items-center gap-1 text-[10px] font-bold text-[#8d2d48] cursor-pointer bg-[#fffff2] px-2 py-1 rounded-full border border-[#ffb3c6]">
                        <span>Tự chọn:</span>
                        <input
                          type="color"
                          value={fallingSettings.glowColor || '#ff9ebb'}
                          onChange={(e) => {
                            updateFallingSettings({
                              ...fallingSettings,
                              glowColor: e.target.value,
                            });
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hidden input for custom falling object */}
                <input
                  type="file"
                  ref={fallingImgFileRef}
                  onChange={handleCustomFallingUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* 3. Density & Speed & Size adjustments */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Density */}
                  <div className="p-2.5 rounded-xl bg-[#fffff2] border border-[#ffc2d1]">
                    <span className="font-bold text-[11px] block mb-1.5">Số lượng rơi:</span>
                    <div className="flex gap-1">
                      {[
                        { key: 'few', label: 'Ít' },
                        { key: 'medium', label: 'Vừa' },
                        { key: 'many', label: 'Nhiều' },
                      ].map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() =>
                            updateFallingSettings({
                              ...fallingSettings,
                              density: d.key as any,
                            })
                          }
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                            fallingSettings.density === d.key
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                              : 'bg-[#ffdde7]/50 text-[#8d2d48] border-[#ffb3c6]'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="p-2.5 rounded-xl bg-[#fffff2] border border-[#ffc2d1]">
                    <span className="font-bold text-[11px] block mb-1.5">Tốc độ rơi:</span>
                    <div className="flex gap-1">
                      {[
                        { key: 'slow', label: 'Chậm' },
                        { key: 'normal', label: 'Vừa' },
                        { key: 'fast', label: 'Nhanh' },
                      ].map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() =>
                            updateFallingSettings({
                              ...fallingSettings,
                              speed: s.key as any,
                            })
                          }
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                            fallingSettings.speed === s.key
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                              : 'bg-[#ffdde7]/50 text-[#8d2d48] border-[#ffb3c6]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="p-2.5 rounded-xl bg-[#fffff2] border border-[#ffc2d1]">
                    <span className="font-bold text-[11px] block mb-1.5">Kích thước:</span>
                    <div className="flex gap-1">
                      {[
                        { key: 'small', label: 'Nhỏ' },
                        { key: 'medium', label: 'Vừa' },
                        { key: 'large', label: 'Lớn' },
                      ].map((sz) => (
                        <button
                          key={sz.key}
                          type="button"
                          onClick={() =>
                            updateFallingSettings({
                              ...fallingSettings,
                              size: sz.key as any,
                            })
                          }
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition ${
                            fallingSettings.size === sz.key
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                              : 'bg-[#ffdde7]/50 text-[#8d2d48] border-[#ffb3c6]'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Background Pattern */}
          <div className="p-4 rounded-2xl bg-[#fffff2] border-2 border-[#ffc2d1] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-[#d45d79] text-sm sm:text-base flex items-center gap-2">
                <span>🌸</span> Ảnh Nền Toàn Website
              </h3>
              {bgImg && (
                <button
                  onClick={handleResetBg}
                  className="text-[11px] text-[#b33959] hover:text-[#8d2d48] underline cursor-pointer"
                >
                  Đặt lại mặc định
                </button>
              )}
            </div>
            <p className="text-xs text-[#b33959] mb-3">
              Tải lên ảnh nền họa tiết ren / chấm bi dâu tây mà bạn thích.
            </p>

            {bgImg ? (
              <div className="flex items-center gap-4 p-3 bg-[#ffe0df]/40 rounded-xl border border-[#ffb3c6]">
                <div
                  className="h-16 w-20 rounded-lg border border-[#ffb3c6]"
                  style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover' }}
                />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-[#8d2d48] block">Đang áp dụng hình nền tùy chỉnh</span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('caomei_open_image_editor', {
                            detail: {
                              initialImage: bgImg,
                              targetTitle: 'Chỉnh Sửa & Tùy Biến Ảnh Nền Web',
                              targetType: 'background',
                            },
                          })
                        );
                      }}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#ff8fab] to-[#e56b82] text-white text-[11px] font-black shadow-2xs hover:from-[#ff7b99] hover:to-[#d4556f] transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>✂️</span>
                      <span>Chỉnh sửa ảnh nền</span>
                    </button>
                    <button
                      onClick={() => bgFileRef.current?.click()}
                      className="text-xs text-[#d45d79] font-bold underline hover:text-[#8d2d48] cursor-pointer"
                    >
                      Đổi hình nền khác
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => bgFileRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#ffb3c6] bg-[#ffdde7]/40 hover:bg-[#ffdde7]/80 text-[#8d2d48] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>🖼️</span>
                <span>Chọn ảnh nền từ máy tính của bạn</span>
              </button>
            )}

            <input
              type="file"
              ref={bgFileRef}
              onChange={handleBackgroundUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#ffdde7] border-t-2 border-[#ffb3c6] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 border border-[#f888a7] cursor-pointer"
          >
            Đóng & Áp dụng ngay
          </button>
        </div>

        {/* Custom Palette Studio Modal */}
        <PaletteModal
          isOpen={showPaletteEditorModal}
          onClose={() => setShowPaletteEditorModal(false)}
        />

        {/* Web Theme Backup & Management Modal */}
        <ThemeBackupModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          onApplied={() => {
            if (onUpdated) onUpdated();
          }}
        />
      </div>
    </div>
  );
}

export default function ArtSettingsModal({ isOpen, onClose, onUpdated }: ArtSettingsModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return <ArtSettingsContent onClose={onClose} onUpdated={onUpdated} />;
}

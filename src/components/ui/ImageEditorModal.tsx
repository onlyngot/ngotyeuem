import { useState, useRef, useEffect, ChangeEvent, MouseEvent, TouchEvent } from 'react';
import {
  getBackgroundArt,
  setBackgroundArt,
  getBunniesArt,
  setBunniesArt,
  getCustomIconSlots,
  setCustomIconSlot,
  addCustomSticker,
  getCustomStickers,
  getFallingEffectSettings,
  setFallingEffectSettings,
  getBackgroundSettings,
  setBackgroundSettings,
  BackgroundSettings,
  CustomIconSlots,
  ICON_SLOT_DEFINITIONS,
  getSiteAvatarArt,
  setSiteAvatarArt,
  getLobbyBgmSettings,
  setLobbyBgmSettings,
} from '@/src/data/artStorage';
import { getCharacters, saveCharacters } from '@/src/data/storage';
import { Character } from '@/src/types/character';

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  targetTitle?: string;
  targetType?: 'general' | 'avatar' | 'artwork' | 'icon' | 'background' | 'falling' | 'sticker' | 'playlist_cover';
  targetSlotKey?: keyof CustomIconSlots;
  characterId?: string;
  onSaved?: (editedDataUrl: string) => void;
}

// Preset cute pastel color filters
const CUTE_FILTERS = [
  { id: 'normal', name: '🌸 Gốc', filter: 'none' },
  { id: 'strawberry', name: '🍓 Hồng Dâu', filter: 'hue-rotate(-10deg) saturate(1.2) contrast(1.05)' },
  { id: 'dreamy', name: '✨ Mộng Mơ', filter: 'brightness(1.08) contrast(0.95) saturate(1.15)' },
  { id: 'warm', name: '🍑 Ấm Áp', filter: 'sepia(0.2) saturate(1.2) brightness(1.02)' },
  { id: 'vibrant', name: '💖 Tươi Sáng', filter: 'saturate(1.4) contrast(1.1)' },
  { id: 'bw', name: '🖤 Cổ Điển', filter: 'grayscale(1) contrast(1.1)' },
];

export default function ImageEditorModal({
  isOpen,
  onClose,
  initialImage,
  targetTitle,
  targetType = 'general',
  targetSlotKey,
  characterId,
  onSaved,
}: ImageEditorModalProps) {
  // Current active image source
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [activeTab, setActiveTab] = useState<'transform' | 'filters' | 'background' | 'library'>('transform');

  // Transformations
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | '3:4' | 'free'>('1:1');
  const [showCircularMask, setShowCircularMask] = useState(
    targetType === 'avatar' || targetType === 'icon' || (targetTitle?.toLowerCase().includes('đĩa') ?? false)
  );

  // Filters
  const [activeFilterId, setActiveFilterId] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Background display settings
  const [bgSettings, setBgSettings] = useState<BackgroundSettings>(getBackgroundSettings());

  // Interactive dragging on preview canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showOtherSaveMenu, setShowOtherSaveMenu] = useState(false);

  // Quick library data
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stickers, setStickers] = useState<string[]>([]);
  const [iconSlots, setIconSlots] = useState<CustomIconSlots>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sync when opened or initialImage changes
  useEffect(() => {
    if (isOpen) {
      setImageSrc(initialImage || getBackgroundArt() || null);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setRotate(0);
      setFlipH(false);
      setFlipV(false);
      setActiveFilterId('normal');
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBgSettings(getBackgroundSettings());
      setCharacters(getCharacters());
      setStickers(getCustomStickers());
      setIconSlots(getCustomIconSlots());
      setShowOtherSaveMenu(false);
      setShowCircularMask(
        targetType === 'avatar' || targetType === 'icon' || (targetTitle?.toLowerCase().includes('đĩa') ?? false)
      );
    }
  }, [isOpen, initialImage, targetType, targetTitle]);

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setRotate(0);
      showNotification('Đã tải ảnh lên! Bạn có thể kéo chuột để căn chỉnh.');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Mouse drag handlers
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!imageSrc || e.touches.length === 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - panX,
      y: e.touches[0].clientY - panY,
    });
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length === 0) return;
    setPanX(e.touches[0].clientX - dragStart.x);
    setPanY(e.touches[0].clientY - dragStart.y);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!imageSrc) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => Math.min(3.5, Math.max(0.2, +(z + delta).toFixed(2))));
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setActiveFilterId('normal');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    showNotification('Đã đặt lại kích thước và góc quay ban đầu.');
  };

  // Export baked canvas to base64 Data URL
  const exportRenderedCanvas = (customWidth?: number, customHeight?: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!imageSrc) {
        resolve('');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let outW = customWidth || 600;
        let outH = customHeight || 600;

        if (aspectRatio === '4:3') {
          outH = Math.round((outW * 3) / 4);
        } else if (aspectRatio === '16:9') {
          outH = Math.round((outW * 9) / 16);
        } else if (aspectRatio === '3:4') {
          outH = Math.round((outW * 4) / 3);
        }

        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Apply filters
        const activeFilter = CUTE_FILTERS.find((f) => f.id === activeFilterId);
        const filterStr = `${activeFilter?.filter !== 'none' ? activeFilter?.filter : ''} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`.trim();
        if (filterStr) {
          ctx.filter = filterStr;
        }

        ctx.save();
        const scaleFactor = outW / 320;
        ctx.translate(outW / 2 + panX * scaleFactor, outH / 2 + panY * scaleFactor);
        ctx.scale(zoom * (flipH ? -1 : 1), zoom * (flipV ? -1 : 1));
        ctx.rotate((rotate * Math.PI) / 180);

        const srcAspect = img.width / img.height;
        let drawW = outW;
        let drawH = outH;
        if (srcAspect > 1) {
          drawW = outH * srcAspect;
        } else {
          drawH = outW / srcAspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const result = canvas.toDataURL('image/png', 0.94);
        resolve(result);
      };
      img.onerror = () => resolve(imageSrc);
      img.src = imageSrc;
    });
  };

  // Requirement: Thêm nút hoàn tất chỉnh sửa & Áp dụng ảnh đĩa nhạc / avatar / icon
  const handleFinishAndApply = async () => {
    if (!imageSrc) {
      showNotification('Vui lòng chọn hoặc tải một ảnh lên để hoàn tất.');
      return;
    }
    setIsExporting(true);
    try {
      const bakedUrl = await exportRenderedCanvas();

      if (onSaved) {
        onSaved(bakedUrl);
      }

      if (targetSlotKey) {
        setCustomIconSlot(targetSlotKey, bakedUrl);
        setIconSlots(getCustomIconSlots());
      }

      if (targetType === 'avatar') {
        if (characterId) {
          const list = getCharacters();
          const updated = list.map((c) => (c.id === characterId ? { ...c, avatarUrl: bakedUrl } : c));
          saveCharacters(updated);
        } else {
          setSiteAvatarArt(bakedUrl);
        }
      }

      if (targetType === 'artwork' && characterId) {
        const list = getCharacters();
        const updated = list.map((c) => (c.id === characterId ? { ...c, mainImageUrl: bakedUrl } : c));
        saveCharacters(updated);
      }

      if (targetType === 'playlist_cover') {
        const bgm = getLobbyBgmSettings();
        setLobbyBgmSettings({
          ...bgm,
          featuredImage: bakedUrl,
          featuredImagePanX: 0,
          featuredImagePanY: 0,
          featuredImageZoom: 1,
        });
      }

      showNotification('✅ Đã hoàn tất chỉnh sửa và áp dụng ảnh thành công! ✨');
      setTimeout(() => {
        onClose();
      }, 350);
    } catch {
      showNotification('Có lỗi khi lưu ảnh.');
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Save Actions to other targets
  const handleSaveToTarget = async (destination: string) => {
    if (!imageSrc) {
      showNotification('Vui lòng chọn hoặc tải một ảnh lên để chỉnh sửa.');
      return;
    }
    setIsExporting(true);
    try {
      const bakedUrl = await exportRenderedCanvas();

      if (onSaved) {
        onSaved(bakedUrl);
      }

      switch (destination) {
        case 'background':
          setBackgroundArt(bakedUrl);
          setBackgroundSettings(bgSettings);
          showNotification('🌸 Đã lưu và áp dụng làm Ảnh Nền toàn web thành công!');
          break;

        case 'bunnies':
          setBunniesArt(bakedUrl);
          showNotification('🐰 Đã lưu làm Mascot 3 Chú Thỏ thành công!');
          break;

        case 'avatar':
        case 'siteAvatar':
          setSiteAvatarArt(bakedUrl);
          showNotification("🎀 Đã lưu và áp dụng làm Avatar Yimeo's home thành công!");
          break;

        case 'falling': {
          const current = getFallingEffectSettings();
          const list = current.customImages || [];
          setFallingEffectSettings({
            ...current,
            type: 'custom',
            customImageUrl: bakedUrl,
            customImages: [...list, bakedUrl],
          });
          showNotification('🌸 Đã lưu làm Vật Thể Rơi cho toàn web!');
          break;
        }

        case 'sticker':
          addCustomSticker(bakedUrl);
          setStickers(getCustomStickers());
          showNotification('🍓 Đã thêm ảnh vào bộ sưu tập Sticker!');
          break;

        case 'searchIcon':
        case 'heartIcon':
        case 'sparkleIcon':
        case 'bowIcon':
        case 'strawberryIcon':
        case 'pillIcon':
          setCustomIconSlot(destination as keyof CustomIconSlots, bakedUrl);
          setIconSlots(getCustomIconSlots());
          showNotification(`✨ Đã thay thế icon web [${destination}] thành công!`);
          break;

        case 'playlist_cover': {
          const currentBgm = getLobbyBgmSettings();
          setLobbyBgmSettings({
            ...currentBgm,
            featuredImage: bakedUrl,
            featuredImagePanX: 0,
            featuredImagePanY: 0,
            featuredImageZoom: 1,
          });
          showNotification('🎵 Đã lưu và áp dụng làm Ảnh bìa Playlist!');
          break;
        }

        default:
          break;
      }
    } catch {
      showNotification('Có lỗi khi lưu ảnh.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!imageSrc) return;
    setIsExporting(true);
    try {
      const bakedUrl = await exportRenderedCanvas(1000, 1000);
      const a = document.createElement('a');
      a.href = bakedUrl;
      a.download = `yimeo_edited_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showNotification('📥 Đã tải file ảnh sắc nét về máy của bạn!');
    } catch {
      showNotification('Không thể xuất file tải về.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const isVinylTarget = targetTitle?.toLowerCase().includes('đĩa') || targetType === 'icon';

  return (
    <div className="fixed inset-0 z-[1001] bg-black/65 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-[#fffff2] rounded-3xl border-4 border-[#ffb3c6] shadow-2xl flex flex-col text-[#8d2d48] m-auto overflow-hidden">
        {/* Fixed Header Bar */}
        <div className="bg-[#ffdde7] px-4 py-2.5 flex items-center justify-between border-b-2 border-[#ffb3c6] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">✂️</span>
            <div>
              <span className="text-[#8d2d48] text-sm sm:text-base font-black tracking-wider uppercase block">
                {targetTitle || 'Studio Chỉnh Sửa & Căn Chỉnh Ảnh'}
              </span>
              <span className="text-[11px] text-[#b33959] font-medium hidden sm:inline">
                Phóng to, thu nhỏ, di chuyển trái/phải, xoay góc & lưu làm ảnh đĩa than, avatar hoặc sticker!
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#ffc2d1] hover:bg-[#ff9ebb] text-[#7a1f38] font-bold flex items-center justify-center text-base transition border border-[#ffb3c6] cursor-pointer shadow-2xs"
            title="Đóng trình chỉnh sửa"
          >
            ×
          </button>
        </div>

        {/* Status notification toast */}
        {statusMsg && (
          <div className="bg-[#ffe0df] border-b border-[#ffb3c6] px-4 py-2 text-[#8d2d48] text-xs font-bold text-center animate-fadeIn flex-shrink-0">
            {statusMsg}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-[#ffc2d1] bg-[#fffff2] px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold flex-shrink-0">
          <button
            onClick={() => setActiveTab('transform')}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transform'
                ? 'bg-[#ffdde7] text-[#8d2d48] border-t-2 border-x-2 border-[#ffb3c6]'
                : 'text-[#b33959] hover:bg-[#ffe0df]/50'
            }`}
          >
            <span>🔍</span>
            <span>Phóng to & Di chuyển</span>
          </button>

          <button
            onClick={() => setActiveTab('filters')}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'filters'
                ? 'bg-[#ffdde7] text-[#8d2d48] border-t-2 border-x-2 border-[#ffb3c6]'
                : 'text-[#b33959] hover:bg-[#ffe0df]/50'
            }`}
          >
            <span>🎨</span>
            <span>Màu sắc & Bộ lọc</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'background'
                ? 'bg-[#ffdde7] text-[#8d2d48] border-t-2 border-x-2 border-[#ffb3c6]'
                : 'text-[#b33959] hover:bg-[#ffe0df]/50'
            }`}
          >
            <span>🖼️</span>
            <span>Cài đặt Ảnh Nền</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-2 rounded-t-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-[#ffdde7] text-[#8d2d48] border-t-2 border-x-2 border-[#ffb3c6]'
                : 'text-[#b33959] hover:bg-[#ffe0df]/50'
            }`}
          >
            <span>📁</span>
            <span>Kho Ảnh Web</span>
          </button>
        </div>

        {/* Scrollable Content Body with zero overlap between preview and controls */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Left Column: Interactive Canvas Preview */}
            <div className="md:col-span-6 lg:col-span-6 flex flex-col items-center gap-2.5">
              <div className="w-full flex items-center justify-between text-xs font-bold text-[#8d2d48]">
                <span className="flex items-center gap-1">
                  <span>🖱️</span>
                  <span>Kéo chuột/ngón tay để di chuyển ảnh</span>
                </span>
                <span className="text-[10px] text-[#b33959] bg-[#ffe0df] px-2 py-0.5 rounded-full border border-[#ffb3c6]">
                  Cuộn: Zoom
                </span>
              </div>

              {/* Viewport Frame with clean relative bounds */}
              <div
                ref={previewContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                className={`relative w-full max-w-[340px] h-[220px] sm:h-[260px] bg-[#ffe0df]/40 border-4 border-[#ffb3c6] rounded-3xl overflow-hidden flex items-center justify-center shadow-inner cursor-grab select-none ${
                  isDragging ? 'cursor-grabbing' : ''
                }`}
              >
                {imageSrc ? (
                  <>
                    <img
                      src={imageSrc}
                      alt="Preview"
                      draggable={false}
                      style={{
                        transform: `translate(${panX}px, ${panY}px) scale(${zoom * (flipH ? -1 : 1)}, ${zoom * (flipV ? -1 : 1)}) rotate(${rotate}deg)`,
                        transformOrigin: 'center center',
                        filter: `${
                          CUTE_FILTERS.find((f) => f.id === activeFilterId)?.filter !== 'none'
                            ? CUTE_FILTERS.find((f) => f.id === activeFilterId)?.filter
                            : ''
                        } brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                        transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                      }}
                      className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-xs"
                    />

                    {/* Circular Mask Guide */}
                    {showCircularMask && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-[190px] h-[190px] rounded-full border-2 border-dashed border-[#ff6584] bg-transparent flex items-center justify-center">
                          <span className="text-[10px] font-bold text-[#b33959] bg-[#fffff2]/90 px-2 py-0.5 rounded-full shadow-2xs border border-[#ffb3c6]">
                            Khung tròn Đĩa / Icon
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Subtle Crosshairs */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#d45d79]" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#d45d79]" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-[#b33959] gap-2">
                    <span className="text-4xl">🖼️</span>
                    <span className="text-xs font-bold">Chưa chọn ảnh nào</span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-full bg-[#ff9ebb] hover:bg-[#ff8fab] text-white text-xs font-black shadow-xs cursor-pointer transition active:scale-95"
                    >
                      Tải ảnh từ máy lên ngay ➔
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons under canvas */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-[#ffdde7] hover:bg-[#ffe0df] text-[#8d2d48] border border-[#ffb3c6] text-xs font-bold cursor-pointer transition flex items-center gap-1 active:scale-95"
                >
                  <span>📁</span>
                  <span>Tải ảnh khác</span>
                </button>

                <button
                  onClick={() => setShowCircularMask(!showCircularMask)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition flex items-center gap-1 active:scale-95 ${
                    showCircularMask
                      ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                      : 'bg-[#fffff2] text-[#8d2d48] border-[#ffc2d1] hover:bg-[#ffe0df]'
                  }`}
                  title="Bật/Tắt xem trước viền tròn cho ảnh đĩa than hoặc avatar"
                >
                  <span>⭕</span>
                  <span>Khung tròn {showCircularMask ? 'Bật' : 'Tắt'}</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-full bg-[#fffff2] hover:bg-[#ffe0df] text-[#b33959] border border-[#ffc2d1] text-xs font-bold cursor-pointer transition active:scale-95"
                  title="Đặt lại về trạng thái gốc"
                >
                  ↺ Đặt lại
                </button>
              </div>
            </div>

            {/* Right Column: Controls and Settings */}
            <div className="md:col-span-6 lg:col-span-6 flex flex-col gap-3">
              {/* Tab 1: Transform */}
              {activeTab === 'transform' && (
                <div className="space-y-3 bg-[#ffdde7]/35 p-3.5 rounded-2xl border-2 border-[#ffb3c6] text-xs">
                  {/* Zoom Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center font-bold">
                      <span>🔍 Phóng to / Thu nhỏ (Zoom):</span>
                      <span className="font-mono text-[#b33959] font-bold">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setZoom((z) => Math.max(0.2, +(z - 0.1).toFixed(2)))}
                        className="w-7 h-7 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                      >
                        −
                      </button>
                      <input
                        type="range"
                        min="0.2"
                        max="3.5"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-[#ff8fab] cursor-pointer"
                      />
                      <button
                        onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.1).toFixed(2)))}
                        className="w-7 h-7 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold flex items-center justify-center hover:bg-[#ffdde7] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pan X */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center font-bold">
                      <span>↔️ Di chuyển Trái / Phải:</span>
                      <span className="font-mono text-[#b33959] font-bold">
                        {panX > 0 ? `+${panX}px` : `${panX}px`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPanX((p) => p - 10)}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        ◄ Trái
                      </button>
                      <input
                        type="range"
                        min="-200"
                        max="200"
                        step="2"
                        value={panX}
                        onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#ff8fab] cursor-pointer"
                      />
                      <button
                        onClick={() => setPanX((p) => p + 10)}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        Phải ►
                      </button>
                    </div>
                  </div>

                  {/* Pan Y */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center font-bold">
                      <span>↕️ Di chuyển Lên / Xuống:</span>
                      <span className="font-mono text-[#b33959] font-bold">
                        {panY > 0 ? `+${panY}px` : `${panY}px`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPanY((p) => p - 10)}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        ▲ Lên
                      </button>
                      <input
                        type="range"
                        min="-200"
                        max="200"
                        step="2"
                        value={panY}
                        onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#ff8fab] cursor-pointer"
                      />
                      <button
                        onClick={() => setPanY((p) => p + 10)}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        Xuống ▼
                      </button>
                    </div>
                  </div>

                  {/* Rotate & Flip */}
                  <div className="flex flex-col gap-1 pt-1 border-t border-[#ffc2d1]">
                    <div className="flex justify-between items-center font-bold">
                      <span>🔄 Xoay góc:</span>
                      <span className="font-mono text-[#b33959] font-bold">{rotate}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRotate((r) => (r - 90 < -180 ? 180 : r - 90))}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        ↺ -90°
                      </button>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="5"
                        value={rotate}
                        onChange={(e) => setRotate(parseInt(e.target.value, 10))}
                        className="flex-1 accent-[#ff8fab] cursor-pointer"
                      />
                      <button
                        onClick={() => setRotate((r) => (r + 90 > 180 ? -180 : r + 90))}
                        className="px-2 py-1 rounded-lg bg-[#fffff2] border border-[#ffb3c6] font-bold hover:bg-[#ffdde7] cursor-pointer text-[10px]"
                      >
                        +90° ↻
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => setFlipH(!flipH)}
                        className={`flex-1 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                          flipH ? 'bg-[#ff9ebb] text-white border-[#f888a7]' : 'bg-[#fffff2] border-[#ffb3c6] hover:bg-[#ffdde7]'
                        }`}
                      >
                        ↔️ Lật ngang (Mirror)
                      </button>
                      <button
                        onClick={() => setFlipV(!flipV)}
                        className={`flex-1 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition ${
                          flipV ? 'bg-[#ff9ebb] text-white border-[#f888a7]' : 'bg-[#fffff2] border-[#ffb3c6] hover:bg-[#ffdde7]'
                        }`}
                      >
                        ↕️ Lật dọc
                      </button>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="pt-1 border-t border-[#ffc2d1]">
                    <span className="font-bold block mb-1">📐 Tỉ lệ khung cắt:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['1:1', '4:3', '16:9', 'free'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`py-1 rounded-lg font-bold text-[10px] border cursor-pointer transition ${
                            aspectRatio === ratio
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                              : 'bg-[#fffff2] text-[#8d2d48] border-[#ffb3c6] hover:bg-[#ffe0df]'
                          }`}
                        >
                          {ratio === '1:1' ? '1:1 Vuông' : ratio === '4:3' ? '4:3 Tranh' : ratio === '16:9' ? '16:9 Rộng' : 'Tự do'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Filters */}
              {activeTab === 'filters' && (
                <div className="space-y-3 bg-[#ffdde7]/35 p-3.5 rounded-2xl border-2 border-[#ffb3c6] text-xs">
                  <div>
                    <span className="font-bold block mb-1.5">🌸 Bộ lọc màu phong cách Y2K & Kawaii:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CUTE_FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setActiveFilterId(f.id)}
                          className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                            activeFilterId === f.id
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7] shadow-xs'
                              : 'bg-[#fffff2] text-[#8d2d48] border-[#ffc2d1] hover:bg-[#ffe0df]'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sliders: Brightness, Contrast, Saturation */}
                  <div className="space-y-2 pt-2 border-t border-[#ffc2d1]">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>☀️ Độ sáng (Brightness):</span>
                        <span className="font-mono text-[#b33959]">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="160"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                        className="w-full accent-[#ff8fab] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>🌓 Độ tương phản (Contrast):</span>
                        <span className="font-mono text-[#b33959]">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="160"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                        className="w-full accent-[#ff8fab] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-bold">
                        <span>🍓 Độ rực rỡ màu (Saturation):</span>
                        <span className="font-mono text-[#b33959]">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                        className="w-full accent-[#ff8fab] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Background Settings */}
              {activeTab === 'background' && (
                <div className="space-y-3 bg-[#ffdde7]/35 p-3.5 rounded-2xl border-2 border-[#ffb3c6] text-xs">
                  <div>
                    <span className="font-bold block mb-1">Kiểu hiển thị ảnh nền website:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'repeat', label: 'Họa tiết lặp (Tile)' },
                        { key: 'cover', label: 'Toàn màn hình (Cover)' },
                        { key: 'contain', label: 'Căn giữa (Contain)' },
                      ].map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setBgSettings({ ...bgSettings, mode: m.key as any })}
                          className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer text-center ${
                            bgSettings.mode === m.key
                              ? 'bg-[#ff9ebb] text-white border-[#f888a7]'
                              : 'bg-[#fffff2] text-[#8d2d48] border-[#ffc2d1] hover:bg-[#ffe0df]'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bgSettings.mode === 'repeat' && (
                    <div className="pt-2 border-t border-[#ffc2d1]">
                      <div className="flex justify-between font-bold">
                        <span>Kích thước ô lặp (Tile Size):</span>
                        <span className="font-mono text-[#b33959]">{bgSettings.tileSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="240"
                        step="10"
                        value={bgSettings.tileSize}
                        onChange={(e) =>
                          setBgSettings({ ...bgSettings, tileSize: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-[#ff8fab] cursor-pointer"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleSaveToTarget('background')}
                    disabled={isExporting}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] text-white font-bold cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>🖼️</span>
                    <span>Áp dụng làm Ảnh Nền Web ngay</span>
                  </button>
                </div>
              )}

              {/* Tab 4: Web Image Library */}
              {activeTab === 'library' && (
                <div className="space-y-3 bg-[#ffdde7]/35 p-3.5 rounded-2xl border-2 border-[#ffb3c6] text-xs max-h-72 overflow-y-auto">
                  <span className="font-bold text-[#8d2d48] block">Chọn nhanh ảnh từ kho để chỉnh sửa:</span>
                  <div className="grid grid-cols-4 gap-2">
                    {stickers.map((st, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setImageSrc(st);
                          showNotification('Đã tải sticker vào trình chỉnh sửa!');
                        }}
                        className="w-14 h-14 rounded-xl bg-[#fffff2] border border-[#ffb3c6] p-1 flex items-center justify-center cursor-pointer hover:scale-105 transition shadow-2xs"
                      >
                        <img src={st} alt="Sticker" className="max-h-full max-w-full object-contain" />
                      </div>
                    ))}
                    {characters.map((char) => {
                      const img = char.avatarUrl || char.mainImageUrl;
                      if (!img) return null;
                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            setImageSrc(img);
                            showNotification(`Đã tải ảnh của ${char.name}!`);
                          }}
                          className="w-14 h-14 rounded-xl bg-[#fffff2] border border-[#ffb3c6] p-1 flex items-center justify-center cursor-pointer hover:scale-105 transition shadow-2xs"
                        >
                          <img src={img} alt={char.name} className="max-h-full max-w-full object-contain" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar with dedicated Finish & Apply button */}
        <div className="bg-[#ffdde7] px-4 py-3 border-t-2 border-[#ffb3c6] flex-shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isExporting || !imageSrc}
              className="px-3 py-2 rounded-xl bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] border border-[#ffb3c6] font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <span>📥</span>
              <span>Tải file PNG</span>
            </button>

            <button
              onClick={() => setShowOtherSaveMenu(!showOtherSaveMenu)}
              className="px-3 py-2 rounded-xl bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] border border-[#ffb3c6] font-bold text-xs cursor-pointer transition flex items-center gap-1 shadow-2xs"
            >
              <span>⚙️</span>
              <span>Lưu mục khác {showOtherSaveMenu ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Primary Action Button: Hoàn tất chỉnh sửa & Áp dụng ảnh đĩa nhạc / avatar / icon */}
          <button
            onClick={handleFinishAndApply}
            disabled={isExporting || !imageSrc}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ff9ebb] via-[#ff8fab] to-[#e57390] hover:from-[#ff8fab] hover:to-[#d45d79] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 flex items-center gap-2 border-2 border-[#f888a7] disabled:opacity-50"
          >
            <span>✨</span>
            <span>
              {isVinylTarget ? 'Hoàn tất & Áp dụng ảnh đĩa than' : 'Hoàn tất chỉnh sửa & Áp dụng'}
            </span>
          </button>
        </div>

        {/* Optional Collapsible Dropdown for Other Save Targets */}
        {showOtherSaveMenu && (
          <div className="bg-[#fffff2] px-4 py-3 border-t border-[#ffc2d1] grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-bold animate-fadeIn flex-shrink-0">
            <button
              onClick={() => handleSaveToTarget('background')}
              className="p-1.5 rounded-lg bg-[#ffe0df]/40 hover:bg-[#ffe0df] border border-[#ffb3c6] cursor-pointer truncate"
            >
              🖼️ Làm Ảnh Nền
            </button>
            <button
              onClick={() => handleSaveToTarget('falling')}
              className="p-1.5 rounded-lg bg-[#ffe0df]/40 hover:bg-[#ffe0df] border border-[#ffb3c6] cursor-pointer truncate"
            >
              🌸 Làm Vật Thể Rơi
            </button>
            <button
              onClick={() => handleSaveToTarget('bunnies')}
              className="p-1.5 rounded-lg bg-[#ffe0df]/40 hover:bg-[#ffe0df] border border-[#ffb3c6] cursor-pointer truncate"
            >
              🐰 Làm Mascot Thỏ
            </button>
            <button
              onClick={() => handleSaveToTarget('sticker')}
              className="p-1.5 rounded-lg bg-[#ffe0df]/40 hover:bg-[#ffe0df] border border-[#ffb3c6] cursor-pointer truncate"
            >
              ⭐ Thêm vào Sticker
            </button>
            <button
              onClick={() => handleSaveToTarget('playlist_cover')}
              className="p-1.5 rounded-lg bg-[#ffe0df]/40 hover:bg-[#ffe0df] border border-[#ffb3c6] cursor-pointer truncate"
            >
              🎵 Ảnh bìa Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

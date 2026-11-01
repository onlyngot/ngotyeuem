import React, { useState, useEffect } from 'react';
import {
  getAllPalettes,
  getActivePaletteId,
  setActivePalette,
  saveCustomPalette,
  deleteCustomPalette,
  ColorPalette,
} from '@/src/data/paletteStorage';

interface PaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelected?: (palette: ColorPalette) => void;
}

export default function PaletteModal({ isOpen, onClose, onSelected }: PaletteModalProps) {
  const [palettes, setPalettes] = useState<ColorPalette[]>(getAllPalettes());
  const [activeId, setActiveId] = useState<string>(getActivePaletteId());
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Custom Palette Form State
  const [customName, setCustomName] = useState('My Custom Theme');
  const [customEmoji, setCustomEmoji] = useState('🎨');
  const [customDesc, setCustomDesc] = useState('Bảng màu do Admin tự tay phối');
  const [customColors, setCustomColors] = useState({
    primary: '#d45d79',
    secondary: '#8d2d48',
    accent: '#ff8fab',
    accentHover: '#e56b82',
    bg: '#ffdde7',
    cardBg: '#fffff2',
    lightBg: '#ffe0df',
    border: '#ffb3c6',
    borderLight: '#ffc2d1',
    shadow: 'rgba(255, 179, 198, 0.45)',
    bubbleFill: '#ffaac4',
    bubbleShadow: '#eb8ba6',
  });

  const refreshPalettes = () => {
    setPalettes(getAllPalettes());
    setActiveId(getActivePaletteId());
  };

  useEffect(() => {
    if (isOpen) {
      refreshPalettes();
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('yimeo_custom_palettes_updated', refreshPalettes);
    return () => window.removeEventListener('yimeo_custom_palettes_updated', refreshPalettes);
  }, []);

  if (!isOpen) return null;

  const handleSelect = (palette: ColorPalette) => {
    setActivePalette(palette.id);
    setActiveId(palette.id);
    if (onSelected) onSelected(palette);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom_${Date.now()}`;
    const newPalette: ColorPalette = {
      id,
      name: customName || 'Custom Palette',
      emoji: customEmoji || '✨',
      description: customDesc || 'Admin Custom Palette',
      isCustom: true,
      colors: {
        ...customColors,
        shadow: `rgba(255, 179, 198, 0.45)`,
      },
    };
    saveCustomPalette(newPalette);
    setActivePalette(id);
    setActiveId(id);
    setPalettes(getAllPalettes());
    setActiveTab('presets');
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa bảng màu tự tạo này?')) {
      deleteCustomPalette(id);
      refreshPalettes();
    }
  };

  // Helper to load colors from an existing palette into the custom editor
  const handleLoadToCustom = (p: ColorPalette) => {
    setCustomName(`${p.name} (Tùy Chỉnh)`);
    setCustomEmoji(p.emoji);
    setCustomDesc(`Dựa trên ${p.name}`);
    setCustomColors({ ...p.colors });
    setActiveTab('custom');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[var(--theme-card-bg,#fffff2)] rounded-3xl border-4 border-[var(--theme-border,#ffb3c6)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[var(--theme-secondary,#8d2d48)] animate-fadeIn"
      >
        {/* Retro Header Bar */}
        <div className="bg-[var(--theme-bg,#ffdde7)] px-4 py-3 flex items-center justify-between border-b-2 border-[var(--theme-border,#ffb3c6)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌈</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--theme-secondary,#8d2d48)]">
                Bảng Màu Chủ Đạo Website (Color Palette)
              </h2>
              <span className="text-[10px] text-[var(--theme-primary,#d45d79)] font-medium block">
                Thay đổi tông màu toàn bộ web hoặc tự do tạo palette của riêng bạn
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[var(--theme-border-light,#ffc2d1)] hover:opacity-80 text-[var(--theme-secondary,#7a1f38)] font-bold flex items-center justify-center text-sm transition border border-[var(--theme-border,#ffb3c6)] cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--theme-border,#ffb3c6)] bg-[var(--theme-light-bg,#ffe0df)]/60 p-1.5 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'presets'
                ? 'bg-white shadow-xs text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border,#ffb3c6)]'
                : 'text-[var(--theme-secondary,#8d2d48)]/80 hover:bg-white/50'
            }`}
          >
            🌸 Bảng màu có sẵn ({palettes.length} Tone)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer text-center ${
              activeTab === 'custom'
                ? 'bg-white shadow-xs text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border,#ffb3c6)]'
                : 'text-[var(--theme-secondary,#8d2d48)]/80 hover:bg-white/50'
            }`}
          >
            🎨 Tự phối màu riêng (Custom Palette)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'presets' ? (
            <>
              <div className="flex items-center justify-between gap-2 bg-[var(--theme-light-bg,#ffe0df)]/70 p-3 rounded-2xl border border-[var(--theme-border,#ffb3c6)] text-xs">
                <span>🎨 Nhấp vào bất kỳ tone màu nào để đổi giao diện tức thì:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className="px-2.5 py-1 rounded-full bg-[var(--theme-accent,#ff8fab)] text-white text-[11px] font-bold shadow-2xs hover:opacity-90 cursor-pointer shrink-0"
                >
                  + Tự phối mới
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {palettes.map((palette) => {
                  const isSelected = activeId === palette.id;
                  const { colors } = palette;

                  return (
                    <div
                      key={palette.id}
                      onClick={() => handleSelect(palette)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-[var(--theme-primary,#d45d79)] ring-3 ring-[var(--theme-accent,#ff8fab)]/40 shadow-md scale-[1.01] bg-white'
                          : 'border-[var(--theme-border,#ffb3c6)] hover:border-[var(--theme-accent,#ff8fab)] hover:shadow-xs bg-[var(--theme-card-bg,#fffff2)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{palette.emoji}</span>
                          <div>
                            <span className="font-extrabold text-sm block text-[var(--theme-secondary,#8d2d48)]">
                              {palette.name} {palette.isCustom && <span className="text-[10px] text-pink-500 font-normal">(Admin Custom)</span>}
                            </span>
                            <span className="text-[11px] text-gray-500 line-clamp-1">
                              {palette.description}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--theme-primary,#d45d79)] text-white shadow-2xs shrink-0">
                            Đang dùng ✓
                          </span>
                        )}
                      </div>

                      {/* Color Swatch Previews */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.bg }}
                          title={`Nền: ${colors.bg}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.cardBg }}
                          title={`Thẻ card: ${colors.cardBg}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.primary }}
                          title={`Tiêu đề: ${colors.primary}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.accent }}
                          title={`Nút bấm: ${colors.accent}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.border }}
                          title={`Viền: ${colors.border}`}
                        />
                        <div
                          className="w-5 h-5 rounded-full border border-black/10 shadow-inner"
                          style={{ backgroundColor: colors.bubbleFill }}
                          title={`Chữ Yimeo: ${colors.bubbleFill}`}
                        />
                      </div>

                      {/* Palette Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadToCustom(palette);
                          }}
                          className="text-[var(--theme-primary,#d45d79)] hover:underline cursor-pointer"
                        >
                          Chỉnh sửa phối màu ➔
                        </button>
                        {palette.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustom(e, palette.id)}
                            className="text-red-500 hover:underline cursor-pointer font-bold ml-2"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Custom Palette Editor */
            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div className="bg-[var(--theme-light-bg,#ffe0df)]/60 p-3 rounded-2xl border border-[var(--theme-border,#ffb3c6)] text-xs leading-relaxed">
                ✨ <strong>Tự tay mix bảng màu theo ý thích:</strong> Bạn có thể chọn từng mã màu chi tiết cho nền, chữ, viền, nút bấm và tên thương hiệu!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tên bảng màu của bạn</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                    placeholder="Ví dụ: Kẹo Bông Mơ Màng..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border,#ffb3c6)] bg-white text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Biểu tượng Emoji</label>
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    required
                    maxLength={4}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border,#ffb3c6)] bg-white text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Ví dụ: Tông pastel ngọt ngào ấm áp"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--theme-border,#ffb3c6)] bg-white text-xs font-medium"
                />
              </div>

              {/* Color Pickers Grid */}
              <div className="bg-white p-3 rounded-2xl border border-[var(--theme-border,#ffb3c6)]">
                <h3 className="text-xs font-black uppercase tracking-wider mb-2 text-[var(--theme-primary,#d45d79)]">
                  Bảng chọn từng màu chi tiết
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Nền toàn web</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.bg}
                        onChange={(e) => setCustomColors({ ...customColors, bg: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.bg}
                        onChange={(e) => setCustomColors({ ...customColors, bg: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Nền thẻ card / Navbar</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.cardBg}
                        onChange={(e) => setCustomColors({ ...customColors, cardBg: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.cardBg}
                        onChange={(e) => setCustomColors({ ...customColors, cardBg: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Tiêu đề nổi bật</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.primary}
                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chữ nội dung</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors({ ...customColors, secondary: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Nút bấm chính</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value, accentHover: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.accent}
                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value, accentHover: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Viền thẻ & Khung</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.border}
                        onChange={(e) => setCustomColors({ ...customColors, border: e.target.value, borderLight: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.border}
                        onChange={(e) => setCustomColors({ ...customColors, border: e.target.value, borderLight: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chữ "ngọt." (Ruột)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.bubbleFill}
                        onChange={(e) => setCustomColors({ ...customColors, bubbleFill: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.bubbleFill}
                        onChange={(e) => setCustomColors({ ...customColors, bubbleFill: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chữ "ngọt." (Bóng)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customColors.bubbleShadow}
                        onChange={(e) => setCustomColors({ ...customColors, bubbleShadow: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={customColors.bubbleShadow}
                        onChange={(e) => setCustomColors({ ...customColors, bubbleShadow: e.target.value })}
                        className="w-20 px-1.5 py-1 text-[11px] font-mono border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div
                className="p-4 rounded-2xl border-2 transition"
                style={{
                  backgroundColor: customColors.bg,
                  borderColor: customColors.border,
                  color: customColors.secondary,
                }}
              >
                <div
                  className="p-3 rounded-xl border shadow-xs flex items-center justify-between"
                  style={{
                    backgroundColor: customColors.cardBg,
                    borderColor: customColors.border,
                  }}
                >
                  <div>
                    <span className="font-extrabold text-sm block" style={{ color: customColors.primary }}>
                      Xem trước bảng màu tự phối
                    </span>
                    <span className="text-[11px]">Nội dung chữ hiển thị mượt mà</span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: customColors.accent }}
                  >
                    Nút bấm mẫu
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold hover:bg-gray-100 cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[var(--theme-accent,#ff8fab)] to-[var(--theme-accent-hover,#e56b82)] text-white text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer"
                >
                  💾 Lưu & Áp Dụng Palette Này
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[var(--theme-light-bg,#ffe0df)]/70 px-4 py-2.5 flex items-center justify-between border-t border-[var(--theme-border,#ffb3c6)] text-xs">
          <span className="text-[11px] text-[var(--theme-secondary,#8d2d48)]/80">
            Tone đang kích hoạt: <strong>{palettes.find((p) => p.id === activeId)?.name || 'Default'}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-gray-100 text-[var(--theme-secondary,#8d2d48)] font-bold text-xs border border-[var(--theme-border,#ffb3c6)] shadow-2xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

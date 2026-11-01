import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Character } from '@/src/types/character';
import FileUpload from '@/src/components/ui/FileUpload';
import { STRAWBERRY_LYCHEE_PALETTE } from '@/src/data/storage';

export const PALETTE_PRESETS = [
  { name: '🍓 Strawberry Lychee', colors: ['#ffdde7', '#fffff2', '#ffe0df', '#ffc2d1', '#ff9ebb', '#e57390'] },
  { name: '💜 Lavender Lilac', colors: ['#ebd4f5', '#fff7fd', '#e0c3fc', '#d0a9f5', '#b388eb', '#805ad5'] },
  { name: '🍑 Peach Sorbet', colors: ['#ffe5d9', '#fff9f5', '#ffd7ba', '#fec89a', '#f7a072', '#e07a5f'] },
  { name: '🩵 Minty Sky', colors: ['#d8f3dc', '#f8fff9', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788'] },
  { name: '🖤 Gothic Kuromi', colors: ['#e2d9f3', '#ffffff', '#c9b6e4', '#be95c4', '#9f86c0', '#5e5073'] },
];

interface EditCharacterModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Character) => void;
  onDelete?: (id: string) => void;
}

interface EditCharacterContentProps {
  character: Character;
  onClose: () => void;
  onSave: (updated: Character) => void;
  onDelete?: (id: string) => void;
}

function EditCharacterContent({
  character,
  onClose,
  onSave,
  onDelete,
}: EditCharacterContentProps) {
  const [name, setName] = useState(character.name || '');
  const [subheader, setSubheader] = useState(character.subheader || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(character.avatarUrl || null);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(character.mainImageUrl || null);
  const [fandom, setFandom] = useState(character.fandom || '');
  const [platform, setPlatform] = useState(character.platform || '');
  const [characterLink, setCharacterLink] = useState(character.characterLink || '');
  const [description, setDescription] = useState(character.description || '');
  const [tags, setTags] = useState(character.tags?.join(', ') || '');
  const [notes, setNotes] = useState(character.notes || '');
  const [category, setCategory] = useState(character.category || '');
  const [paletteInput, setPaletteInput] = useState(
    character.palette?.join(', ') || STRAWBERRY_LYCHEE_PALETTE.join(', ')
  );
  const [musicUrl, setMusicUrl] = useState(character.musicUrl || '');
  const [musicTitle, setMusicTitle] = useState(character.musicTitle || '');
  const [vinylCoverUrl, setVinylCoverUrl] = useState<string | null>(character.vinylCoverUrl || null);
  const [vinylZoom, setVinylZoom] = useState(character.vinylZoom || 1);
  const [vinylPanX, setVinylPanX] = useState(character.vinylPanX || 0);
  const [vinylPanY, setVinylPanY] = useState(character.vinylPanY || 0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const vinylImgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(character.name || '');
    setSubheader(character.subheader || '');
    setAvatarUrl(character.avatarUrl || null);
    setMainImageUrl(character.mainImageUrl || null);
    setFandom(character.fandom || '');
    setPlatform(character.platform || '');
    setCharacterLink(character.characterLink || '');
    setDescription(character.description || '');
    setTags(character.tags?.join(', ') || '');
    setNotes(character.notes || '');
    setCategory(character.category || '');
    setPaletteInput(
      character.palette?.join(', ') || STRAWBERRY_LYCHEE_PALETTE.join(', ')
    );
    setMusicUrl(character.musicUrl || '');
    setMusicTitle(character.musicTitle || '');
    setVinylCoverUrl(character.vinylCoverUrl || null);
    setVinylZoom(character.vinylZoom || 1);
    setVinylPanX(character.vinylPanX || 0);
    setVinylPanY(character.vinylPanY || 0);
    setIsConfirmingDelete(false);
  }, [character]);

  const handleAudioFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setMusicUrl(dataUrl);
      if (!musicTitle) {
        setMusicTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
    if (audioFileInputRef.current) audioFileInputRef.current.value = '';
  };

  const handleVinylImgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setVinylCoverUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    if (vinylImgFileInputRef.current) vinylImgFileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPalette = paletteInput
      .split(',')
      .map(c => c.trim())
      .filter(c => /^#[0-9a-fA-F]{6}$/.test(c));

    const updated: Character = {
      ...character,
      name,
      subheader,
      avatarUrl: avatarUrl || null,
      mainImageUrl: mainImageUrl || null,
      fandom,
      platform,
      characterLink,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      notes,
      category,
      palette: parsedPalette.length >= 6 ? parsedPalette.slice(0, 6) : character.palette || STRAWBERRY_LYCHEE_PALETTE,
      musicUrl: musicUrl.trim() || null,
      musicTitle: musicTitle.trim() || null,
      vinylCoverUrl: vinylCoverUrl || null,
      vinylZoom,
      vinylPanX,
      vinylPanY,
    };

    onSave(updated);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[92vh] bg-[#fffff2] rounded-[32px] border-[3.5px] border-[#ffb3c6] shadow-[0_25px_60px_rgba(255,179,198,0.5)] overflow-hidden my-auto flex flex-col text-[#8d2d48]"
      >
        {/* Fixed Title Bar */}
        <div className="bg-[#ffdde7] px-4 py-3 flex items-center justify-between border-b-2 border-[#ffb3c6] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">✏️</span>
            <span className="text-xs sm:text-sm font-black text-[#8d2d48] uppercase tracking-wider">
              Chỉnh sửa thông tin Character (Admin)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#ffc2d1] hover:bg-[#ff9ebb] text-[#7a1f38] font-bold flex items-center justify-center text-sm transition cursor-pointer border border-[#ffb3c6]"
            title="Đóng"
          >
            ×
          </button>
        </div>

        {/* Scrollable Form Body with contained overflow */}
        <form
          id="edit-character-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 flex flex-col gap-4 text-xs"
        >
          {/* Note regarding the 2 separate images */}
          <div className="bg-[#ffe0df]/70 border-2 border-[#ffb3c6] p-3 rounded-2xl text-[11px] text-[#8d2d48]">
            <span className="font-extrabold block mb-0.5">💡 Cài đặt 2 ảnh độc lập (Avatar & Artwork):</span>
            <span>• <b>Ảnh 1 (Avatar tròn)</b>: Hiển thị ở vòng tròn góc trên bên trái hồ sơ.</span><br />
            <span>• <b>Ảnh 2 (Tranh artwork)</b>: Hiển thị trong khung hình lớn bên dưới.</span>
          </div>

          {/* Two distinct image uploaders: 1. Avatar icon, 2. Main artwork */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-[#ffdde7]/50 rounded-2xl border-2 border-[#ffb3c6]">
            <div className="flex flex-col gap-1">
              <span className="font-black text-[#8d2d48] text-xs">
                🟣 1. Ảnh Avatar tròn (Icon trên)
              </span>
              <FileUpload
                currentImageUrl={avatarUrl}
                shape="circle"
                onImageChange={(url) => setAvatarUrl(url)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-black text-[#8d2d48] text-xs">
                🖼️ 2. Tranh / Artwork chính (Khung dưới)
              </span>
              <FileUpload
                currentImageUrl={mainImageUrl}
                shape="rect"
                onImageChange={(url) => setMainImageUrl(url)}
              />
            </div>
          </div>

          {/* Section: Nhạc riêng cho profile & Đĩa than xoay (Đặt ở vị trí rõ ràng, không bao giờ bị đè hay lòi ra ngoài) */}
          <div className="p-3.5 bg-[#ffdde7]/60 rounded-2xl border-2 border-[#ffb3c6] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#8d2d48] text-xs flex items-center gap-1.5">
                <span>🎵</span>
                <span>Nhạc riêng Profile & Đĩa Than (Vinyl Record)</span>
              </span>
              <span className="text-[10px] text-[#b33959] font-medium">
                Góc dưới bên phải profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#8d2d48] block mb-1">
                  Link nhạc (Spotify / YouTube / MP3 / TikTok / CapCut):
                </label>
                <input
                  type="text"
                  placeholder="Dán link Spotify, YouTube, MP3..."
                  value={musicUrl}
                  onChange={e => setMusicUrl(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#8d2d48] block mb-1">Tên bài hát / Giai điệu:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Strawberry Sweet - Artist ♫"
                  value={musicTitle}
                  onChange={e => setMusicTitle(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
                />
              </div>
            </div>

            {/* Upload audio directly from phone/computer */}
            <div className="pt-1">
              <input
                type="file"
                ref={audioFileInputRef}
                onChange={handleAudioFileUpload}
                accept="audio/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] font-bold text-xs border border-[#ffb3c6] cursor-pointer transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <span>📂</span>
                <span>Hoặc tải file nhạc từ điện thoại / máy tính (MP3, WAV, M4A)</span>
              </button>
            </div>

            {/* Vinyl cover image selection & adjustment */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#ffc2d1]/80">
              <div className="w-12 h-12 rounded-full border-2 border-[#ff8fab] bg-black overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-xs">
                {vinylCoverUrl || avatarUrl || mainImageUrl ? (
                  <img
                    src={(vinylCoverUrl || avatarUrl || mainImageUrl) as string}
                    alt="Vinyl cover"
                    style={{
                      transform: `scale(${vinylZoom}) translate(${vinylPanX}px, ${vinylPanY}px)`,
                    }}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white text-xs">💿</span>
                )}
              </div>
              <div className="flex-1 text-xs">
                <span className="font-bold text-[#8d2d48] block text-[11px]">Ảnh tâm đĩa than (Vinyl Disc):</span>
                <span className="text-[10px] text-[#b33959] block mb-1">
                  {vinylCoverUrl ? 'Đang dùng ảnh bìa tùy chỉnh' : 'Mặc định dùng Avatar hoặc Tranh của nhân vật'}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="file"
                    ref={vinylImgFileInputRef}
                    onChange={handleVinylImgUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => vinylImgFileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-full bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] text-[10px] font-bold border border-[#ffb3c6] cursor-pointer transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>📁</span>
                    <span>Tải ảnh đĩa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('caomei_open_image_editor', {
                          detail: {
                            initialImage: vinylCoverUrl || avatarUrl || mainImageUrl || null,
                            targetTitle: `Chỉnh sửa Ảnh Đĩa Than: ${name}`,
                            targetType: 'icon',
                            onSaved: (baked: string) => {
                              setVinylCoverUrl(baked);
                            },
                          },
                        })
                      );
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#ff9ebb] hover:bg-[#ff8fab] text-white text-[10px] font-bold cursor-pointer transition shadow-2xs flex items-center gap-1"
                  >
                    <span>✂️</span>
                    <span>Căn chỉnh ảnh đĩa</span>
                  </button>

                  {vinylCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setVinylCoverUrl(null)}
                      className="text-[10px] text-red-500 hover:underline cursor-pointer ml-1"
                    >
                      Dùng mặc định
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name & Subheader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8d2d48] block mb-1">Tên Character (Title) *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#8d2d48] block mb-1">Subheader (welcome! ...)</label>
              <input
                type="text"
                value={subheader}
                placeholder="subheader here!"
                onChange={e => setSubheader(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#8d2d48] block mb-1">About / Giới thiệu *</label>
              <input
                type="text"
                value={fandom}
                onChange={e => setFandom(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#8d2d48] block mb-1">Platform / Nền tảng</label>
              <input
                type="text"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">URL Liên kết Character *</label>
            <input
              type="url"
              value={characterLink}
              onChange={e => setCharacterLink(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">Tiểu sử & Mô tả (Bio / Story)</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
            />
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">Tags (cách nhau bởi dấu phẩy)</label>
            <input
              type="text"
              value={tags}
              placeholder="about, interests, byi/dni"
              onChange={e => setTags(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
            />
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">Ghi chú (please note !)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
            />
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">Phân loại (Category)</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
            />
          </div>

          <div>
            <label className="font-bold text-[#8d2d48] block mb-1">Bảng 6 màu Hex (Color Palette)</label>
            <input
              type="text"
              value={paletteInput}
              onChange={e => setPaletteInput(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb] font-mono text-[11px]"
            />
            {/* Live swatches preview */}
            <div className="flex items-center gap-1.5 mt-2">
              {paletteInput.split(',').map(c => c.trim()).filter(c => /^#[0-9a-fA-F]{3,8}$/.test(c)).slice(0, 6).map((col, idx) => (
                <span
                  key={idx}
                  className="w-6 h-6 rounded-lg border-2 border-[#ffb3c6] shadow-2xs inline-block"
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1 mt-2">
              {PALETTE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPaletteInput(p.colors.join(', '))}
                  className="px-2 py-0.5 rounded-full bg-[#ffdde7] hover:bg-[#ffc2d1] text-[10px] font-bold text-[#8d2d48] border border-[#ffb3c6] transition cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Fixed Action buttons footer */}
        <div className="flex items-center justify-between p-3.5 bg-[#ffdde7]/40 border-t-2 border-[#ffb3c6] flex-shrink-0">
          {onDelete ? (
            isConfirmingDelete ? (
              <div className="flex items-center gap-2 p-1 bg-red-50 rounded-xl border border-red-200 animate-fadeIn">
                <span className="text-xs text-red-600 font-bold px-1">Xác nhận xóa?</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onDelete) onDelete(character.id);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition cursor-pointer"
                >
                  ✓ Xóa ngay
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-2 py-1 rounded-lg bg-white text-gray-700 text-xs font-bold border border-gray-300 transition cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition cursor-pointer flex items-center gap-1"
              >
                <span>🗑️</span>
                <span>Xóa nhân vật</span>
              </button>
            )
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#fffff2] hover:bg-[#ffe0df] text-[#8d2d48] font-bold border-2 border-[#ffb3c6] transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-character-form"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white font-bold border-2 border-[#f888a7] shadow-md transition cursor-pointer active:scale-95"
            >
              💾 Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EditCharacterModal({
  character,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditCharacterModalProps) {
  if (!isOpen || !character || typeof document === 'undefined') return null;

  return (
    <EditCharacterContent
      character={character}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

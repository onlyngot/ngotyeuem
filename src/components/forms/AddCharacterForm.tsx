import { useState, useRef, ChangeEvent } from 'react';
import { Character } from '@/src/types/character';
import FileUpload from '@/src/components/ui/FileUpload';
import { STRAWBERRY_LYCHEE_PALETTE } from '@/src/data/storage';
import { PALETTE_PRESETS } from '@/src/components/character/EditCharacterModal';

interface AddCharacterFormProps {
  onAdd: (character: Omit<Character, 'id' | 'createdAt'>) => void;
}

export default function AddCharacterForm({ onAdd }: AddCharacterFormProps) {
  const [name, setName] = useState('');
  const [subheader, setSubheader] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [mainImageBase64, setMainImageBase64] = useState<string | null>(null);
  const [fandom, setFandom] = useState('');
  const [platform, setPlatform] = useState('');
  const [characterLink, setCharacterLink] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [paletteInput, setPaletteInput] = useState(STRAWBERRY_LYCHEE_PALETTE.join(', '));
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [vinylCoverUrl, setVinylCoverUrl] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const vinylImgFileInputRef = useRef<HTMLInputElement>(null);

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
      .filter(c => /^#[0-9a-fA-F]{3,8}$/.test(c));

    onAdd({
      name,
      subheader: subheader || undefined,
      avatarUrl: avatarBase64 || null,
      mainImageUrl: mainImageBase64 || null,
      fandom,
      platform: platform || 'Carrd',
      characterLink,
      description,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      notes,
      category: category || 'Original',
      isFavorite: false,
      likes: 0,
      palette: parsedPalette.length >= 6 ? parsedPalette.slice(0, 6) : STRAWBERRY_LYCHEE_PALETTE,
      selectedColorIndex: 3,
      musicUrl: musicUrl.trim() || null,
      musicTitle: musicTitle.trim() || null,
      vinylCoverUrl: vinylCoverUrl || null,
    });

    // Reset form
    setName('');
    setSubheader('');
    setAvatarBase64(null);
    setMainImageBase64(null);
    setFandom('');
    setPlatform('');
    setCharacterLink('');
    setDescription('');
    setTags('');
    setNotes('');
    setMusicUrl('');
    setMusicTitle('');
    setVinylCoverUrl(null);
    setCategory('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#fffff2] p-5 sm:p-7 rounded-[32px] border-[3.5px] border-[#ffb3c6] shadow-[0_20px_50px_rgba(255,179,198,0.35)] flex flex-col gap-4 text-xs sm:text-sm text-[#8d2d48]">
      <div className="flex items-center justify-between border-b-2 border-[#ffb3c6] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="text-xl sm:text-2xl font-black text-[#8d2d48]">Thêm Character Mới</h2>
        </div>
        <span className="text-xs text-[#8d2d48] font-bold bg-[#ffdde7] px-3 py-1 rounded-full border border-[#ffb3c6]">
          Profile Carrd
        </span>
      </div>

      {/* Guide box for 2 separate images */}
      <div className="bg-[#ffe0df]/70 border-2 border-[#ffb3c6] p-3 rounded-2xl text-[11px] text-[#8d2d48]">
        <span className="font-extrabold block mb-0.5">💡 Cài đặt 2 ảnh độc lập (Avatar & Artwork):</span>
        <span>• <b>Ảnh 1 (Avatar tròn)</b>: Hiển thị ở vòng tròn góc trên bên trái hồ sơ.</span><br />
        <span>• <b>Ảnh 2 (Tranh artwork)</b>: Hiển thị trong khung hình lớn bên dưới.</span>
      </div>
      
      {/* 2 separate image uploaders: Avatar vs Main artwork */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-[#ffdde7]/50 rounded-2xl border-2 border-[#ffb3c6]">
        <div className="flex flex-col gap-1">
          <span className="font-black text-[#8d2d48] text-xs">
            🟣 1. Ảnh Avatar tròn (Icon trên)
          </span>
          <FileUpload 
            currentImageUrl={avatarBase64}
            shape="circle"
            onImageChange={(url) => setAvatarBase64(url)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-black text-[#8d2d48] text-xs">
            🖼️ 2. Tranh / Artwork chính (Khung dưới)
          </span>
          <FileUpload 
            currentImageUrl={mainImageBase64}
            shape="rect"
            onImageChange={(url) => setMainImageBase64(url)}
          />
        </div>
      </div>

      {/* Section: Nhạc riêng cho profile & Đĩa than xoay (Vinyl Music) */}
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
        <div>
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
            {vinylCoverUrl || avatarBase64 || mainImageBase64 ? (
              <img
                src={(vinylCoverUrl || avatarBase64 || mainImageBase64) as string}
                alt="Vinyl cover"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-white text-xs">💿</span>
            )}
          </div>
          <div className="flex-1 text-xs">
            <span className="font-bold text-[#8d2d48] block text-[11px]">Ảnh tâm đĩa than (Vinyl Disc):</span>
            <span className="text-[10px] text-[#b33959] block mb-1">
              {vinylCoverUrl ? 'Đang dùng ảnh đĩa than tùy chọn' : 'Mặc định dùng Avatar hoặc Tranh của nhân vật'}
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
                        initialImage: vinylCoverUrl || avatarBase64 || mainImageBase64 || null,
                        targetTitle: `Chỉnh sửa Ảnh Đĩa Than: ${name || 'Nhân vật mới'}`,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-[#8d2d48] block mb-1">Tên Character (Title) *</label>
          <input
            type="text"
            required
            placeholder="Tên nhân vật, OC, Mascot..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
          />
        </div>

        <div>
          <label className="font-bold text-[#8d2d48] block mb-1">Subheader (welcome! ...)</label>
          <input
            type="text"
            placeholder="subheader here! (tùy chọn)"
            value={subheader}
            onChange={e => setSubheader(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-[#8d2d48] block mb-1">About / Giới thiệu *</label>
          <input
            type="text"
            required
            placeholder="Gốc, fandom, thể loại..."
            value={fandom}
            onChange={e => setFandom(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
          />
        </div>

        <div>
          <label className="font-bold text-[#8d2d48] block mb-1">Platform / Nền tảng</label>
          <input
            type="text"
            placeholder="Carrd, Toyhouse, Notion, Linktree..."
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
          required
          placeholder="https://..."
          value={characterLink}
          onChange={e => setCharacterLink(e.target.value)}
          className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
        />
      </div>

      <div>
        <label className="font-bold text-[#8d2d48] block mb-1">Tiểu sử & Mô tả (Bio / Story)</label>
        <textarea
          rows={3}
          placeholder="Giới thiệu đôi nét, tính cách, đặc điểm của nhân vật..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
        />
      </div>

      <div>
        <label className="font-bold text-[#8d2d48] block mb-1">Tags (cách nhau bởi dấu phẩy)</label>
        <input
          type="text"
          placeholder="about, interests, byi/dni, cute"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
        />
      </div>

      <div>
        <label className="font-bold text-[#8d2d48] block mb-1">Ghi chú (please note !)</label>
        <textarea
          rows={2}
          placeholder="Quy tắc, ghi chú đặc biệt..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb]"
        />
      </div>

      <div>
        <label className="font-bold text-[#8d2d48] block mb-1">Phân loại (Category)</label>
        <input
          type="text"
          placeholder="Original, Mascot, OC, Fanart..."
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
          placeholder="#ffdde7, #fffff2, #ffe0df, #ffc2d1, #ff9ebb, #e57390"
          className="w-full p-2.5 rounded-xl border-2 border-[#ffc2d1] bg-[#fffff2] text-[#8d2d48] focus:outline-[#ff9ebb] font-mono text-[11px]"
        />
        {/* Live preview swatches */}
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
      
      <button
        type="submit"
        className="mt-2 bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white py-3.5 rounded-2xl font-black shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer text-sm border-2 border-[#f888a7]"
      >
        ✨ Tạo Character & Xem Profile Ngay
      </button>
    </form>
  );
}

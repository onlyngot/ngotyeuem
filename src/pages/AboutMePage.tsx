import React, { useState, useEffect } from 'react';
import { getSiteAvatarArt, getBunniesArt } from '@/src/data/artStorage';
import { isAdminUser } from '@/src/data/authRoleStorage';
import CustomIcon from '@/src/components/ui/CustomIcon';

export interface AboutMeData {
  nickname: string;
  pronouns: string;
  status: string;
  bio: string;
  mbti: string;
  birthday: string;
  likes: string[];
  dislikes: string[];
  fandoms: string[];
  socialLinks: Array<{ label: string; url: string; icon: string }>;
}

const ABOUT_ME_KEY = 'yimeo_about_me_data';

export const DEFAULT_ABOUT_ME: AboutMeData = {
  nickname: 'Yimeo ♡',
  pronouns: 'she/her',
  status: 'Đang mộng mơ giữa cánh đồng dâu tây và hoa oải hương... 🍓💜',
  bio: 'Chào mừng cậu đã ghé thăm góc nhỏ bình yên của mình! Đây là nơi mình lưu giữ những nhân vật, câu chuyện tình yêu ngọt ngào, những giai điệu lofi êm dịu và những gam màu pastel yêu thích nhất. Cứ tự nhiên dạo chơi nhé!',
  mbti: 'INFP 🌸',
  birthday: '12 / 04 🎂',
  likes: ['Trà sữa kem cheese', 'Nhạc Lofi / Piano', 'Gấu dâu & Thỏ bông', 'Vẽ tranh', 'Gam màu pastel'],
  dislikes: ['Sự ồn ào vội vã', 'Thời tiết nồm ẩm', 'Những điều tiêu cực'],
  fandoms: ['Original Characters (OC)', 'Genshin Impact', 'Sanrio & Chiikawa', 'Anime / Webcore'],
  socialLinks: [
    { label: 'Facebook', url: 'https://facebook.com', icon: '🌐' },
    { label: 'Instagram', url: 'https://instagram.com', icon: '📷' },
  ],
};

export function getAboutMeData(): AboutMeData {
  if (typeof localStorage === 'undefined') return DEFAULT_ABOUT_ME;
  const raw = localStorage.getItem(ABOUT_ME_KEY);
  if (!raw) return DEFAULT_ABOUT_ME;
  try {
    const parsed = { ...DEFAULT_ABOUT_ME, ...JSON.parse(raw) };
    if (parsed.socialLinks) {
      parsed.socialLinks = parsed.socialLinks.filter(
        (l: any) => l.label !== 'Carrd / Portfolio' && !l.label.toLowerCase().includes('carrd')
      );
    }
    return parsed;
  } catch {
    return DEFAULT_ABOUT_ME;
  }
}

export function saveAboutMeData(data: AboutMeData): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ABOUT_ME_KEY, JSON.stringify(data));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_about_me_updated', { detail: data }));
  }
}

export default function AboutMePage() {
  const isAdmin = isAdminUser();
  const [data, setData] = useState<AboutMeData>(getAboutMeData());
  const [avatar, setAvatar] = useState<string | null>(getSiteAvatarArt() || getBunniesArt());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AboutMeData>(getAboutMeData());
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [newFandom, setNewFandom] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setData(getAboutMeData());
      setAvatar(getSiteAvatarArt() || getBunniesArt());
    };
    window.addEventListener('yimeo_about_me_updated', handleUpdate);
    window.addEventListener('yimeo_avatar_updated', handleUpdate);
    return () => {
      window.removeEventListener('yimeo_about_me_updated', handleUpdate);
      window.removeEventListener('yimeo_avatar_updated', handleUpdate);
    };
  }, []);

  const handleStartEdit = () => {
    if (!isAdmin) return;
    setFormData({ ...data });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    saveAboutMeData(formData);
    setData(formData);
    setIsEditing(false);
  };

  const handleResetDefault = () => {
    if (!isAdmin) return;
    if (confirm('Đặt lại toàn bộ thông tin About Me về mặc định?')) {
      saveAboutMeData(DEFAULT_ABOUT_ME);
      setData(DEFAULT_ABOUT_ME);
      setFormData(DEFAULT_ABOUT_ME);
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-6 px-1 sm:px-4 text-[var(--theme-secondary,#8d2d48)] select-none">
      {/* Decorative Badge */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--theme-bg,#ffdde7)] text-xs sm:text-sm font-bold border border-[var(--theme-border,#ffb3c6)] shadow-xs">
          <span>🎀</span>
          <span>About Me • Góc Nhỏ Của Admin</span>
          <span>✨</span>
        </div>

        {/* Nút chỉnh sửa hồ sơ chỉ dành riêng cho Admin (Chủ khu tự trị), ẩn hoàn toàn với người xem */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[var(--theme-accent,#ff8fab)] to-[var(--theme-accent-hover,#e56b82)] hover:opacity-90 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>✏️</span>
            <span>Chỉnh sửa hồ sơ</span>
          </button>
        )}
      </div>

      {/* Main Profile Card Container */}
      <div className="bg-[var(--theme-card-bg,#fffff2)]/95 border-3 border-[var(--theme-border,#ffb3c6)] rounded-3xl p-5 sm:p-8 shadow-[0_12px_28px_rgba(255,194,209,0.35)] relative overflow-hidden">
        {/* Soft Background Radial Aura */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle, var(--theme-border-glow, rgba(255,194,209,0.6)) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        {/* Profile Header Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 pb-6 border-b border-[var(--theme-border-light,#ffc2d1)]/70 relative z-10">
          {/* Avatar with Cute Border */}
          <div className="relative group shrink-0">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 shadow-md flex items-center justify-center overflow-hidden p-1 bg-white"
              style={{ borderColor: 'var(--theme-border,#ffb3c6)' }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-4xl">🌸</span>
              )}
            </div>
            <span
              className="absolute bottom-1 right-1 w-7 h-7 rounded-full text-white text-xs flex items-center justify-center border-2 border-white shadow-xs"
              style={{ backgroundColor: 'var(--theme-accent,#ff8fab)' }}
            >
              💖
            </span>
          </div>

          {/* Identity & Status */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--theme-primary,#d45d79)] font-cute tracking-wide">
                {data.nickname}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--theme-light-bg,#ffe0df)] text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border,#ffb3c6)]">
                {data.pronouns}
              </span>
            </div>

            {/* Status Quote */}
            <div className="inline-block px-3 py-1.5 rounded-2xl bg-[var(--theme-bg,#ffdde7)]/70 border border-[var(--theme-border,#ffb3c6)] text-xs sm:text-sm font-medium italic text-[var(--theme-secondary,#8d2d48)]">
              "{data.status}"
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs font-bold text-[var(--theme-secondary,#8d2d48)]">
              <span className="px-2.5 py-1 rounded-xl bg-white/80 border border-[var(--theme-border-light,#ffc2d1)] shadow-2xs">
                ⭐ MBTI: {data.mbti}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/80 border border-[var(--theme-border-light,#ffc2d1)] shadow-2xs">
                🎂 Sinh nhật: {data.birthday}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="py-5 border-b border-[var(--theme-border-light,#ffc2d1)]/70 relative z-10 space-y-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--theme-primary,#d45d79)] flex items-center gap-1.5">
            <span>💌</span> Giới thiệu về mình
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--theme-secondary,#8d2d48)]/95 font-medium whitespace-pre-line bg-[var(--theme-light-bg,#ffe0df)]/40 p-4 rounded-2xl border border-[var(--theme-border-light,#ffc2d1)]/60">
            {data.bio}
          </p>
        </div>

        {/* Grid: Likes vs Dislikes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-[var(--theme-border-light,#ffc2d1)]/70 relative z-10 text-xs">
          {/* Likes */}
          <div className="p-4 rounded-2xl bg-[var(--theme-bg,#ffdde7)]/40 border border-[var(--theme-border,#ffb3c6)] space-y-2.5">
            <h3 className="font-bold text-[var(--theme-primary,#d45d79)] flex items-center gap-1.5 text-xs sm:text-sm">
              <span>🍓</span> Sở thích & Yêu mến
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.likes.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-white text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border-light,#ffc2d1)] font-semibold shadow-2xs"
                >
                  ♡ {item}
                </span>
              ))}
            </div>
          </div>

          {/* Dislikes */}
          <div className="p-4 rounded-2xl bg-[var(--theme-light-bg,#ffe0df)]/40 border border-[var(--theme-border,#ffb3c6)] space-y-2.5">
            <h3 className="font-bold text-[var(--theme-primary,#d45d79)] flex items-center gap-1.5 text-xs sm:text-sm">
              <span>☁️</span> Những điều không thích
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {data.dislikes.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-white text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border-light,#ffc2d1)] font-semibold shadow-2xs"
                >
                  ✕ {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Fandoms / Categories */}
        <div className="py-5 border-b border-[var(--theme-border-light,#ffc2d1)]/70 relative z-10 space-y-2.5">
          <h2 className="text-sm font-black uppercase tracking-wider text-[var(--theme-primary,#d45d79)] flex items-center gap-1.5">
            <span>🎨</span> Fandom & Niềm Đam Mê
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.fandoms.map((f, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-[var(--theme-bg,#ffdde7)] text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border,#ffb3c6)] text-xs font-bold"
              >
                ⌗ {f}
              </span>
            ))}
          </div>
        </div>

        {/* Social Links Footer */}
        <div className="pt-5 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--theme-secondary,#8d2d48)]/80">Kết nối cùng mình:</span>
            <div className="flex flex-wrap gap-2">
              {data.socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-full bg-white hover:bg-[var(--theme-bg,#ffdde7)] text-[var(--theme-secondary,#8d2d48)] border border-[var(--theme-border,#ffb3c6)] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>

          <span className="text-[11px] font-cute text-[var(--theme-primary,#d45d79)] font-bold">
            sweet thoughts & memories ♡
          </span>
        </div>
      </div>

      {/* Admin Edit Modal */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-3xl border-4 border-[var(--theme-border,#ffb3c6)] shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-4 text-xs font-bold animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-sm font-black text-[var(--theme-primary,#d45d79)] flex items-center gap-1.5">
                <span>✏️</span> Chỉnh Sửa Hồ Sơ About Me
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700">Tên / Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">Pronouns</label>
                  <input
                    type="text"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Trạng thái / Mood hiện tại</label>
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700">Đôi dòng giới thiệu (Bio)</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700">MBTI</label>
                  <input
                    type="text"
                    value={formData.mbti}
                    onChange={(e) => setFormData({ ...formData, mbti: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">Sinh nhật</label>
                  <input
                    type="text"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Edit Likes */}
              <div>
                <label className="block mb-1 text-gray-700">Sở thích (Likes)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.likes.map((like, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[11px] flex items-center gap-1"
                    >
                      {like}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, likes: formData.likes.filter((_, idx) => idx !== i) })}
                        className="text-red-500 font-black cursor-pointer hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLike}
                    onChange={(e) => setNewLike(e.target.value)}
                    placeholder="Thêm sở thích mới..."
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLike.trim()) {
                        setFormData({ ...formData, likes: [...formData.likes, newLike.trim()] });
                        setNewLike('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-pink-500 text-white font-bold cursor-pointer hover:bg-pink-600"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Edit Fandoms */}
              <div>
                <label className="block mb-1 text-gray-700">Fandoms / Thể loại</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.fandoms.map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] flex items-center gap-1"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fandoms: formData.fandoms.filter((_, idx) => idx !== i) })}
                        className="text-red-500 font-black cursor-pointer hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFandom}
                    onChange={(e) => setNewFandom(e.target.value)}
                    placeholder="Thêm fandom..."
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFandom.trim()) {
                        setFormData({ ...formData, fandoms: [...formData.fandoms, newFandom.trim()] });
                        setNewFandom('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 text-white font-bold cursor-pointer hover:bg-purple-600"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-xs text-gray-500 hover:text-red-600 cursor-pointer underline"
                >
                  Đặt lại mặc định
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[var(--theme-accent,#ff8fab)] text-white font-bold hover:opacity-90 cursor-pointer shadow-xs"
                  >
                    💾 Lưu hồ sơ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import LoadingIntro from '@/src/components/ui/LoadingIntro';
import RoleSelectionModal from '@/src/components/ui/RoleSelectionModal';
import ArtSettingsModal from '@/src/components/ui/ArtSettingsModal';
import PaletteModal from '@/src/components/ui/PaletteModal';
import ThemeBackupModal from '@/src/components/ui/ThemeBackupModal';
import ImageEditorModal, { ImageEditorModalProps } from '@/src/components/ui/ImageEditorModal';
import LoadingSettingsModal from '@/src/components/ui/LoadingSettingsModal';
import UserThemeModal from '@/src/components/ui/UserThemeModal';
import FallingEffect from '@/src/components/ui/FallingEffect';
import ClickBurstEffect from '@/src/components/ui/ClickBurstEffect';
import LobbyMusicPlayer from '@/src/components/ui/LobbyMusicPlayer';
import {
  getBunniesArt,
  getBackgroundArt,
  applyBackground,
  getSiteAvatarArt,
  setSiteAvatarArt,
  removeSiteAvatarArt,
  compressImage,
} from '@/src/data/artStorage';
import { applyColorPalette } from '@/src/data/paletteStorage';
import {
  getUserRole,
  setUserRole,
  clearUserRole,
  UserRole,
} from '@/src/data/authRoleStorage';
import { initAutomatedSync } from '@/src/utils/syncManager';

export default function Layout() {
  const navigate = useNavigate();
  // Role State: 'admin' (chủ khu tự trị) or 'viewer' (người xem)
  const [userRole, setUserRoleState] = useState<UserRole | null>(getUserRole());
  const [showRoleModal, setShowRoleModal] = useState<boolean>(() => getUserRole() === null);

  // Welcome Intro Screen state: Shown right after role selection or on session start
  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [introKey, setIntroKey] = useState(0);

  const [showArtModal, setShowArtModal] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showLoadingSettingsModal, setShowLoadingSettingsModal] = useState(false);
  const [showUserThemeModal, setShowUserThemeModal] = useState(false);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [imageEditorOptions, setImageEditorOptions] = useState<Partial<ImageEditorModalProps>>({});
  const [bunniesMascot, setBunniesMascot] = useState<string | null>(getBunniesArt());
  const [siteAvatar, setSiteAvatar] = useState<string | null>(getSiteAvatarArt());
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Anti-Theft & Content Protection: block context menu, drag, and print/save shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('');
        } catch {}
        return false;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P' || e.key === 'u' || e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Automated Cross-Device Interface Synchronization:
  // Tự động tải giao diện mới nhất của Admin trên mọi thiết bị và lắng nghe các thay đổi
  useEffect(() => {
    const cleanupSync = initAutomatedSync();
    return () => {
      cleanupSync();
    };
  }, []);

  // Logout handler: Clears role, navigates home, and re-opens the 2-choice Role Selection Screen
  const handleLogout = () => {
    clearUserRole();
    setUserRoleState(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('caomei_intro_shown');
    }
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIntroKey((prev) => prev + 1);
    setShowIntro(false);
    setShowRoleModal(true);
  };

  const handleRoleSelected = (role: UserRole) => {
    setUserRoleState(role);
    setShowRoleModal(false);
    // After picking role, show the welcome screen
    setShowIntro(true);
  };

  // Apply custom background & palette on mount and update
  useEffect(() => {
    applyColorPalette();
    applyBackground(getBackgroundArt());

    // Listen to custom event to open image editor from anywhere
    const handleOpenEditor = (e: any) => {
      if (e.detail) {
        setImageEditorOptions(e.detail);
      }
      setShowImageEditorModal(true);
    };

    const handleAvatarUpdate = () => {
      setSiteAvatar(getSiteAvatarArt());
    };

    const handleRoleChange = () => {
      setUserRoleState(getUserRole());
    };

    window.addEventListener('caomei_open_image_editor', handleOpenEditor);
    window.addEventListener('yimeo_avatar_updated', handleAvatarUpdate);
    window.addEventListener('yimeo_snapshot_applied', refreshArt);
    window.addEventListener('yimeo_ui_reset', refreshArt);
    window.addEventListener('yimeo_role_changed', handleRoleChange);
    return () => {
      window.removeEventListener('caomei_open_image_editor', handleOpenEditor);
      window.removeEventListener('yimeo_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('yimeo_snapshot_applied', refreshArt);
      window.removeEventListener('yimeo_ui_reset', refreshArt);
      window.removeEventListener('yimeo_role_changed', handleRoleChange);
    };
  }, []);

  // Close avatar dropdown menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
    };
    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showAvatarMenu]);

  const refreshArt = () => {
    setSiteAvatar(getSiteAvatarArt());
    setBunniesMascot(getBunniesArt());
    applyBackground(getBackgroundArt());
  };

  const handleAvatarFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 500);
      setSiteAvatarArt(dataUrl);
      setSiteAvatar(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setSiteAvatarArt(url);
        setSiteAvatar(url);
      };
      reader.readAsDataURL(file);
    }
    setShowAvatarMenu(false);
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen text-[#8d2d48] font-cute p-3 sm:p-6 max-w-7xl mx-auto relative">
      {/* Falling objects effect (sakura, strawberries, or custom objects) */}
      <FallingEffect />

      {/* Screen Click Burst particle effect */}
      <ClickBurstEffect />

      {/* Role Selection Screen - appears BEFORE welcome screen */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onRoleSelected={handleRoleSelected}
      />

      {/* Intro loading screen with 3 bunnies - only once per session or on logout */}
      {showIntro && (
        <LoadingIntro key={introKey} onFinish={() => setShowIntro(false)} />
      )}

      {/* User Artwork Settings Modal */}
      <ArtSettingsModal
        isOpen={showArtModal}
        onClose={() => setShowArtModal(false)}
        onUpdated={refreshArt}
      />

      {/* Website Theme Color Palette Modal */}
      <PaletteModal
        isOpen={showPaletteModal}
        onClose={() => setShowPaletteModal(false)}
      />

      {/* Website Theme & UI Backup Modal */}
      <ThemeBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onApplied={refreshArt}
      />

      {/* Loading Animation & Mascot Configuration Modal */}
      <LoadingSettingsModal
        isOpen={showLoadingSettingsModal}
        onClose={() => setShowLoadingSettingsModal(false)}
        onPreviewWelcome={() => {
          setIntroKey((k) => k + 1);
          setShowIntro(true);
        }}
      />

      {/* User Theme Selector Modal (⋆.𐙚 ̊.) */}
      <UserThemeModal
        isOpen={showUserThemeModal}
        onClose={() => setShowUserThemeModal(false)}
        onApplied={refreshArt}
      />

      {/* Universal Image Editor Modal */}
      <ImageEditorModal
        isOpen={showImageEditorModal}
        onClose={() => setShowImageEditorModal(false)}
        initialImage={imageEditorOptions.initialImage}
        targetTitle={imageEditorOptions.targetTitle}
        targetType={imageEditorOptions.targetType}
        targetSlotKey={imageEditorOptions.targetSlotKey}
        characterId={imageEditorOptions.characterId}
        onSaved={(url) => {
          refreshArt();
          if (imageEditorOptions.onSaved) {
            imageEditorOptions.onSaved(url);
          }
        }}
      />

      {/* Main Navigation Bar (cùng khung với Caomei, Home, Archive, Add, và Nhạc Nền Sảnh) */}
      <nav className="flex flex-col gap-3 p-3.5 sm:p-4 bg-[#fffff2]/90 backdrop-blur-md border-2 border-[#ffc2d1] rounded-3xl mb-6 shadow-[0_8px_20px_rgba(255,194,209,0.4)]">
        {/* Hàng 1: Avatar + Tên web (trái) và Nút Đăng xuất "𐔌՞꜆.  ̫.꜀՞𐦯" (phải - đúng vị trí khoanh tròn) */}
        <div className="w-full flex items-center justify-between gap-3">
          {/* Khu vực ảnh đại diện Avatar được khoanh tròn + Tên web */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Nút Avatar: Admin có thể sửa, người xem chỉ xem */}
            <div className="relative shrink-0" ref={avatarMenuRef}>
              {userRole === 'admin' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowAvatarMenu((prev) => !prev)}
                    className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 shadow-xs flex items-center justify-center overflow-hidden cursor-pointer group hover:scale-105 transition-all select-none p-0.5"
                    style={{
                      borderColor: 'var(--theme-border, #ffb3c6)',
                      backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                    }}
                    title="Ảnh đại diện (Avatar) Yimeo's home - Nhấn để thêm hoặc đổi ảnh (Chủ khu tự trị)"
                  >
                    {siteAvatar ? (
                      <>
                        <img
                          src={siteAvatar}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-full group-hover:opacity-90 transition"
                        />
                        {/* Badge biểu tượng máy ảnh */}
                        <span
                          className="absolute bottom-0 right-0 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] border border-white shadow-xs"
                          style={{ backgroundColor: 'var(--theme-accent, #ff8fab)' }}
                        >
                          📷
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#d45d79]">
                        <span className="text-sm">📷</span>
                        <span className="text-[9px] font-black leading-none mt-0.5" style={{ color: 'var(--theme-accent, #ff8fab)' }}>+</span>
                      </div>
                    )}
                  </button>

                  {/* Input file ẩn tải ảnh đại diện từ điện thoại / máy tính */}
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Menu thao tác nhanh cho ảnh đại diện của Admin */}
                  {showAvatarMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-[#fffff2] border-2 border-[#ffb3c6] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn text-[#8d2d48]">
                      <div className="px-3 py-1.5 border-b border-[#ffc2d1]/60 mb-1">
                        <span className="text-[11px] font-black text-[#d45d79] block">
                          🎀 Ảnh đại diện / Avatar
                        </span>
                        <span className="text-[10px] text-[#b33959]">
                          Chủ khu tự trị
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAvatarMenu(false);
                          avatarFileInputRef.current?.click();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-[#ffdde7] text-[#8d2d48] flex items-center gap-2 transition cursor-pointer"
                      >
                        <span>📁</span>
                        <span>Tải ảnh mới từ máy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAvatarMenu(false);
                          setImageEditorOptions({
                            initialImage: siteAvatar || null,
                            targetTitle: "Chỉnh Sửa Avatar Yimeo's home",
                            targetType: 'avatar',
                          });
                          setShowImageEditorModal(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold hover:bg-[#ffdde7] text-[#8d2d48] flex items-center gap-2 transition cursor-pointer"
                      >
                        <span>✂️</span>
                        <span>Chỉnh sửa & Cắt avatar</span>
                      </button>

                      {siteAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAvatarMenu(false);
                            removeSiteAvatarArt();
                            setSiteAvatar(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold hover:bg-red-50 text-red-600 flex items-center gap-2 transition cursor-pointer"
                        >
                          <span>🗑️</span>
                          <span>Xóa ảnh avatar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAvatarMenu(false)}
                        className="w-full text-center mt-1 py-1 text-[11px] font-bold text-[#b33959] hover:text-[#8d2d48] cursor-pointer"
                      >
                        ✕ Đóng
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Người xem: Avatar tĩnh không chỉnh sửa */
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 shadow-xs flex items-center justify-center overflow-hidden p-0.5 select-none"
                  style={{
                    borderColor: 'var(--theme-border, #ffb3c6)',
                    backgroundColor: 'var(--theme-light-bg, #ffe0df)',
                  }}
                  title="Avatar Yimeo's home"
                >
                  {siteAvatar ? (
                    <img
                      src={siteAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl">🌸</span>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/archive"
              className="font-anja-eliane text-2xl sm:text-3xl select-none tracking-normal inline-flex items-center group cursor-pointer overflow-visible leading-none pb-1"
              title="ngọt (nhấn để đến Lover)"
            >
              <span className="relative inline-block overflow-visible align-baseline">
                ng
                <span className="relative inline-block align-baseline">
                  o
                  {/* Dấu nặng tròn có viền trắng sắc nét và bóng đổ khớp 100% với chữ Anja Eliane */}
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -bottom-[2px] sm:-bottom-[3px] w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] rounded-full border-2 border-white pointer-events-none"
                    style={{
                      backgroundColor: 'var(--theme-bubble-fill, #ff9ebb)',
                      boxShadow: '0 2px 0px var(--theme-bubble-shadow, #eb8ba6)',
                    }}
                  />
                </span>
                t.
              </span>
            </Link>
          </div>

          {/* Nút đăng xuất theo yêu cầu hiển thị "𐔌՞꜆.  ̫.꜀՞𐦯" ở góc trên bên phải */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-[var(--theme-light-bg,#ffe0df)] to-[var(--theme-card-bg,#fffff2)] hover:from-[var(--theme-bg,#ffdde7)] hover:to-[var(--theme-light-bg,#ffe0df)] text-[#8d2d48] hover:text-[#5c1328] text-xs sm:text-sm font-bold shadow-xs transition-all border border-[var(--theme-border,#ffb3c6)] cursor-pointer flex items-center gap-1.5 active:scale-95 select-none shrink-0"
            title="Đăng xuất (𐔌՞꜆.  ̫.꜀՞𐦯) - Hiện lại màn hình chào mừng và vào lại web"
          >
            <span
              className="text-xs sm:text-sm tracking-tight font-sans inline-block"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            >
              𐔌՞꜆.  ̫.꜀՞𐦯
            </span>
          </button>
        </div>

        {/* Hàng 2: Các mục liên kết About me, Home, Lover, Add và các nút tiện ích */}
        <div className="w-full flex flex-wrap items-center gap-2.5 sm:gap-3 font-bold text-sm sm:text-base pt-0.5">
          <Link
            to="/about"
            className="nav-clean-link text-[#8d2d48] hover:text-[#5c1328] px-1 py-1 transition-colors select-none"
          >
            About me
          </Link>
          <Link
            to="/"
            className="nav-clean-link text-[#8d2d48] hover:text-[#5c1328] px-1 py-1 transition-colors select-none"
          >
            Home
          </Link>
          <Link
            to="/archive"
            className="nav-clean-link text-[#8d2d48] hover:text-[#5c1328] px-1 py-1 transition-colors select-none"
          >
            Lover
          </Link>

          {/* Nút "⋆.𐙚 ̊." dành cho User chọn các giao diện Admin lưu sẵn */}
          <button
            type="button"
            onClick={() => setShowUserThemeModal(true)}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[var(--theme-light-bg,#ffe0df)] to-[var(--theme-card-bg,#fffff2)] hover:from-[var(--theme-bg,#ffdde7)] text-[var(--theme-secondary,#8d2d48)] text-xs sm:text-sm font-black border border-[var(--theme-border,#ffb3c6)] shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1 select-none"
            title="⋆.𐙚 ̊. - Chọn giao diện & bản lưu có sẵn (Dành cho người xem)"
          >
            <span>⋆.𐙚 ̊.</span>
          </button>

          {/* Các mục quản trị chỉ hiển thị cho chủ khu tự trị (admin), ẩn hoàn toàn với người xem */}
          {userRole === 'admin' && (
            <>
              <Link
                to="/add-character"
                className="nav-clean-link text-[#8d2d48] hover:text-[#5c1328] px-1 py-1 transition-colors select-none"
              >
                Add
              </Link>

              <button
                onClick={() => setShowArtModal(true)}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff9ebb] to-[#ff8fab] hover:from-[#ff8fab] hover:to-[#e57390] text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-[#f888a7]"
                title="Cài đặt ảnh gốc của bạn"
              >
                <span>🎨</span>
                <span>Ảnh của tôi</span>
              </button>

              <button
                onClick={() => setShowBackupModal(true)}
                className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ffe0df] to-[#ffdde7] hover:from-[#ffc2d1] hover:to-[#ffaac4] text-[#8d2d48] text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-[#ffb3c6] active:scale-95"
                title="Lưu trữ & Quản lý các bản thiết kế giao diện (palette, vật thể rơi, click, icon, v.v.)"
              >
                <span>💾</span>
                <span>Bản lưu</span>
              </button>

              <button
                onClick={() => {
                  setImageEditorOptions({
                    initialImage: getBackgroundArt() || null,
                    targetTitle: 'Studio Chỉnh Sửa & Cắt Ảnh Toàn Diện',
                    targetType: 'general',
                  });
                  setShowImageEditorModal(true);
                }}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff8fab] to-[#e56b82] hover:from-[#ff7b99] hover:to-[#d4556f] text-white text-xs sm:text-sm font-black shadow-sm transition cursor-pointer flex items-center gap-1.5 border border-[#e56b82] active:scale-95"
                title="Chỉnh sửa ảnh: phóng to, thu nhỏ, di chuyển trái phải, xoay, lật cho emote, icon, background, avatar"
              >
                <span>✂️</span>
                <span>Chỉnh sửa ảnh</span>
              </button>

              <button
                onClick={() => setShowLoadingSettingsModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ffe0df] to-[#ffc2d1] hover:from-[#ffd4e0] hover:to-[#ffb3c6] text-[#8d2d48] text-xs sm:text-sm font-black shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-[#ffb3c6] active:scale-95"
                title="Tùy chỉnh hoạt ảnh thanh loading & mascot chào mừng (Admin)"
              >
                <span>⏳</span>
                <span>Hoạt ảnh loading</span>
              </button>
            </>
          )}

          {/* Lobby BGM Background Music Player in the top right corner of the navbar */}
          <div className="pl-1 sm:pl-2 border-l border-[#ffc2d1]/80 flex items-center">
            <LobbyMusicPlayer />
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="bg-[#fffff2]/90 border-2 border-[#ffc2d1] rounded-3xl p-4 sm:p-8 shadow-[0_10px_30px_rgba(255,194,209,0.3)] min-h-[500px]">
        <Outlet />
      </main>
    </div>
  );
}

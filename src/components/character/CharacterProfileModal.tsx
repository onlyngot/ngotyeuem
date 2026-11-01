import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Character } from '@/src/types/character';
import ImagePlaceholder from '@/src/components/ui/ImagePlaceholder';
import CustomIcon from '@/src/components/ui/CustomIcon';
import { STRAWBERRY_LYCHEE_PALETTE } from '@/src/data/storage';
import { parseMusicUrl, cuteSynth } from '@/src/utils/audioHelper';
import { getAllPalettes, ColorPalette } from '@/src/data/paletteStorage';
import { isAdminUser } from '@/src/data/authRoleStorage';

interface CharacterProfileModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (character: Character) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (character: Character) => void;
}

interface CharacterProfileContentProps {
  character: Character;
  onClose: () => void;
  onEdit?: (character: Character) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (character: Character) => void;
}

// Helper to determine readable text color (white vs deep rose) over any background hex
function getContrastColor(hexColor: string): string {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2) || 'ff', 16);
    const g = parseInt(hex.substring(2, 4) || 'ff', 16);
    const b = parseInt(hex.substring(4, 6) || 'ff', 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 160 ? '#7a1f38' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

// Helper to convert hex code to rgba with specified alpha opacity
function hexToRgba(hexColor: string, alpha: number): string {
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2) || 'ff', 16);
    const g = parseInt(hex.substring(2, 4) || 'ff', 16);
    const b = parseInt(hex.substring(4, 6) || 'ff', 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return hexColor;
  }
}

interface AestheticProfileTheme {
  modalBg: string; // Dynamic background of profile modal card
  laceBg: string; // Scalloped top lace bar
  subBoxBg: string; // Sub-boxes background
  subBoxBorder: string; // Sub-boxes border
  textColor: string; // Primary text color
  subTextColor: string; // Subtitle text color
  footerBg: string; // Footer background
  memoBg: string; // Memo background
}

/**
 * Requirement 10: Màu nền của profile tự động chỉnh theo palette viền
 * - Khi viền quá đậm -> nền nhạt, thoáng, pastel nhẹ nhàng
 * - Khi viền nhạt -> nền đậm hơn, ấm/lạnh tương phản hài hòa
 * - Giữ trọn tone màu đáng yêu, Y2K aesthetic
 */
function getAestheticProfileTheme(activeHex: string): AestheticProfileTheme {
  const hex = activeHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || 'ff', 16);
  const g = parseInt(hex.substring(2, 4) || 'ff', 16);
  const b = parseInt(hex.substring(4, 6) || 'ff', 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;

  // RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 345;
  let s = 0.5;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h = Math.round(h * 60);
  }

  // Case 1: Border is deep / dark (luminance < 140, e.g. deep crimson, dark violet, plum)
  // => Light, airy, soft pastel cream/pink background with harmonious tint
  if (luminance < 140) {
    return {
      modalBg: `hsl(${h}, 55%, 97%)`,
      laceBg: hexToRgba(activeHex, 0.2),
      subBoxBg: `hsl(${h}, 45%, 94%)`,
      subBoxBorder: hexToRgba(activeHex, 0.35),
      textColor: '#4a1525',
      subTextColor: '#7a2238',
      footerBg: hexToRgba(activeHex, 0.16),
      memoBg: `hsl(${h}, 40%, 98%)`,
    };
  }

  // Case 2: Border is very pale / light (luminance >= 215, e.g. ivory #fffff2, light blush #ffdde7)
  // => Deeper, richer cute aesthetic pastel tone to create sweet contrast and definition
  if (luminance >= 215) {
    return {
      modalBg: `hsl(${h || 345}, 65%, 90%)`,
      laceBg: `hsl(${h || 345}, 70%, 82%)`,
      subBoxBg: `hsl(${h || 345}, 60%, 94%)`,
      subBoxBorder: `hsl(${h || 345}, 65%, 78%)`,
      textColor: '#571324',
      subTextColor: '#80233b',
      footerBg: `hsl(${h || 345}, 65%, 85%)`,
      memoBg: `hsl(${h || 345}, 50%, 96%)`,
    };
  }

  // Case 3: Border is medium sweet pastel (140 <= luminance < 215, e.g. #ffc2d1, #ff9ebb, #e0c3fc)
  return {
    modalBg: `hsl(${h}, 50%, 96%)`,
    laceBg: hexToRgba(activeHex, 0.24),
    subBoxBg: hexToRgba(activeHex, 0.15),
    subBoxBorder: hexToRgba(activeHex, 0.4),
    textColor: '#5c1629',
    subTextColor: '#8d2d48',
    footerBg: hexToRgba(activeHex, 0.22),
    memoBg: '#fffff2',
  };
}

function CharacterProfileContent({
  character,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}: CharacterProfileContentProps) {
  const isAdmin = isAdminUser();
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(character.isFavorite || false);
  // Requirement 9: Default likes is 0 strictly! Count only when user clicks.
  const [likesCount, setLikesCount] = useState(character.likes ?? 0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Profile Character Music & Spinning Vinyl Record State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  const parsedMusic = parseMusicUrl(character.musicUrl);

  // Swatch colors from character palette or Strawberry Lychee Pink aesthetic
  const palette = character.palette && character.palette.length >= 6 ? character.palette : STRAWBERRY_LYCHEE_PALETTE;

  // Selected color index within the palette
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(() => {
    if (
      typeof character.selectedColorIndex === 'number' &&
      character.selectedColorIndex >= 0 &&
      character.selectedColorIndex < palette.length
    ) {
      return character.selectedColorIndex;
    }
    return 3 < palette.length ? 3 : 0;
  });

  const [artZoom, setArtZoom] = useState(1);
  const [artPanX, setArtPanX] = useState(0);
  const [showPaletteSelector, setShowPaletteSelector] = useState(false);

  const handleApplyPresetPalette = (p: ColorPalette) => {
    const newColors = p.characterSwatches && p.characterSwatches.length >= 6
      ? p.characterSwatches.slice(0, 6)
      : [
          p.colors.bg,
          p.colors.lightBg,
          p.colors.border,
          p.colors.primary,
          p.colors.accent,
          p.colors.secondary,
        ];
    if (onToggleFavorite) {
      onToggleFavorite({
        ...character,
        palette: newColors,
        selectedColorIndex: 3,
      });
    }
  };

  const handleCustomColorChange = (index: number, newHex: string) => {
    const updated = [...palette];
    updated[index] = newHex;
    if (onToggleFavorite) {
      onToggleFavorite({
        ...character,
        palette: updated,
      });
    }
  };

  // Sync state if character prop changes
  useEffect(() => {
    setIsLiked(character.isFavorite || false);
    setLikesCount(character.likes ?? 0);
    setArtZoom(1);
    setArtPanX(0);
    setIsConfirmingDelete(false);
    if (
      typeof character.selectedColorIndex === 'number' &&
      character.selectedColorIndex >= 0 &&
      character.selectedColorIndex < palette.length
    ) {
      setSelectedColorIndex(character.selectedColorIndex);
    }
  }, [character.id, character.selectedColorIndex, character.isFavorite, character.likes, palette.length]);

  // Audio coordination: When modal closes while music is playing, resume lobby music!
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cuteSynth.stop();
      window.dispatchEvent(new Event('caomei_resume_lobby_bgm'));
    };
  }, []);

  const activeColor = palette[selectedColorIndex] || palette[0] || '#ffc2d1';
  const contrastTextColor = getContrastColor(activeColor);
  const theme = getAestheticProfileTheme(activeColor);

  const handleSelectColor = (index: number) => {
    setSelectedColorIndex(index);
    if (onToggleFavorite) {
      onToggleFavorite({
        ...character,
        selectedColorIndex: index,
      });
    }
  };

  const handleCopyLink = () => {
    if (character.characterLink) {
      navigator.clipboard.writeText(character.characterLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    const newCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLikesCount(newCount);
    if (onToggleFavorite) {
      onToggleFavorite({
        ...character,
        isFavorite: nextLiked,
        likes: newCount,
        selectedColorIndex,
      });
    }
  };

  // Requirement 3 & 7: Toggle character music & pause lobby BGM!
  const toggleCharacterMusic = () => {
    const nextPlaying = !isMusicPlaying;
    setIsMusicPlaying(nextPlaying);

    if (nextPlaying) {
      window.dispatchEvent(new Event('caomei_pause_lobby_bgm'));

      if (parsedMusic.type === 'youtube') {
        if (ytIframeRef.current?.contentWindow) {
          ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        }
      } else if (parsedMusic.type === 'direct' && audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn('Direct audio play error, falling back to cute synth:', err);
          cuteSynth.start();
        });
      } else {
        cuteSynth.start();
      }
    } else {
      window.dispatchEvent(new Event('caomei_resume_lobby_bgm'));

      if (parsedMusic.type === 'youtube' && ytIframeRef.current?.contentWindow) {
        ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cuteSynth.stop();
    }
  };

  const fileName = `${character.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'titlehere'}.jpg`;

  // 2 distinct images: Avatar vs Main artwork
  const avatarImageSrc = character.avatarUrl || (!character.mainImageUrl ? null : character.mainImageUrl);
  const mainImageSrc = character.mainImageUrl || (!character.avatarUrl ? null : character.avatarUrl);

  // Vinyl disc center image (custom or fallback to avatar/artwork)
  const vinylCenterImage = character.vinylCoverUrl || avatarImageSrc || mainImageSrc;
  const musicAudioSource = parsedMusic.directAudioUrl || (parsedMusic.type === 'direct' ? parsedMusic.rawUrl : 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3');

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      {/* Hidden Audio Player for Character Profile Music (for direct audio URLs or phone files) */}
      <audio
        ref={audioRef}
        src={musicAudioSource}
        loop
        onEnded={() => {
          setIsMusicPlaying(false);
          window.dispatchEvent(new Event('caomei_resume_lobby_bgm'));
        }}
        onPause={() => {
          setIsMusicPlaying(false);
        }}
        onPlay={() => {
          setIsMusicPlaying(true);
          window.dispatchEvent(new Event('caomei_pause_lobby_bgm'));
        }}
        onError={() => {
          if (isMusicPlaying) {
            cuteSynth.start();
          }
        }}
      />

      {/* Hidden YouTube player for YouTube links */}
      {parsedMusic.type === 'youtube' && parsedMusic.youtubeVideoId && (
        <div className="hidden pointer-events-none" aria-hidden="true">
          <iframe
            ref={ytIframeRef}
            src={`https://www.youtube.com/embed/${parsedMusic.youtubeVideoId}?enablejsapi=1&autoplay=0&loop=1&playlist=${parsedMusic.youtubeVideoId}`}
            title="YouTube Player"
            allow="autoplay"
            className="w-1 h-1 opacity-0 pointer-events-none"
          />
        </div>
      )}

      {/* Outer retro container - dynamic border AND dynamic background driven by active palette color */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[500px] my-auto rounded-[32px] border-[3.5px] overflow-hidden font-cute transition-all duration-300 shadow-2xl"
        style={{
          borderColor: activeColor,
          backgroundColor: theme.modalBg,
          color: theme.textColor,
          boxShadow: `0 20px 50px ${hexToRgba(activeColor, 0.45)}`,
        }}
      >
        {/* Top Scalloped Lace Trim themed with active color */}
        <div
          className="w-full pt-2.5 pb-2 px-4 border-b-[3px] relative transition-colors duration-300"
          style={{
            backgroundColor: theme.laceBg,
            borderBottomColor: activeColor,
          }}
        >
          <div className="flex justify-between items-center">
            {/* Scalloped decorative dots */}
            <div className="flex gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full bg-white border inline-block shadow-2xs transition-colors"
                style={{ borderColor: activeColor }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full bg-white border inline-block shadow-2xs transition-colors"
                style={{ borderColor: activeColor }}
              />
              <span
                className="w-2.5 h-2.5 rounded-full bg-white border inline-block shadow-2xs transition-colors"
                style={{ borderColor: activeColor }}
              />
            </div>
            <span
              className="text-[11px] font-black tracking-wider uppercase drop-shadow-2xs"
              style={{ color: theme.textColor }}
            >
              ♡ Character Profile ♡
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full font-black flex items-center justify-center text-xs transition active:scale-95 cursor-pointer border-2 shadow-2xs bg-white hover:bg-red-400 hover:text-white"
              style={{
                borderColor: activeColor,
                color: theme.textColor,
              }}
              title="Đóng profile"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-3.5 relative">
          {/* Header Profile Section */}
          <div className="flex items-center gap-3.5">
            {/* 1. Circular Avatar with clean thick border in activeColor (khung sạch sẽ, không nút thừa) */}
            <div className="relative group/avatar flex-shrink-0">
              <div
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-[3.5px] p-1 bg-white overflow-hidden shadow-xs flex items-center justify-center transition-colors duration-300"
                style={{ borderColor: activeColor }}
              >
                {avatarImageSrc ? (
                  <img
                    src={avatarImageSrc}
                    alt={`${character.name} avatar`}
                    className="w-full h-full object-cover rounded-full select-none"
                  />
                ) : (
                  <ImagePlaceholder size="sm" />
                )}
              </div>
            </div>

            {/* Title, bio and tags */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate flex items-center gap-1.5" style={{ color: theme.textColor }}>
                <span style={{ color: activeColor }}>ε</span>
                <span className="truncate">{character.name || 'My Untitled Site'}</span>
                <span style={{ color: activeColor }}>3</span>
              </h2>

              <p className="text-[11px] sm:text-xs truncate mt-0.5 font-medium flex items-center gap-1" style={{ color: theme.subTextColor }}>
                <span>♫</span>
                <span className="truncate">{character.description.split('\n')[0] || 'info info info info info!'}</span>
                <span>ヾ(•ω•`)o</span>
              </p>

              {/* Requirement 11: Các icon tags mặc định luôn là "⌗" dù có bao nhiêu tag đi chăng nữa */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {character.tags && character.tags.length > 0 ? (
                  character.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full border-[2px] text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors duration-300"
                      style={{
                        backgroundColor: theme.subBoxBg,
                        borderColor: activeColor,
                        color: theme.textColor,
                      }}
                    >
                      <span className="font-mono text-[9px] font-black">⌗</span>
                      <span>{tag}</span>
                    </span>
                  ))
                ) : (
                  <>
                    <span
                      className="px-2.5 py-0.5 rounded-full border-[2px] text-[10px] font-bold flex items-center gap-1 transition-colors"
                      style={{
                        backgroundColor: theme.subBoxBg,
                        borderColor: activeColor,
                        color: theme.textColor,
                      }}
                    >
                      <span className="font-mono text-[9px] font-black">⌗</span> about
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full border-[2px] text-[10px] font-bold flex items-center gap-1 transition-colors"
                      style={{
                        backgroundColor: theme.subBoxBg,
                        borderColor: activeColor,
                        color: theme.textColor,
                      }}
                    >
                      <span className="font-mono text-[9px] font-black">⌗</span> interests
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full border-[2px] text-[10px] font-bold flex items-center gap-1 transition-colors"
                      style={{
                        backgroundColor: theme.subBoxBg,
                        borderColor: activeColor,
                        color: theme.textColor,
                      }}
                    >
                      <span className="font-mono text-[9px] font-black">⌗</span> byi/dni
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quote / Subtitle Banner */}
          <div
            className="rounded-full py-1.5 px-3 border-[2.5px] text-center font-bold text-xs shadow-2xs select-none transition-colors duration-300 flex items-center justify-center gap-1 truncate"
            style={{
              backgroundColor: theme.subBoxBg,
              borderColor: activeColor,
              color: theme.textColor,
            }}
          >
            <span style={{ color: activeColor }}>✦</span>
            <span className="truncate">
              {character.subheader || (character.fandom ? `about: ${character.fandom}` : 'welcome to caomei archive!')}
            </span>
            <CustomIcon name="heartIcon" fallback="💖" className="w-3.5 h-3.5 mx-1 inline-block" />
            <span style={{ color: activeColor }}>✦</span>
          </div>

          {/* Main 2-Column Grid Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* LEFT COLUMN: Main Artwork (titlehere.jpg) + Palette Swatches */}
            <div className="flex flex-col gap-3">
              {/* Retro Framed Artwork Box with activeColor border */}
              <div
                className="bg-white rounded-2xl border-[3px] overflow-hidden shadow-xs flex flex-col transition-colors duration-300"
                style={{ borderColor: activeColor }}
              >
                {/* Artwork Title Bar */}
                <div
                  className="px-3 py-1.5 border-b-[2.5px] flex items-center justify-between text-xs font-bold transition-colors duration-300"
                  style={{
                    backgroundColor: theme.subBoxBg,
                    borderBottomColor: activeColor,
                    color: theme.textColor,
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[11px]">📁</span>
                    <span className="font-mono text-[11px] truncate tracking-tight">{fileName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CustomIcon name="heartIcon" fallback="♥" className="w-3 h-3 inline-block" />
                    <button
                      onClick={handleCopyLink}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-2xs border"
                      style={{
                        backgroundColor: activeColor,
                        borderColor: activeColor,
                        color: contrastTextColor,
                      }}
                      title="Copy link to clipboard"
                    >
                      {copied ? '✓ Đã chép' : 'share'}
                    </button>
                  </div>
                </div>

                {/* Main Artwork Image Container (clean, aesthetic, no overlapping heart/edit buttons) */}
                <div
                  className="w-full h-44 sm:h-52 p-2 flex items-center justify-center overflow-hidden transition-colors relative"
                  style={{ backgroundColor: hexToRgba(activeColor, 0.08) }}
                >
                  {mainImageSrc ? (
                    <img
                      src={mainImageSrc}
                      alt={`${character.name} artwork`}
                      style={{
                        transform: `scale(${artZoom}) translateX(${artPanX}px)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out',
                      }}
                      className="max-h-full max-w-full object-contain rounded-xl drop-shadow-xs select-none"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <ImagePlaceholder size="md" />
                      <span className="text-[10px] mt-2 font-medium" style={{ color: theme.subTextColor }}>
                        Chưa có tranh tải lên
                      </span>
                    </div>
                  )}
                </div>

                {/* Artwork bottom bar: Căn chỉnh zoom & pan tiện lợi chỉ dành cho Admin */}
                {isAdmin && (
                  <div
                    className="px-2.5 py-1.5 border-t-[2px] flex items-center justify-between gap-1 text-[10px] font-bold transition-colors"
                    style={{
                      backgroundColor: theme.subBoxBg,
                      borderTopColor: activeColor,
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-semibold hidden sm:inline" style={{ color: theme.textColor }}>🔍 Căn chỉnh:</span>
                      <button
                        type="button"
                        onClick={() => setArtZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
                        className="px-1.5 py-0.5 rounded bg-white border text-[10px] hover:bg-[#ffdde7] cursor-pointer"
                        style={{ borderColor: activeColor }}
                        title="Thu nhỏ ảnh"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtZoom((z) => Math.min(3.0, +(z + 0.2).toFixed(1)))}
                        className="px-1.5 py-0.5 rounded bg-white border text-[10px] hover:bg-[#ffdde7] cursor-pointer"
                        style={{ borderColor: activeColor }}
                        title="Phóng to ảnh"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtPanX((p) => p - 16)}
                        className="px-1.5 py-0.5 rounded bg-white border text-[9px] hover:bg-[#ffdde7] cursor-pointer"
                        style={{ borderColor: activeColor }}
                        title="Di chuyển sang trái"
                      >
                        ◄ Trái
                      </button>
                      <button
                        type="button"
                        onClick={() => setArtPanX((p) => p + 16)}
                        className="px-1.5 py-0.5 rounded bg-white border text-[9px] hover:bg-[#ffdde7] cursor-pointer"
                        style={{ borderColor: activeColor }}
                        title="Di chuyển sang phải"
                      >
                        Phải ►
                      </button>
                    </div>

                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(character)}
                        className="px-2 py-0.5 rounded-full bg-white border text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                        style={{
                          borderColor: activeColor,
                          color: theme.textColor,
                        }}
                        title="Đổi hoặc chỉnh sửa thông tin nhân vật"
                      >
                        ✏️ Đổi ảnh
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 6 Color Swatches Box: Viền palette màu thay đổi theo mã màu được chọn */}
              <div
                className="rounded-2xl border-[3px] p-2 bg-white shadow-2xs transition-all duration-300 flex flex-col gap-1.5"
                style={{
                  borderColor: activeColor,
                  boxShadow: `0 4px 14px ${hexToRgba(activeColor, 0.25)}`,
                }}
              >
                <div className="flex items-center justify-between px-1 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1" style={{ color: theme.textColor }}>
                      <span>🎨</span>
                      <span>Palette:</span>
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setShowPaletteSelector((prev) => !prev)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer active:scale-95 hover:opacity-90 shadow-2xs"
                        style={{
                          backgroundColor: showPaletteSelector ? activeColor : theme.subBoxBg,
                          borderColor: activeColor,
                          color: showPaletteSelector ? contrastTextColor : theme.textColor,
                        }}
                        title="Chọn thêm bảng màu mới cho nhân vật này"
                      >
                        {showPaletteSelector ? '✕ Đóng' : '➕ Đổi/Thêm Palette'}
                      </button>
                    )}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors shadow-2xs"
                    style={{
                      borderColor: activeColor,
                      backgroundColor: activeColor,
                      color: contrastTextColor,
                    }}
                  >
                    {activeColor.toUpperCase()}
                  </span>
                </div>

                {/* Palette Selector Drawer */}
                {showPaletteSelector && (
                  <div className="p-2 rounded-xl bg-[#ffe0df]/40 border border-[#ffb3c6] flex flex-col gap-1.5 animate-fadeIn">
                    <span className="text-[10px] font-bold" style={{ color: theme.textColor }}>
                      Chọn bảng màu cho nhân vật này:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                      {getAllPalettes().map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleApplyPresetPalette(p)}
                          className="px-2 py-1 rounded-lg border bg-white text-left text-[10px] font-bold hover:bg-[#ffdde7] transition cursor-pointer flex items-center justify-between shadow-2xs"
                          style={{ borderColor: activeColor }}
                        >
                          <span className="truncate">{p.emoji} {p.name}</span>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colors.bg }} />
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colors.border }} />
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.colors.accent }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6 Interactive Color Swatches with click to select or double-click to pick custom color */}
                <div className="grid grid-cols-6 gap-1.5 pt-0.5">
                  {palette.slice(0, 6).map((color, idx) => {
                    const isSelected = idx === selectedColorIndex;
                    return (
                      <div key={idx} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleSelectColor(idx)}
                          className={`w-full relative h-7 sm:h-8 rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-offset-1 scale-105 shadow-xs'
                              : 'hover:opacity-90'
                          }`}
                          style={{
                            backgroundColor: color,
                            borderColor: isSelected ? '#571324' : 'rgba(0,0,0,0.15)',
                          }}
                          title={`Chọn màu: ${color}`}
                        >
                          {isSelected && (
                            <span
                              className="text-[10px] font-black drop-shadow-sm select-none"
                              style={{ color: getContrastColor(color) }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                        {/* Hidden color picker on hover for admin customization only */}
                        {isAdmin && (
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => handleCustomColorChange(idx, e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            title={`Đổi màu slot ${idx + 1} (${color})`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Welcome Memo + Likes + Please Note */}
            <div className="flex flex-col gap-3">
              {/* Header Box: Welcome text */}
              <div
                className="rounded-2xl border-[2.5px] p-2 text-center shadow-2xs transition-colors duration-300"
                style={{
                  borderColor: activeColor,
                  backgroundColor: theme.subBoxBg,
                }}
              >
                <h4 className="text-xs font-black tracking-wider uppercase" style={{ color: theme.textColor }}>
                  ::: welcome! :::
                </h4>
                <p className="text-[10px] font-bold truncate" style={{ color: theme.subTextColor }}>
                  {character.subheader || (character.fandom ? `about: ${character.fandom}` : 'subheader here!')}
                </p>
              </div>

              {/* Retro Window Memo Box */}
              <div
                className="rounded-2xl border-[3px] overflow-hidden shadow-xs flex flex-col flex-1 transition-colors duration-300"
                style={{
                  borderColor: activeColor,
                  backgroundColor: theme.memoBg,
                }}
              >
                {/* 3 Window Dots */}
                <div
                  className="px-3 py-1.5 border-b-[2.5px] flex items-center gap-1.5 transition-colors duration-300"
                  style={{
                    backgroundColor: theme.subBoxBg,
                    borderBottomColor: activeColor,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border-2 bg-white inline-block transition-colors"
                    style={{ borderColor: activeColor }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full border-2 bg-white inline-block transition-colors"
                    style={{ borderColor: activeColor }}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full border-2 bg-white inline-block transition-colors"
                    style={{ borderColor: activeColor }}
                  />
                </div>

                {/* Memo Content: Requirement 8: Sửa chữ "fandom" thành "about" */}
                <div className="p-3 text-[11px] leading-relaxed flex-1 max-h-36 overflow-y-auto space-y-2" style={{ color: theme.textColor }}>
                  <div className="flex items-center gap-1 font-bold text-[10px]" style={{ color: activeColor }}>
                    <span>●</span><span>●</span><span>●</span>
                    <span className="truncate" style={{ color: theme.textColor }}>
                      {character.fandom ? `About: ${character.fandom}` : 'Character About & Story'}
                    </span>
                  </div>
                  <p className="whitespace-pre-line">
                    {character.description || 'Chưa có tiểu sử chi tiết cho nhân vật này.'}
                  </p>
                </div>
              </div>

              {/* Stats Bar: Requirement 9: Heart Likes default to 0 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLike}
                  className="py-1.5 px-3 rounded-full border-[2.5px] font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                  style={{
                    borderColor: activeColor,
                    backgroundColor: isLiked ? activeColor : theme.subBoxBg,
                    color: isLiked ? contrastTextColor : theme.textColor,
                  }}
                  title="Like character"
                >
                  <CustomIcon
                    name="heartIcon"
                    fallback={isLiked ? '♥' : '♡'}
                    className="w-3.5 h-3.5 inline-block text-pink-500"
                  />
                  <span>{String(likesCount).padStart(3, '0')}</span>
                </button>

                <div
                  className="py-1.5 px-3 rounded-full border-[2.5px] font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs select-none transition-colors duration-300"
                  style={{
                    borderColor: activeColor,
                    backgroundColor: theme.subBoxBg,
                    color: theme.textColor,
                  }}
                >
                  <span>🔄</span>
                  <span className="truncate">{character.platform || '000'}</span>
                </div>
              </div>

              {/* Please Note ! Box */}
              <div
                className="rounded-2xl border-[2.5px] p-2.5 shadow-2xs transition-colors duration-300"
                style={{
                  borderColor: activeColor,
                  backgroundColor: theme.subBoxBg,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1 text-xs font-black" style={{ color: theme.textColor }}>
                  <span className="text-sm">💉</span>
                  <span>please note !</span>
                </div>
                <div
                  className="border-t-[2.5px] pt-1.5 text-[10px] leading-snug max-h-20 overflow-y-auto transition-colors"
                  style={{
                    borderTopColor: activeColor,
                    color: theme.subTextColor,
                  }}
                >
                  <p className="italic whitespace-pre-line">
                    {character.notes || 'Không có ghi chú đặc biệt cho nhân vật này.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit & Actions Bar */}
        <div
          className="px-4 py-2.5 border-t-[3px] flex flex-wrap items-center justify-between gap-2 transition-colors duration-300"
          style={{
            backgroundColor: theme.footerBg,
            borderTopColor: activeColor,
          }}
        >
          {/* Cute Platform / Bunny pill */}
          <span
            className="px-3 py-1 rounded-full bg-white border-[2.5px] text-[11px] font-bold shadow-2xs select-none transition-colors"
            style={{
              borderColor: activeColor,
              color: theme.textColor,
            }}
          >
            {character.platform && character.platform !== 'xiu.carrd.co' && character.platform !== 'Carrd' ? `by ${character.platform}` : '꒰ᐢ. .ᐢ꒱'}
          </span>

          {/* Action buttons including Delete profile with confirmation */}
          <div className="flex items-center gap-2">
            {/* Requirement 5: Nút Xóa profile character (Chỉ hiển thị cho Admin) */}
            {isAdmin && onDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-red-50 p-1 px-2 rounded-full border border-red-300 animate-fadeIn">
                  <span className="text-[10px] text-red-600 font-bold">Xác nhận xóa?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(character.id);
                      onClose();
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold cursor-pointer transition active:scale-95"
                  >
                    ✓ Xóa ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-0.5 rounded-full bg-white text-gray-700 text-[10px] font-bold border border-gray-300 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-1 rounded-full text-red-500 hover:bg-red-50 bg-white border border-red-200 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                  title="Xóa vĩnh viễn profile này"
                >
                  <span>🗑️</span>
                  <span>Xóa profile</span>
                </button>
              )
            )}

            {isAdmin && onEdit && (
              <button
                onClick={() => onEdit(character)}
                className="px-3.5 py-1 rounded-full text-xs font-black border-[2.5px] transition active:scale-95 cursor-pointer shadow-2xs bg-white"
                style={{
                  borderColor: activeColor,
                  color: theme.textColor,
                }}
              >
                ✏️ Sửa (Edit)
              </button>
            )}

            <a
              href={character.characterLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1 rounded-full text-xs font-black shadow-2xs transition active:scale-95 flex items-center gap-1 border-[2.5px]"
              style={{
                backgroundColor: activeColor,
                borderColor: activeColor,
                color: contrastTextColor,
              }}
            >
              <span>Mở Link</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Requirement 3: CHIẾC ĐĨA XOAY TRÒN (SPINNING VINYL RECORD) ĐƯỢC ĐẶT Ở GÓC TRÊN BÊN PHẢI ĐỂ HOÀN TOÀN KHÔNG ĐÈ LÊN NÚT MỞ LINK */}
        <div className="absolute top-11 right-3 sm:top-12 sm:right-4 z-30 flex items-center group/vinyl pointer-events-auto">
          {/* Song title banner on hover / when playing */}
          {isMusicPlaying && (
            <div className="mr-2 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border-2 shadow-md text-[10px] font-bold text-[#8d2d48] animate-fadeIn max-w-[140px] truncate" style={{ borderColor: activeColor }}>
              <span className="animate-spin text-[10px]">♫</span>
              <span className="truncate">{character.musicTitle || `${character.name} Melody`}</span>
            </div>
          )}

          {/* Quick Vinyl Disc Image adjustment button for admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent('caomei_open_image_editor', {
                    detail: {
                      initialImage: vinylCenterImage,
                      targetTitle: `Chỉnh sửa Ảnh Tâm Đĩa Than: ${character.name}`,
                      targetType: 'icon',
                      characterId: character.id,
                    },
                  })
                );
              }}
              className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-white text-[#8d2d48] border-2 shadow-md flex items-center justify-center text-[10px] font-bold opacity-85 hover:opacity-100 hover:scale-110 transition cursor-pointer z-40 hover:bg-[#ffdde7]"
              style={{ borderColor: activeColor }}
              title="Căn chỉnh ảnh tâm đĩa than (phóng to, thu nhỏ, di chuyển)"
            >
              ✂️
            </button>
          )}

          {/* The Spinning Vinyl Record */}
          <div
            onClick={toggleCharacterMusic}
            className="relative cursor-pointer transition transform hover:scale-105 active:scale-95"
            title={isMusicPlaying ? 'Tạm dừng đĩa than (Nhạc sảnh sẽ tiếp tục)' : 'Bật đĩa than phát nhạc profile (Nhạc sảnh sẽ ngưng)'}
          >
            {/* Spinning disc body with grooves and outer rim */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 shadow-[0_4px_16px_rgba(0,0,0,0.35)] relative flex items-center justify-center transition-all ${
                isMusicPlaying ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: '3.8s',
                borderColor: activeColor,
                background: 'radial-gradient(circle, #2b0c1b 0%, #17050d 38%, #2d0d1d 42%, #14040b 58%, #2e0e1e 62%, #120309 78%, #2b0c1b 82%, #080104 100%)',
              }}
            >
              {/* Fine vinyl grooves lines */}
              <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute inset-2.5 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none" />

              {/* Center Record Label / Album Art (customizable by admin) */}
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/90 overflow-hidden relative shadow-inner flex items-center justify-center bg-black"
                style={{ borderColor: activeColor }}
              >
                {vinylCenterImage ? (
                  <img
                    src={vinylCenterImage}
                    alt="Vinyl Disc Cover"
                    style={{
                      transform: `scale(${character.vinylZoom || 1}) translate(${character.vinylPanX || 0}px, ${character.vinylPanY || 0}px)`,
                    }}
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                ) : (
                  <span className="text-[10px] text-white select-none">💿</span>
                )}

                {/* Spindle hole */}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-white border border-gray-400 shadow-inner pointer-events-none" />
              </div>
            </div>

            {/* Play/Pause overlay badge */}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-[#8d2d48] border-2 shadow-xs flex items-center justify-center text-[8px] font-black transition"
              style={{ borderColor: activeColor }}
            >
              {isMusicPlaying ? '❚❚' : '▶'}
            </div>

            {/* Cute floating music notes when playing */}
            {isMusicPlaying && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="absolute -top-3 left-1 text-[11px] text-pink-500 animate-bounce">♪</span>
                <span className="absolute -top-5 -left-2 text-[10px] text-purple-500 animate-pulse">♫</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CharacterProfileModal({
  character,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}: CharacterProfileModalProps) {
  if (!isOpen || !character || typeof document === 'undefined') return null;

  return (
    <CharacterProfileContent
      character={character}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
    />
  );
}

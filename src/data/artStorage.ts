// Authentic user-provided art storage (strictly user files, no mock/synthetic fallbacks)

const BUNNIES_ART_KEY = 'caomei_custom_bunnies_art';
const BG_ART_KEY = 'caomei_custom_background_art';
const STICKERS_KEY = 'caomei_custom_stickers';
const ICON_SLOTS_KEY = 'caomei_custom_icon_slots';

export interface CustomIconSlots {
  searchIcon?: string | null;      // 🔍 Kính lúp tìm kiếm
  heartIcon?: string | null;       // 💖 / ♥ Trái tim yêu thích & Like
  sparkleIcon?: string | null;     // ✨ Ngôi sao lấp lánh
  bowIcon?: string | null;         // 🎀 Nơ ruy băng
  strawberryIcon?: string | null;  // 🍓 Quả dâu tây
  pillIcon?: string | null;        // 💊 Viên thuốc (link copy)
}

export const ICON_SLOT_DEFINITIONS: {
  key: keyof CustomIconSlots;
  label: string;
  defaultEmoji: string;
  description: string;
}[] = [
  {
    key: 'searchIcon',
    label: 'Kính lúp tìm kiếm',
    defaultEmoji: '🔍',
    description: 'Icon trong thanh tìm kiếm nhân vật tại Archive',
  },
  {
    key: 'heartIcon',
    label: 'Trái tim / Like',
    defaultEmoji: '💖',
    description: 'Icon yêu thích trên thẻ nhân vật và nút Like trong Profile',
  },
  {
    key: 'sparkleIcon',
    label: 'Lấp lánh / Sparkle',
    defaultEmoji: '✨',
    description: 'Icon trang trí tiêu đề, nút thêm nhân vật và chào mừng',
  },
  {
    key: 'bowIcon',
    label: 'Nơ ruy băng / Bow',
    defaultEmoji: '🎀',
    description: 'Icon phong cách Y2K và trạng thái giỏ trống',
  },
  {
    key: 'strawberryIcon',
    label: 'Dâu tây / Strawberry',
    defaultEmoji: '🍓',
    description: 'Biểu tượng dâu tây đặc trưng của Caomei Archive',
  },
  {
    key: 'pillIcon',
    label: 'Viên thuốc / Pill',
    defaultEmoji: '💊',
    description: 'Icon nút sao chép link trên thanh địa chỉ Profile',
  },
];

export function getCustomIconSlots(): CustomIconSlots {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(ICON_SLOTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function setCustomIconSlot(slot: keyof CustomIconSlots, imageUrl: string | null): void {
  if (typeof localStorage === 'undefined') return;
  const current = getCustomIconSlots();
  if (imageUrl) {
    current[slot] = imageUrl;
  } else {
    delete current[slot];
  }
  localStorage.setItem(ICON_SLOTS_KEY, JSON.stringify(current));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_icons_updated'));
  }
}

export function clearAllCustomIcons(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ICON_SLOTS_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_icons_updated'));
  }
}

export function getBunniesArt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(BUNNIES_ART_KEY);
}

export function setBunniesArt(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(BUNNIES_ART_KEY, dataUrl);
}

export function removeBunniesArt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(BUNNIES_ART_KEY);
}

// Welcome Screen Mascot Art (Có thể khác với ảnh mascot ở Home, tùy admin chỉnh sửa)
const WELCOME_MASCOT_KEY = 'yimeo_custom_welcome_mascot';

export function getWelcomeMascotArt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const direct = localStorage.getItem(WELCOME_MASCOT_KEY);
  if (direct) return direct;
  return getBunniesArt();
}

export function setWelcomeMascotArt(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WELCOME_MASCOT_KEY, dataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_welcome_mascot_updated'));
  }
}

export function removeWelcomeMascotArt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(WELCOME_MASCOT_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_welcome_mascot_updated'));
  }
}

// ==========================================
// Loading Bar Animation & Runner Sprite Settings (Ảnh 8)
// ==========================================
const LOADING_BAR_SETTINGS_KEY = 'yimeo_loading_bar_settings';

export type LoadingBarEffect = 'runner_sprite' | 'candy_stripes' | 'shimmer_glow' | 'cloud_drift' | 'sparkle_trail';

export interface LoadingBarSettings {
  effect: LoadingBarEffect;
  runnerSprite: string | null; // Custom uploaded runner image
  runnerPreset: 'cloud' | 'bunny' | 'star' | 'strawberry' | 'cat' | 'custom';
}

export const DEFAULT_LOADING_BAR_SETTINGS: LoadingBarSettings = {
  effect: 'runner_sprite',
  runnerSprite: null,
  runnerPreset: 'cloud',
};

export function getLoadingBarSettings(): LoadingBarSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_LOADING_BAR_SETTINGS;
  const raw = localStorage.getItem(LOADING_BAR_SETTINGS_KEY);
  if (!raw) return DEFAULT_LOADING_BAR_SETTINGS;
  try {
    return { ...DEFAULT_LOADING_BAR_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LOADING_BAR_SETTINGS;
  }
}

export function setLoadingBarSettings(settings: LoadingBarSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOADING_BAR_SETTINGS_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_loading_bar_updated', { detail: settings }));
  }
}

// Site / Header Avatar Art (Ảnh đại diện Yimeo's home bên góc trái thanh điều hướng)
const SITE_AVATAR_KEY = 'yimeo_custom_site_avatar';

// Gate Choice Images (Ảnh tùy chọn cho 2 lối vào cổng "ngọt và chỉ có ngọt")
const GATE_VIEWER_IMG_KEY = 'yimeo_gate_viewer_image';
const GATE_ADMIN_IMG_KEY = 'yimeo_gate_admin_image';

export function getGateViewerImage(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(GATE_VIEWER_IMG_KEY);
}

export function setGateViewerImage(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GATE_VIEWER_IMG_KEY, dataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_gate_images_updated'));
  }
}

export function removeGateViewerImage(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(GATE_VIEWER_IMG_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_gate_images_updated'));
  }
}

export function getGateAdminImage(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(GATE_ADMIN_IMG_KEY);
}

export function setGateAdminImage(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(GATE_ADMIN_IMG_KEY, dataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_gate_images_updated'));
  }
}

export function removeGateAdminImage(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(GATE_ADMIN_IMG_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_gate_images_updated'));
  }
}

export function getSiteAvatarArt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const direct = localStorage.getItem(SITE_AVATAR_KEY);
  if (direct) return direct;
  // Fallback to bunnies art so previously uploaded image remains visible until changed
  return getBunniesArt();
}

export function setSiteAvatarArt(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SITE_AVATAR_KEY, dataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_avatar_updated'));
  }
}

export function removeSiteAvatarArt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SITE_AVATAR_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_avatar_updated'));
  }
}

// Compress client-side images using Canvas to prevent localStorage QuotaExceededError
export function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<string> {
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

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(mimeType, isPng ? undefined : quality);

        resolve(compressed);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const BG_SETTINGS_KEY = 'caomei_custom_bg_settings';

export interface BackgroundSettings {
  mode: 'repeat' | 'cover' | 'contain';
  tileSize: number; // e.g. 60, 80, 120, 200 (px)
  opacity: number; // 0.2 to 1.0
  blur: number; // 0 to 10 (px)
}

export const DEFAULT_BG_SETTINGS: BackgroundSettings = {
  mode: 'repeat',
  tileSize: 80,
  opacity: 1,
  blur: 0,
};

export function getBackgroundSettings(): BackgroundSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_BG_SETTINGS;
  const raw = localStorage.getItem(BG_SETTINGS_KEY);
  if (!raw) return DEFAULT_BG_SETTINGS;
  try {
    return { ...DEFAULT_BG_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BG_SETTINGS;
  }
}

export function setBackgroundSettings(settings: BackgroundSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(BG_SETTINGS_KEY, JSON.stringify(settings));
  applyBackground(getBackgroundArt(), settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_bg_updated'));
  }
}

export function getBackgroundArt(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(BG_ART_KEY);
}

export function setBackgroundArt(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(BG_ART_KEY, dataUrl);
  applyBackground(dataUrl);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_bg_updated'));
  }
}

export function removeBackgroundArt(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(BG_ART_KEY);
  applyBackground(null);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_bg_updated'));
  }
}

export function applyBackground(customUrl: string | null, customSettings?: BackgroundSettings): void {
  if (typeof document === 'undefined') return;
  const settings = customSettings || getBackgroundSettings();
  if (customUrl) {
    document.body.style.backgroundImage = `url("${customUrl}")`;
    if (settings.mode === 'cover') {
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundAttachment = 'fixed';
    } else if (settings.mode === 'contain') {
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundSize = 'contain';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundRepeat = 'repeat';
      document.body.style.backgroundSize = settings.tileSize > 0 ? `${settings.tileSize}px ${settings.tileSize}px` : 'auto';
      document.body.style.backgroundPosition = 'top left';
      document.body.style.backgroundAttachment = 'scroll';
    }
  } else {
    document.body.style.backgroundImage = "url('/background.svg')";
    document.body.style.backgroundRepeat = 'repeat';
    document.body.style.backgroundSize = '80px 80px';
    document.body.style.backgroundPosition = 'top left';
    document.body.style.backgroundAttachment = 'scroll';
  }
}

export function getCustomStickers(): string[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STICKERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addCustomSticker(dataUrl: string): void {
  if (typeof localStorage === 'undefined') return;
  const current = getCustomStickers();
  localStorage.setItem(STICKERS_KEY, JSON.stringify([...current, dataUrl]));
}

export function removeCustomSticker(index: number): void {
  if (typeof localStorage === 'undefined') return;
  const current = getCustomStickers();
  const next = current.filter((_, i) => i !== index);
  localStorage.setItem(STICKERS_KEY, JSON.stringify(next));
}

// Falling Objects Effect Settings (Hiệu ứng vật thể rơi)
const FALLING_SETTINGS_KEY = 'caomei_falling_settings';

export interface FallingEffectSettings {
  enabled: boolean;
  type: 'preset' | 'custom' | 'mixed';
  preset: 'strawberry' | 'sakura' | 'sparkle' | 'bow' | 'heart' | 'bunny';
  customImageUrl?: string | null; // legacy single
  customImages?: string[]; // Multiple custom falling images (unlimited)
  glowColor?: string; // Blurred shadow tint behind falling objects
  glowIntensity?: 'soft' | 'medium' | 'strong';
  density: 'few' | 'medium' | 'many';
  speed: 'slow' | 'normal' | 'fast';
  size: 'small' | 'medium' | 'large';
}

export const DEFAULT_FALLING_SETTINGS: FallingEffectSettings = {
  enabled: true,
  type: 'preset',
  preset: 'strawberry',
  customImageUrl: null,
  customImages: [],
  glowColor: '#ff9ebb',
  glowIntensity: 'medium',
  density: 'medium',
  speed: 'normal',
  size: 'medium',
};

export function getFallingEffectSettings(): FallingEffectSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_FALLING_SETTINGS;
  const raw = localStorage.getItem(FALLING_SETTINGS_KEY);
  if (!raw) return DEFAULT_FALLING_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    // Backward compatibility: if customImageUrl is set but customImages is empty
    if (parsed.customImageUrl && (!parsed.customImages || parsed.customImages.length === 0)) {
      parsed.customImages = [parsed.customImageUrl];
    }
    return { ...DEFAULT_FALLING_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_FALLING_SETTINGS;
  }
}

export function setFallingEffectSettings(settings: FallingEffectSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(FALLING_SETTINGS_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_falling_effect_updated'));
  }
}

export function addCustomFallingImage(dataUrl: string): void {
  const current = getFallingEffectSettings();
  const list = current.customImages || [];
  const next: FallingEffectSettings = {
    ...current,
    type: 'custom',
    customImageUrl: dataUrl,
    customImages: [...list, dataUrl],
  };
  setFallingEffectSettings(next);
}

export function removeCustomFallingImage(index: number): void {
  const current = getFallingEffectSettings();
  const list = (current.customImages || []).filter((_, i) => i !== index);
  const next: FallingEffectSettings = {
    ...current,
    customImages: list,
    customImageUrl: list[0] || null,
    type: list.length > 0 ? current.type : 'preset',
  };
  setFallingEffectSettings(next);
}

export function resetFallingEffectSettings(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(FALLING_SETTINGS_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_falling_effect_updated'));
  }
}

// Lobby Background Music (Nhạc nền sảnh toàn trang)
// Lobby Background Music & Playlist (Nhạc nền sảnh & Playlist Album toàn trang)
const LOBBY_BGM_KEY = 'caomei_lobby_bgm_settings';

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration?: string;
  coverImage?: string | null;
  url: string;
  type?: 'direct' | 'youtube' | 'spotify' | 'synth';
  isFavorite?: boolean;
}

export interface LobbyBgmSettings {
  enabled: boolean;
  url: string | null;
  title: string;
  playlistName?: string; // Tên playlist (ví dụ: "motive playlist ♡")
  featuredImage?: string | null; // Ảnh featured của playlist
  featuredImagePanX?: number; // Căn chỉnh ảnh bìa trục X (-100 to 100)
  featuredImagePanY?: number; // Căn chỉnh ảnh bìa trục Y (-100 to 100)
  featuredImageZoom?: number; // Thu phóng ảnh bìa (0.5 to 2.5)
  volume: number; // 0 to 1
  loop: boolean;
  playlist: MusicTrack[];
  currentTrackIndex: number;
  shuffle?: boolean;
  repeatMode?: 'all' | 'one' | 'off';
}

export const DEFAULT_PLAYLIST: MusicTrack[] = [
  {
    id: 'track_1',
    title: 'MOTIVE',
    artist: 'ARIANA GRANDE FT DOJA CAT',
    duration: '3:45',
    url: '/assets/audio/track2.mp3',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'track_2',
    title: 'ARMAGGDEON',
    artist: 'AESPA',
    duration: '3:12',
    url: 'synth:lofi',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'track_3',
    title: 'RWM',
    artist: 'JIMMY BROWN FT SWEET THE KID',
    duration: '2:58',
    url: 'https://ia800301.us.archive.org/15/items/CanonInD_201405/CanonInD.mp3',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'track_4',
    title: 'FAITH',
    artist: 'THE WEEKND',
    duration: '4:43',
    url: 'synth:lofi',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
  {
    id: 'track_5',
    title: 'FRI(END)S',
    artist: 'V',
    duration: '3:05',
    url: 'synth:lofi',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=150&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'track_6',
    title: 'DON\'T SMILE',
    artist: 'SABRINA CARPENTER',
    duration: '3:26',
    url: 'synth:lofi',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=150&auto=format&fit=crop&q=80',
    isFavorite: false,
  },
  {
    id: 'track_7',
    title: 'I WONDER',
    artist: 'J-HOPE FT JUNGKOOK',
    duration: '2:44',
    url: 'synth:lofi',
    type: 'direct',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80',
    isFavorite: true,
  },
];

export const DEFAULT_FEATURED_PLAYLIST_IMAGE = '/assets/aistudio/c22426f514266cf541ad9d9848c28126_5dca0237.jpg';

export const DEFAULT_LOBBY_BGM: LobbyBgmSettings = {
  enabled: true,
  url: DEFAULT_PLAYLIST[0].url,
  title: DEFAULT_PLAYLIST[0].title,
  playlistName: 'motive playlist ♡',
  featuredImage: DEFAULT_FEATURED_PLAYLIST_IMAGE,
  volume: 0.6,
  loop: true,
  playlist: DEFAULT_PLAYLIST,
  currentTrackIndex: 0,
  shuffle: false,
  repeatMode: 'all',
};

export function getLobbyBgmSettings(): LobbyBgmSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_LOBBY_BGM;
  const raw = localStorage.getItem(LOBBY_BGM_KEY);
  if (!raw) return DEFAULT_LOBBY_BGM;
  try {
    const parsed = JSON.parse(raw);
    const playlist = parsed.playlist && Array.isArray(parsed.playlist) && parsed.playlist.length > 0
      ? parsed.playlist
      : DEFAULT_PLAYLIST;

    // Ensure featuredImage has a reliable local user asset fallback instead of remote unsplash
    let featuredImage = parsed.featuredImage;
    if (!featuredImage || featuredImage.includes('unsplash.com')) {
      featuredImage = DEFAULT_FEATURED_PLAYLIST_IMAGE;
    }

    return {
      ...DEFAULT_LOBBY_BGM,
      ...parsed,
      featuredImage,
      playlist,
      currentTrackIndex: typeof parsed.currentTrackIndex === 'number' ? parsed.currentTrackIndex : 0,
    };
  } catch {
    return DEFAULT_LOBBY_BGM;
  }
}

export function setLobbyBgmSettings(settings: LobbyBgmSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOBBY_BGM_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('caomei_bgm_updated'));
  }
}

// ==========================================
// Click Burst & Ripple Effect Settings
// ==========================================
const CLICK_BURST_KEY = 'yimeo_click_burst_settings';

export type ClickEffectStyle = 'burst' | 'ripple' | 'floating' | 'sparkle_burst' | 'combo';

export interface ClickBurstSettings {
  enabled: boolean;
  style: ClickEffectStyle;
  preset: 'hearts' | 'strawberries' | 'stars' | 'sparkles' | 'sakura' | 'bows' | 'mixed' | 'custom';
  customImages: string[]; // Admin uploaded particle images
  particleCount: number;  // 4 - 14
}

export const DEFAULT_CLICK_BURST: ClickBurstSettings = {
  enabled: true,
  style: 'combo',
  preset: 'mixed',
  customImages: [],
  particleCount: 8,
};

export function getClickBurstSettings(): ClickBurstSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_CLICK_BURST;
  const raw = localStorage.getItem(CLICK_BURST_KEY);
  if (!raw) return DEFAULT_CLICK_BURST;
  try {
    return { ...DEFAULT_CLICK_BURST, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CLICK_BURST;
  }
}

export function setClickBurstSettings(settings: ClickBurstSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CLICK_BURST_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_click_burst_updated', { detail: settings }));
  }
}

// ==========================================
// Image Decor Effects Settings (Hiệu ứng cho ảnh Admin up)
// ==========================================
const IMAGE_DECOR_KEY = 'yimeo_image_decor_settings';

export type ImageEffectType =
  | 'none'
  | 'bunny-jump'   // Thỏ nhảy nhí nhảnh
  | 'floating'     // Bồng bềnh nhẹ nhàng
  | 'pulse'        // Nhịp thở dịu êm
  | 'wiggle'       // Lắc lư ngộ nghĩnh
  | 'spin-pop'     // Bật lên xoay tròn ngộ nghĩnh
  | 'wobble-spin'  // Lắc lư xoay tròn 360 độ
  | 'bounce-tilt'  // Nảy tưng nghiêng lắc
  | 'sparkles'     // Hào quang lấp lánh xung quanh
  | 'polaroid'     // Khung ảnh vintage dán băng keo
  | 'soft-glow';   // Quầng sáng hào quang mềm mại

export interface ImageDecorSettings {
  mascotEffect: ImageEffectType;
  avatarEffect: ImageEffectType;
  welcomeEffect: ImageEffectType;
  showSparkleParticles: boolean;
  polaroidBorderColor: string;
}

export const DEFAULT_IMAGE_DECOR: ImageDecorSettings = {
  mascotEffect: 'bunny-jump',
  avatarEffect: 'none',
  welcomeEffect: 'floating',
  showSparkleParticles: true,
  polaroidBorderColor: '#fffff2',
};

export function getImageDecorSettings(): ImageDecorSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_IMAGE_DECOR;
  const raw = localStorage.getItem(IMAGE_DECOR_KEY);
  if (!raw) return DEFAULT_IMAGE_DECOR;
  try {
    return { ...DEFAULT_IMAGE_DECOR, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_IMAGE_DECOR;
  }
}

export function setImageDecorSettings(settings: ImageDecorSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(IMAGE_DECOR_KEY, JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_image_decor_updated', { detail: settings }));
  }
}



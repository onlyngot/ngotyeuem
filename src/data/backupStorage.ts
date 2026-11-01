// Theme & UI Customization Backup Storage for Yimeo
// Allows saving, applying, deleting, and resetting snapshots of all UI settings
// (Palette, Image decor, Falling particles, Click burst effects, Icon slots, Stickers, Background pattern, Sounds, etc.)

import {
  ColorPalette,
  getActivePaletteId,
  getActivePalette,
  setActivePalette,
  getCustomPalettes,
  setCustomPalettes,
  applyColorPalette,
} from '@/src/data/paletteStorage';
import {
  getFallingEffectSettings,
  setFallingEffectSettings,
  DEFAULT_FALLING_SETTINGS,
  FallingEffectSettings,
  getClickBurstSettings,
  setClickBurstSettings,
  DEFAULT_CLICK_BURST,
  ClickBurstSettings,
  getImageDecorSettings,
  setImageDecorSettings,
  DEFAULT_IMAGE_DECOR,
  ImageDecorSettings,
  getCustomIconSlots,
  CustomIconSlots,
  clearAllCustomIcons,
  getCustomStickers,
  getBackgroundArt,
  setBackgroundArt,
  removeBackgroundArt,
  getBackgroundSettings,
  setBackgroundSettings,
  DEFAULT_BG_SETTINGS,
  BackgroundSettings,
  getSiteAvatarArt,
  setSiteAvatarArt,
  removeSiteAvatarArt,
  getBunniesArt,
  setBunniesArt,
  removeBunniesArt,
  getWelcomeMascotArt,
  setWelcomeMascotArt,
  removeWelcomeMascotArt,
  getLoadingBarSettings,
  setLoadingBarSettings,
  LoadingBarSettings,
} from '@/src/data/artStorage';
import {
  getSoundSettings,
  setSoundSettings,
  DEFAULT_SOUND_SETTINGS,
  SoundEffectsSettings,
} from '@/src/utils/soundEffects';

const SNAPSHOTS_KEY = 'yimeo_saved_theme_snapshots';

export interface ThemeSnapshot {
  id: string;
  name: string;
  createdAt: number;
  activePaletteId: string;
  paletteColors?: ColorPalette['colors'];
  customPalettes: ColorPalette[];
  imageDecor: ImageDecorSettings;
  fallingSettings: FallingEffectSettings;
  clickBurstSettings: ClickBurstSettings;
  iconSlots: CustomIconSlots;
  stickersCount: number;
  backgroundSettings: BackgroundSettings;
  soundSettings: SoundEffectsSettings;
  loadingBarSettings?: LoadingBarSettings;
  hasCustomBg: boolean;
  hasCustomAvatar: boolean;
  hasCustomBunnies: boolean;
  // Optional base64 or stored data if available
  backgroundArt?: string | null;
  siteAvatar?: string | null;
  bunniesArt?: string | null;
  welcomeMascotArt?: string | null;
}

export function getThemeSnapshots(): ThemeSnapshot[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(SNAPSHOTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveThemeSnapshot(customName?: string): ThemeSnapshot {
  const all = getThemeSnapshots();
  const date = new Date();
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const activePalette = getActivePalette();

  const name = customName?.trim() || `Bản lưu ${activePalette.name} (${dateStr} ${timeStr})`;

  const snapshot: ThemeSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    createdAt: Date.now(),
    activePaletteId: getActivePaletteId(),
    paletteColors: activePalette.colors,
    customPalettes: getCustomPalettes(),
    imageDecor: getImageDecorSettings(),
    fallingSettings: getFallingEffectSettings(),
    clickBurstSettings: getClickBurstSettings(),
    iconSlots: getCustomIconSlots(),
    stickersCount: getCustomStickers().length,
    backgroundSettings: getBackgroundSettings(),
    soundSettings: getSoundSettings(),
    loadingBarSettings: getLoadingBarSettings(),
    hasCustomBg: !!getBackgroundArt(),
    hasCustomAvatar: !!getSiteAvatarArt(),
    hasCustomBunnies: !!getBunniesArt(),
    backgroundArt: getBackgroundArt(),
    siteAvatar: getSiteAvatarArt(),
    bunniesArt: getBunniesArt(),
    welcomeMascotArt: getWelcomeMascotArt(),
  };

  const updated = [snapshot, ...all];
  // Limit to 20 snapshots to stay safely within localStorage limits
  if (updated.length > 20) {
    updated.splice(20);
  }

  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_snapshots_updated', { detail: updated }));
  }

  return snapshot;
}

export function applyThemeSnapshot(snapshotOrId: ThemeSnapshot | string): boolean {
  if (typeof localStorage === 'undefined') return false;

  let snapshot: ThemeSnapshot | undefined;
  if (typeof snapshotOrId === 'string') {
    snapshot = getThemeSnapshots().find((s) => s.id === snapshotOrId);
  } else {
    snapshot = snapshotOrId;
  }

  if (!snapshot) return false;

  // 1. Restore Custom Palettes & Active Palette
  if (snapshot.customPalettes && Array.isArray(snapshot.customPalettes)) {
    setCustomPalettes(snapshot.customPalettes);
  }
  if (snapshot.activePaletteId) {
    setActivePalette(snapshot.activePaletteId);
  }

  // 2. Restore Image Decor
  if (snapshot.imageDecor) {
    setImageDecorSettings(snapshot.imageDecor);
  }

  // 3. Restore Falling Particle Settings
  if (snapshot.fallingSettings) {
    setFallingEffectSettings(snapshot.fallingSettings);
  }

  // 4. Restore Click Burst Settings
  if (snapshot.clickBurstSettings) {
    setClickBurstSettings(snapshot.clickBurstSettings);
  }

  // 5. Restore Icon Slots
  if (snapshot.iconSlots) {
    localStorage.setItem('caomei_custom_icon_slots', JSON.stringify(snapshot.iconSlots));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('caomei_icons_updated'));
    }
  }

  // 6. Restore Background Pattern / Settings
  if (snapshot.backgroundSettings) {
    setBackgroundSettings(snapshot.backgroundSettings);
  }
  if (snapshot.backgroundArt !== undefined) {
    if (snapshot.backgroundArt) {
      setBackgroundArt(snapshot.backgroundArt);
    } else {
      removeBackgroundArt();
    }
  }

  // 7. Restore Avatar & Bunnies Mascot if stored
  if (snapshot.siteAvatar !== undefined) {
    if (snapshot.siteAvatar) {
      setSiteAvatarArt(snapshot.siteAvatar);
    } else {
      removeSiteAvatarArt();
    }
  }
  if (snapshot.bunniesArt !== undefined) {
    if (snapshot.bunniesArt) {
      setBunniesArt(snapshot.bunniesArt);
    } else {
      removeBunniesArt();
    }
  }
  if (snapshot.welcomeMascotArt !== undefined) {
    if (snapshot.welcomeMascotArt) {
      setWelcomeMascotArt(snapshot.welcomeMascotArt);
    } else {
      removeWelcomeMascotArt();
    }
  }

  // 8. Restore Loading Bar Settings
  if (snapshot.loadingBarSettings) {
    setLoadingBarSettings(snapshot.loadingBarSettings);
  }

  // 9. Restore Sound Settings
  if (snapshot.soundSettings) {
    setSoundSettings(snapshot.soundSettings);
  }

  // Dispatch global notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_snapshot_applied', { detail: snapshot }));
  }

  return true;
}

export function deleteThemeSnapshot(id: string): void {
  if (typeof localStorage === 'undefined') return;
  const all = getThemeSnapshots();
  const updated = all.filter((s) => s.id !== id);
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_snapshots_updated', { detail: updated }));
  }
}

export function clearAllThemeSnapshots(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SNAPSHOTS_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_snapshots_updated', { detail: [] }));
  }
}

// Reset all UI appearance configurations back to original sweet pastel defaults
export function resetToDefaultUI(): void {
  if (typeof localStorage === 'undefined') return;

  // Reset palette to strawberry
  setActivePalette('strawberry');

  // Reset image decor
  setImageDecorSettings(DEFAULT_IMAGE_DECOR);

  // Reset falling particle effect
  setFallingEffectSettings(DEFAULT_FALLING_SETTINGS);

  // Reset click burst effect
  setClickBurstSettings(DEFAULT_CLICK_BURST);

  // Reset icon slots
  clearAllCustomIcons();

  // Reset background settings
  setBackgroundSettings(DEFAULT_BG_SETTINGS);
  removeBackgroundArt();

  // Reset sound effects
  setSoundSettings(DEFAULT_SOUND_SETTINGS);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_ui_reset'));
  }
}

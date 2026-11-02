/**
 * Automated Cross-Device Interface Synchronization Manager
 * "Những gì admin update giao diện ở hiện tại -> đều sẽ được hiển thị bất kể thiết bị nào"
 */

import { applyColorPalette, setActivePalette } from '@/src/data/paletteStorage';
import { applyBackground } from '@/src/data/artStorage';

const LAST_SYNCED_KEY = 'yimeo_site_config_last_synced';

// All keys that define the site's complete visual interface & state
const SYNC_KEYS = [
  'caomei_active_palette_id',
  'yimeo_custom_palettes',
  'yimeo_custom_site_avatar',
  'caomei_custom_background_art',
  'caomei_custom_bg_settings',
  'caomei_falling_settings',
  'caomei_custom_bunnies_art',
  'yimeo_custom_welcome_mascot',
  'yimeo_loading_bar_settings',
  'yimeo_mascot_animation_settings',
  'caomei_lobby_bgm_settings',
  'caomei_custom_icon_slots',
  'caomei_custom_stickers',
  'yimeo_gate_viewer_image',
  'yimeo_gate_admin_image',
  'yimeo_theme_snapshots',
  'caomei_characters',
  'caomei_about_me',
] as const;

let isSyncingIncoming = false;
let pushTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Gathers current interface configuration from localStorage into an object
 */
export function gatherLocalConfig(): Record<string, any> {
  if (typeof localStorage === 'undefined') return {};
  const config: Record<string, any> = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        config[key] = JSON.parse(val);
      } catch {
        config[key] = val;
      }
    }
  }
  return config;
}

/**
 * Pushes the current local configuration to the server for global display
 */
export async function pushCurrentConfigToServer(): Promise<boolean> {
  if (isSyncingIncoming || typeof window === 'undefined') return false;
  try {
    const config = gatherLocalConfig();
    const res = await fetch('/api/site-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.lastUpdated) {
        localStorage.setItem(LAST_SYNCED_KEY, String(data.lastUpdated));
      }
      return true;
    }
  } catch (err) {
    console.warn('[SyncManager] Push config error:', err);
  }
  return false;
}

/**
 * Debounced push to avoid hammering server on slider drags
 */
export function queueConfigPush(): void {
  if (pushTimeout) clearTimeout(pushTimeout);
  pushTimeout = setTimeout(() => {
    pushCurrentConfigToServer();
  }, 450);
}

/**
 * Applies remote configuration received from server into client localStorage & DOM
 */
export function applyRemoteConfig(remoteConfig: Record<string, any>): void {
  if (typeof localStorage === 'undefined') return;
  isSyncingIncoming = true;

  try {
    for (const key of SYNC_KEYS) {
      if (remoteConfig[key] !== undefined) {
        const val = remoteConfig[key];
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        localStorage.setItem(key, strVal);
      }
    }

    // Immediately apply active palette styles to DOM
    if (remoteConfig['caomei_active_palette_id']) {
      setActivePalette(remoteConfig['caomei_active_palette_id']);
    } else {
      applyColorPalette();
    }

    // Immediately apply background art & settings
    if (remoteConfig['caomei_custom_background_art'] !== undefined) {
      applyBackground(remoteConfig['caomei_custom_background_art'], remoteConfig['caomei_custom_bg_settings']);
    }

    // Dispatch all reactive update events so all components re-render immediately
    const events = [
      'yimeo_avatar_updated',
      'caomei_bg_updated',
      'yimeo_palette_updated',
      'caomei_falling_effect_updated',
      'caomei_bgm_updated',
      'yimeo_loading_bar_updated',
      'yimeo_mascot_animation_updated',
      'caomei_icons_updated',
      'yimeo_gate_images_updated',
      'yimeo_snapshots_updated',
      'caomei_characters_updated',
    ];

    for (const ev of events) {
      window.dispatchEvent(new Event(ev));
    }
  } finally {
    setTimeout(() => {
      isSyncingIncoming = false;
    }, 150);
  }
}

/**
 * Fetches the latest global configuration from the server
 */
export async function pullLatestConfig(force = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/site-config');
    if (!res.ok) return false;

    const data = await res.json();
    if (!data.success || !data.config) return false;

    const localLastSynced = parseInt(localStorage.getItem(LAST_SYNCED_KEY) || '0', 10);
    const serverLastUpdated = data.lastUpdated || 0;

    // If server has configuration and it's newer, or if forced (on initial load of new device)
    if (serverLastUpdated > 0 && (serverLastUpdated > localLastSynced || force)) {
      applyRemoteConfig(data.config);
      localStorage.setItem(LAST_SYNCED_KEY, String(serverLastUpdated));
      return true;
    } else if (serverLastUpdated === 0 && localLastSynced === 0) {
      // Server is empty, seed it with current local config
      pushCurrentConfigToServer();
    }
  } catch (err) {
    console.warn('[SyncManager] Pull config error:', err);
  }
  return false;
}

/**
 * Initializes automated cross-device synchronization:
 * 1. Pulls latest remote interface on site load
 * 2. Listens to all local interface changes and pushes to server automatically
 * 3. Polls version periodically and on window focus for live cross-device updates
 */
export function initAutomatedSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Initial pull on any device entering the site
  pullLatestConfig(true);

  // 2. Listen to all local interface updates and automatically push to server
  const changeEvents = [
    'yimeo_avatar_updated',
    'caomei_bg_updated',
    'yimeo_palette_updated',
    'caomei_falling_effect_updated',
    'caomei_bgm_updated',
    'yimeo_loading_bar_updated',
    'yimeo_mascot_animation_updated',
    'caomei_icons_updated',
    'yimeo_gate_images_updated',
    'yimeo_snapshots_updated',
    'caomei_characters_updated',
  ];

  const handleLocalChange = () => {
    if (!isSyncingIncoming) {
      queueConfigPush();
    }
  };

  for (const ev of changeEvents) {
    window.addEventListener(ev, handleLocalChange);
  }

  // 3. Automated live sync checking:
  // When another device updates, this device detects the new version and updates the interface
  const checkVersion = async () => {
    try {
      const res = await fetch('/api/site-config/version');
      if (res.ok) {
        const data = await res.json();
        const localLastSynced = parseInt(localStorage.getItem(LAST_SYNCED_KEY) || '0', 10);
        if (data.lastUpdated && data.lastUpdated > localLastSynced) {
          pullLatestConfig(true);
        }
      }
    } catch {}
  };

  // Poll every 8 seconds
  const pollInterval = setInterval(checkVersion, 8000);

  // Also check immediately when tab becomes visible or receives focus
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      checkVersion();
    }
  };

  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  return () => {
    clearInterval(pollInterval);
    for (const ev of changeEvents) {
      window.removeEventListener(ev, handleLocalChange);
    }
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
  };
}

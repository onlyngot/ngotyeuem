import { Character } from '@/src/types/character';

const STORAGE_KEY = 'caomei_characters';

// Official Palette: 莓莓粉荔 (Strawberry Lychee Pink)
export const STRAWBERRY_LYCHEE_PALETTE = [
  '#ffdde7', // Soft strawberry cream
  '#fffff2', // Creamy ivory white
  '#ffe0df', // Lychee peach
  '#ffc2d1', // Accent rose
  '#ff9ebb', // Medium strawberry pink
  '#e57390', // Deep rose accent
];

const DEFAULT_SAMPLE_CHARACTERS: Character[] = [
  {
    id: 'sample-kuromi-profile',
    name: 'My Untitled Site',
    avatarUrl: null,
    mainImageUrl: null,
    fandom: 'Strawberry / Menhera',
    platform: '꒰ᐢ. .ᐢ꒱',
    characterLink: 'https://carrd.co',
    subheader: 'welcome! subheader here!',
    description: 'Male sua da eget est nec. Duis plac erat, justo vitae bibendum mollis.\n\nNulla leo efficitur magna, id finibus quam ipsum et purus. Sed egesta.',
    tags: ['about', 'interests', 'byi/dni'],
    notes: 'Mauris ultricies lacus purus, in luctus dui ornare sed. Cras eget nulla sed nibh lacinia tristique. Phasellus mollis efficitur.',
    category: 'Original',
    isFavorite: false,
    likes: 0,
    palette: STRAWBERRY_LYCHEE_PALETTE,
    selectedColorIndex: 3, // #ffc2d1
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'sample-caomei-bunny',
    name: 'Caomei Bunny',
    avatarUrl: null,
    mainImageUrl: null,
    fandom: 'Pastel Fantasy',
    platform: 'Toyhouse',
    characterLink: 'https://toyhou.se',
    subheader: 'sweet strawberry bunny',
    description: 'Một chú thỏ dâu tây ngọt ngào thích bánh kem và sưu tầm ruy băng pastel.',
    tags: ['kawaii', 'strawberry', 'rabbit'],
    notes: 'Rất nhút nhát nhưng cực kỳ thích kết bạn mới! DNI nếu toxic.',
    category: 'Mascot',
    isFavorite: false,
    likes: 0,
    palette: ['#ebd4f5', '#fff7fd', '#e0c3fc', '#d0a9f5', '#b388eb', '#805ad5'],
    selectedColorIndex: 2, // #e0c3fc
    createdAt: Date.now() - 43200000,
  }
];

const SEEDED_KEY = 'caomei_characters_initialized_v2';

export const getCharacters = (): Character[] => {
  if (typeof localStorage === 'undefined') return DEFAULT_SAMPLE_CHARACTERS;
  const isInitialized = localStorage.getItem(SEEDED_KEY);
  const data = localStorage.getItem(STORAGE_KEY);

  if (!isInitialized || data === null) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_CHARACTERS));
      localStorage.setItem(SEEDED_KEY, 'true');
    } catch (e) {
      console.warn('Could not initialize sample characters in localStorage:', e);
    }
    return DEFAULT_SAMPLE_CHARACTERS;
  }

  try {
    const parsed: Character[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    // Ensure all characters have strictly 0 default likes unless liked by user
    const hasResetLikes = localStorage.getItem('caomei_likes_default_zero_v4');
    if (!hasResetLikes) {
      const sanitized = parsed.map(c => ({
        ...c,
        likes: (c.likes === 120 || c.likes === 88 || c.likes === undefined) ? 0 : Math.max(0, c.likes),
      }));
      localStorage.setItem('caomei_likes_default_zero_v4', 'true');
      saveCharacters(sanitized);
      return sanitized;
    }

    return parsed;
  } catch {
    return [];
  }
};

export const saveCharacters = (characters: Character[]): boolean => {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    localStorage.setItem(SEEDED_KEY, 'true');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('caomei_characters_updated'));
    }
    return true;
  } catch (err) {
    console.warn('localStorage.setItem failed, attempting safe storage fallback:', err);
    try {
      // If quota exceeded, sanitize large base64 strings if necessary to save metadata
      const sanitized = characters.map(c => ({
        ...c,
        avatarUrl: c.avatarUrl && c.avatarUrl.length > 600000 ? null : c.avatarUrl,
        mainImageUrl: c.mainImageUrl && c.mainImageUrl.length > 600000 ? null : c.mainImageUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      localStorage.setItem(SEEDED_KEY, 'true');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('caomei_characters_updated'));
      }
      return true;
    } catch (secondErr) {
      console.error('Fatal: Cannot save characters to localStorage:', secondErr);
      return false;
    }
  }
};

export const updateCharacter = (updated: Character): void => {
  const list = getCharacters();
  const next = list.map(c => c.id === updated.id ? updated : c);
  saveCharacters(next);
};

export const deleteCharacter = (id: string): void => {
  const list = getCharacters();
  const next = list.filter(c => c.id !== id);
  saveCharacters(next);
};


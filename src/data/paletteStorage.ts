// Color Palette Storage & Management for Yimeo
// Supports dynamic aesthetic themes and Admin Custom Color Palette creation

export interface ColorPalette {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isCustom?: boolean;
  characterSwatches?: string[]; // 6 specific colors for Character Profile swatches
  colors: {
    primary: string;       // Tiêu đề nổi bật, link chính (#d45d79)
    secondary: string;     // Chữ nội dung (#8d2d48)
    accent: string;        // Nút bấm, điểm nhấn (#ff8fab)
    accentHover: string;   // Hover nút bấm (#e56b82)
    bg: string;            // Màu nền toàn trang (#ffdde7)
    cardBg: string;        // Nền thẻ card / navbar (#fffff2)
    lightBg: string;       // Nền phụ, tag, hộp thông tin (#ffe0df)
    border: string;        // Viền thẻ, viền modal (#ffb3c6)
    borderLight: string;   // Viền nhạt (#ffc2d1)
    shadow: string;        // Màu bóng đổ rgba
    bubbleFill: string;    // Màu ruột font Biscuit Glitch
    bubbleShadow: string;  // Màu bóng đổ 3D Biscuit Glitch
  };
}

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'strawberry',
    name: 'Dâu Tây Hồng',
    emoji: '🌸',
    description: 'Tone hồng dâu tây kem sữa ngọt ngào cổ điển',
    colors: {
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
    },
  },
  {
    id: 'lavender',
    name: 'Lavender Tím',
    emoji: '💜',
    description: 'Tone hoa oải hương pastel mộng mơ, thư thái',
    colors: {
      primary: '#8e5db5',
      secondary: '#5a307a',
      accent: '#b784eb',
      accentHover: '#9f65db',
      bg: '#ede4f8',
      cardBg: '#fcfaff',
      lightBg: '#f3ecfa',
      border: '#d1bbee',
      borderLight: '#dfcefa',
      shadow: 'rgba(209, 187, 238, 0.45)',
      bubbleFill: '#c7a3ed',
      bubbleShadow: '#9c6ad3',
    },
  },
  {
    id: 'matcha',
    name: 'Matcha Bạc Hà',
    emoji: '🍵',
    description: 'Tone xanh lá trà sữa và bạc hà tươi mát dịu nhẹ',
    colors: {
      primary: '#52825e',
      secondary: '#2e5138',
      accent: '#7ebc89',
      accentHover: '#68a573',
      bg: '#e2f0d9',
      cardBg: '#fafef7',
      lightBg: '#eaf4e6',
      border: '#b8dcbe',
      borderLight: '#cde9d2',
      shadow: 'rgba(184, 220, 190, 0.45)',
      bubbleFill: '#8ecc98',
      bubbleShadow: '#579262',
    },
  },
  {
    id: 'sky',
    name: 'Mây Xanh Biển',
    emoji: '☁️',
    description: 'Tone xanh da trời mây trắng trong trẻo, yên bình',
    colors: {
      primary: '#437cb3',
      secondary: '#234a70',
      accent: '#6ea8e5',
      accentHover: '#5290d1',
      bg: '#deecfa',
      cardBg: '#f6faff',
      lightBg: '#e8f2fc',
      border: '#b4d4f4',
      borderLight: '#cde4f8',
      shadow: 'rgba(180, 212, 244, 0.45)',
      bubbleFill: '#82b7eb',
      bubbleShadow: '#4981be',
    },
  },
  {
    id: 'peach',
    name: 'Đào Mơ Mộng',
    emoji: '🍑',
    description: 'Tone cam đào sữa ấm áp, đáng yêu',
    colors: {
      primary: '#c9644b',
      secondary: '#7c3523',
      accent: '#f28e74',
      accentHover: '#db745a',
      bg: '#fae3da',
      cardBg: '#fffaf8',
      lightBg: '#faece6',
      border: '#f2c0b1',
      borderLight: '#f8d5cb',
      shadow: 'rgba(242, 192, 177, 0.45)',
      bubbleFill: '#f79f88',
      bubbleShadow: '#ce674c',
    },
  },
  {
    id: 'milktea',
    name: 'Trà Sữa Bánh Mì',
    emoji: '🧋',
    description: 'Tone nâu kem cà phê béo ngậy, cozy mộc mạc',
    colors: {
      primary: '#8f6745',
      secondary: '#573a21',
      accent: '#b88d65',
      accentHover: '#9c734e',
      bg: '#ede2d5',
      cardBg: '#fcfaf6',
      lightBg: '#f3ece3',
      border: '#d6c2ae',
      borderLight: '#e4d6c7',
      shadow: 'rgba(214, 194, 174, 0.45)',
      bubbleFill: '#c7a17d',
      bubbleShadow: '#8a6543',
    },
  },
  {
    id: 'cherry',
    name: 'Cherry Mận Chín',
    emoji: '🍒',
    description: 'Tone đỏ cherry đậm chất Y2K Rose cá tính',
    colors: {
      primary: '#ad2b4f',
      secondary: '#631329',
      accent: '#d94d73',
      accentHover: '#bd3359',
      bg: '#f8d7df',
      cardBg: '#fff5f7',
      lightBg: '#f8e3e8',
      border: '#e29fb1',
      borderLight: '#f0b8c6',
      shadow: 'rgba(226, 159, 177, 0.45)',
      bubbleFill: '#e56487',
      bubbleShadow: '#b02a4e',
    },
  },
  {
    id: 'sunshine',
    name: 'Bơ Chanh Vàng',
    emoji: '🍋',
    description: 'Tone vàng chanh mật ong rực rỡ, vui tươi',
    colors: {
      primary: '#b0841e',
      secondary: '#694b0d',
      accent: '#e5b437',
      accentHover: '#cca02b',
      bg: '#fcf4d4',
      cardBg: '#fffef7',
      lightBg: '#faf4db',
      border: '#edd787',
      borderLight: '#f6e7a6',
      shadow: 'rgba(237, 215, 135, 0.45)',
      bubbleFill: '#f0c754',
      bubbleShadow: '#bf9224',
    },
  },
  // MIX & DIVERSE PALETTES (Palette phối màu đa dạng mới)
  {
    id: 'cotton_candy',
    name: 'Kẹo Bông Xanh Hồng',
    emoji: '🍬',
    description: 'Mix kẹo bông gòn: nền xanh mây pastel phối viền hồng phấn ngọt ngào',
    colors: {
      primary: '#b84d7a',
      secondary: '#5c1b38',
      accent: '#ff85b3',
      accentHover: '#e06596',
      bg: '#dcf0fa',
      cardBg: '#f8fcff',
      lightBg: '#fde8f1',
      border: '#fbc2db',
      borderLight: '#c4e6f8',
      shadow: 'rgba(251, 194, 219, 0.45)',
      bubbleFill: '#ff9fc3',
      bubbleShadow: '#d85888',
    },
  },
  {
    id: 'sunset_sherbet',
    name: 'Hoàng Hôn Cam Tím',
    emoji: '🌅',
    description: 'Mix hoàng hôn thơ mộng: tím tử đinh hương phối cam san hô rạng rỡ',
    colors: {
      primary: '#8e4b85',
      secondary: '#54224d',
      accent: '#f78361',
      accentHover: '#d86544',
      bg: '#fbe4ee',
      cardBg: '#fff8fc',
      lightBg: '#fdeee5',
      border: '#f6b8c9',
      borderLight: '#f9cbbe',
      shadow: 'rgba(247, 131, 97, 0.35)',
      bubbleFill: '#f78fa7',
      bubbleShadow: '#8e4b85',
    },
  },
  {
    id: 'matcha_strawberry',
    name: 'Matcha Dâu Tây',
    emoji: '🍓🍵',
    description: 'Mix kem matcha xanh mát kết hợp dâu tây tươi mọng',
    colors: {
      primary: '#c43d63',
      secondary: '#36533d',
      accent: '#ff7a9e',
      accentHover: '#de5b7e',
      bg: '#e8f3e6',
      cardBg: '#fafff8',
      lightBg: '#fcecf1',
      border: '#c3e2bf',
      borderLight: '#f7c3d2',
      shadow: 'rgba(195, 226, 191, 0.45)',
      bubbleFill: '#ff8cae',
      bubbleShadow: '#497352',
    },
  },
  {
    id: 'fairy_lavender_rose',
    name: 'Vườn Tiên Hoa Hồng',
    emoji: '🧚',
    description: 'Mix hoa hồng cổ tích và hoa cà lavender ma mị',
    colors: {
      primary: '#9b3e6d',
      secondary: '#4d1e38',
      accent: '#b265dc',
      accentHover: '#974abf',
      bg: '#f5e4f7',
      cardBg: '#fefaff',
      lightBg: '#faeaf2',
      border: '#e4bce7',
      borderLight: '#f3cbe1',
      shadow: 'rgba(178, 101, 220, 0.35)',
      bubbleFill: '#d28be8',
      bubbleShadow: '#8a335e',
    },
  },
  {
    id: 'midnight_star',
    name: 'Đêm Sao Huyền Bí',
    emoji: '🌌',
    description: 'Tone đêm huyền ảo tím trầm ánh vàng trăng sao',
    colors: {
      primary: '#6b43a4',
      secondary: '#2e1c4a',
      accent: '#e6b93f',
      accentHover: '#cfa228',
      bg: '#ded3ef',
      cardBg: '#f7f4fc',
      lightBg: '#ebe2f7',
      border: '#c0aee2',
      borderLight: '#d5c8ed',
      shadow: 'rgba(107, 67, 164, 0.35)',
      bubbleFill: '#9973d4',
      bubbleShadow: '#4d2b7d',
    },
  },
  {
    id: 'pistachio_raspberry',
    name: 'Hạt Dẻ & Mâm Xôi',
    emoji: '🍨',
    description: 'Mix xanh quả hồ đào dịu mát phối quả mâm xôi đậm đà',
    colors: {
      primary: '#9b2c55',
      secondary: '#425547',
      accent: '#64a376',
      accentHover: '#4e865e',
      bg: '#ebf4ed',
      cardBg: '#fcfefc',
      lightBg: '#fae8f0',
      border: '#bddbc5',
      borderLight: '#f2bfd4',
      shadow: 'rgba(100, 163, 118, 0.35)',
      bubbleFill: '#db5b87',
      bubbleShadow: '#43694f',
    },
  },
  // BỘ PALETTE MỚI TỪ BỘ ẢNH NGƯỜI DÙNG CUNG CẤP (ẢNH 2 -> ẢNH 7)
  {
    id: 'vintage_american',
    name: 'Mỹ Thức Phục Cổ',
    emoji: '📻',
    description: 'Tone retro cổ điển: nâu mocha vintage phối xanh mòng két và kem ấm (#694A47, #96C1C5, #FFF0DE)',
    characterSwatches: ['#fff0de', '#f5e4cf', '#bde0e3', '#96c1c5', '#7ca8ac', '#694a47'],
    colors: {
      primary: '#694a47',
      secondary: '#472c29',
      accent: '#96c1c5',
      accentHover: '#7ca8ac',
      bg: '#fff0de',
      cardBg: '#fffaea',
      lightBg: '#f7e9d7',
      border: '#96c1c5',
      borderLight: '#bde0e3',
      shadow: 'rgba(150, 193, 197, 0.4)',
      bubbleFill: '#96c1c5',
      bubbleShadow: '#694a47',
    },
  },
  {
    id: 'cinnamon_milktea',
    name: 'Trà Sữa Quế',
    emoji: '🍂',
    description: 'Tone trà sữa quế dịu dàng: xám be quế, hồng phấn trầm và bọt sữa (#CFC1B4, #EACDC7, #F0E3D3, #E5E6D8)',
    characterSwatches: ['#fdfaf6', '#f0e3d3', '#e5e6d8', '#eacdc7', '#cfc1b4', '#8c6b5e'],
    colors: {
      primary: '#8c6b5e',
      secondary: '#594136',
      accent: '#eacdc7',
      accentHover: '#d8b3ac',
      bg: '#f0e3d3',
      cardBg: '#fdfaf6',
      lightBg: '#e5e6d8',
      border: '#cfc1b4',
      borderLight: '#eacdc7',
      shadow: 'rgba(207, 193, 180, 0.45)',
      bubbleFill: '#eacdc7',
      bubbleShadow: '#8c6b5e',
    },
  },
  {
    id: 'spring_peach',
    name: 'Xuân Nhật Đào Đào',
    emoji: '🌸🍑',
    description: 'Mùa xuân ngọt ngào: màu trà sữa nhạt phối hồng đào phớt kem sữa (#D8C4B9, #FFCCC8, #FEE5E1, #FDEFE2)',
    characterSwatches: ['#fdefe2', '#fee5e1', '#ffebee', '#ffccc8', '#d8c4b9', '#b85b6b'],
    colors: {
      primary: '#b85b6b',
      secondary: '#783643',
      accent: '#ffccc8',
      accentHover: '#eaaba6',
      bg: '#fee5e1',
      cardBg: '#fdefe2',
      lightBg: '#ffebee',
      border: '#ffccc8',
      borderLight: '#f5dedb',
      shadow: 'rgba(255, 204, 200, 0.45)',
      bubbleFill: '#ffccc8',
      bubbleShadow: '#b85b6b',
    },
  },
  {
    id: 'haes_cream',
    name: 'Kem Bơ Aqua',
    emoji: '🧈✨',
    description: 'Hae\'s palette cream: xanh mint pastel kết hợp bơ sữa vàng custard (#BFF2F0, #FFDA92, #FFE4B0, #FFF1D5, #FCF3E0)',
    characterSwatches: ['#fcf3e0', '#fff1d5', '#ffe4b0', '#ffda92', '#bff2f0', '#c78326'],
    colors: {
      primary: '#c78326',
      secondary: '#7a4d10',
      accent: '#bff2f0',
      accentHover: '#9ce4e1',
      bg: '#fff1d5',
      cardBg: '#fcf3e0',
      lightBg: '#ffe4b0',
      border: '#ffda92',
      borderLight: '#bff2f0',
      shadow: 'rgba(255, 218, 146, 0.45)',
      bubbleFill: '#ffda92',
      bubbleShadow: '#c78326',
    },
  },
  {
    id: 'baby_blue_clouds',
    name: 'Mây Xanh Trời',
    emoji: '☁️🩵',
    description: 'Tone mây xanh pastel và kem mịn trong trẻo (#E3F1FB, #A8D0EF, #C1E4F3, #FFF9E6, #99C3E4)',
    characterSwatches: ['#fff9e6', '#e3f1fb', '#c1e4f3', '#a8d0ef', '#99c3e4', '#3d7ca8'],
    colors: {
      primary: '#3d7ca8',
      secondary: '#214c6d',
      accent: '#a8d0ef',
      accentHover: '#8abfe5',
      bg: '#e3f1fb',
      cardBg: '#fff9e6',
      lightBg: '#c1e4f3',
      border: '#99c3e4',
      borderLight: '#c1e4f3',
      shadow: 'rgba(168, 208, 239, 0.45)',
      bubbleFill: '#a8d0ef',
      bubbleShadow: '#3d7ca8',
    },
  },
  {
    id: 'matcha_sakura',
    name: 'Trà Xanh Hoa Đào',
    emoji: '🍵🌸',
    description: 'Sắc xuân tươi tắn: xanh lá mạ tươi kết hợp hồng phớt dịu dàng (#A5C256, #D3E281, #F2B1AC, #FCE0E7, #FCF2DE)',
    characterSwatches: ['#fcf2de', '#fce0e7', '#f2b1ac', '#d3e281', '#a5c256', '#4d6824'],
    colors: {
      primary: '#4d6824',
      secondary: '#2e4014',
      accent: '#f2b1ac',
      accentHover: '#d99792',
      bg: '#fcf2de',
      cardBg: '#ffffff',
      lightBg: '#fce0e7',
      border: '#d3e281',
      borderLight: '#f2b1ac',
      shadow: 'rgba(211, 226, 129, 0.45)',
      bubbleFill: '#f2b1ac',
      bubbleShadow: '#4d6824',
    },
  },
  {
    id: 'mustard_olive',
    name: 'Mù Tạt Oliu Mùa Thu',
    emoji: '🌾',
    description: 'Tone vàng mù tạt cổ điển phối xanh oliu nhạt ấm áp (#C7C65F, #F3DE77, #FAF5B4, #F1D681, #FCF5DB)',
    characterSwatches: ['#fcf5db', '#faf5b4', '#f1d681', '#f3de77', '#c7c65f', '#7a7923'],
    colors: {
      primary: '#7a7923',
      secondary: '#474712',
      accent: '#f3de77',
      accentHover: '#d6c15c',
      bg: '#fcf5db',
      cardBg: '#ffffff',
      lightBg: '#faf5b4',
      border: '#c7c65f',
      borderLight: '#f1d681',
      shadow: 'rgba(199, 198, 95, 0.45)',
      bubbleFill: '#f3de77',
      bubbleShadow: '#7a7923',
    },
  },
  {
    id: 'vintage_plum_rose',
    name: 'Mận Hồng Cổ Điển',
    emoji: '🥀',
    description: 'Tone mận hoa hồng dịu dàng đậm chất vintage thơ mộng (#B56175, #DD95A7, #F2B5B8, #F3DEE3, #FAF2E1)',
    characterSwatches: ['#faf2e1', '#f3dee3', '#f2b5b8', '#dd95a7', '#b56175', '#8e3d51'],
    colors: {
      primary: '#8e3d51',
      secondary: '#541e2b',
      accent: '#dd95a7',
      accentHover: '#bf788b',
      bg: '#f3dee3',
      cardBg: '#faf2e1',
      lightBg: '#f2b5b8',
      border: '#b56175',
      borderLight: '#dd95a7',
      shadow: 'rgba(181, 97, 117, 0.45)',
      bubbleFill: '#dd95a7',
      bubbleShadow: '#8e3d51',
    },
  },
  {
    id: 'lavender_mint_pastel',
    name: 'Oải Hương Bạc Hà',
    emoji: '🎐',
    description: 'Mix hoa oải hương tím pastel và bạc hà mát lành (#ECE2F0, #E2D9EC, #F4EACF, #DBF2FB, #D4EDE8)',
    characterSwatches: ['#ffffff', '#f4eacf', '#d4ede8', '#dbf2fb', '#e2d9ec', '#6d5282'],
    colors: {
      primary: '#6d5282',
      secondary: '#3f2d4e',
      accent: '#dbf2fb',
      accentHover: '#bce6f5',
      bg: '#ece2f0',
      cardBg: '#ffffff',
      lightBg: '#f4eacf',
      border: '#e2d9ec',
      borderLight: '#d4ede8',
      shadow: 'rgba(226, 217, 236, 0.45)',
      bubbleFill: '#dbf2fb',
      bubbleShadow: '#6d5282',
    },
  },
];

export const COLOR_PALETTES = PRESET_PALETTES;

const PALETTE_KEY = 'yimeo_active_color_palette';
const CUSTOM_PALETTES_KEY = 'yimeo_custom_color_palettes';

export function getCustomPalettes(): ColorPalette[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(CUSTOM_PALETTES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setCustomPalettes(palettes: ColorPalette[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(palettes));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_custom_palettes_updated'));
  }
}

export function saveCustomPalette(palette: ColorPalette): void {
  if (typeof localStorage === 'undefined') return;
  const current = getCustomPalettes();
  const existingIdx = current.findIndex((p) => p.id === palette.id);
  const updated = [...current];
  if (existingIdx >= 0) {
    updated[existingIdx] = { ...palette, isCustom: true };
  } else {
    updated.push({ ...palette, isCustom: true });
  }
  localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_custom_palettes_updated'));
  }
}

export function deleteCustomPalette(id: string): void {
  if (typeof localStorage === 'undefined') return;
  const current = getCustomPalettes();
  const filtered = current.filter((p) => p.id !== id);
  localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(filtered));
  if (getActivePaletteId() === id) {
    setActivePalette('strawberry');
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yimeo_custom_palettes_updated'));
  }
}

export function getAllPalettes(): ColorPalette[] {
  const custom = getCustomPalettes();
  const seen = new Set<string>();
  const list: ColorPalette[] = [];
  for (const p of [...PRESET_PALETTES, ...custom]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      list.push(p);
    }
  }
  return list;
}

export function getActivePaletteId(): string {
  if (typeof localStorage === 'undefined') return 'strawberry';
  return localStorage.getItem(PALETTE_KEY) || 'strawberry';
}

export function getActivePalette(): ColorPalette {
  const id = getActivePaletteId();
  const all = getAllPalettes();
  const found = all.find((p) => p.id === id);
  return found || PRESET_PALETTES[0];
}

export function setActivePalette(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PALETTE_KEY, id);
  const palette = getActivePalette();
  applyColorPalette(palette);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('yimeo_palette_updated', { detail: palette }));
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(212, 93, 121, ${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function applyColorPalette(palette?: ColorPalette): void {
  if (typeof document === 'undefined') return;
  const p = palette || getActivePalette();
  const root = document.documentElement;

  // Set CSS Custom Properties for theme variables
  root.style.setProperty('--theme-primary', p.colors.primary);
  root.style.setProperty('--theme-secondary', p.colors.secondary);
  root.style.setProperty('--theme-accent', p.colors.accent);
  root.style.setProperty('--theme-accent-hover', p.colors.accentHover);
  root.style.setProperty('--theme-bg', p.colors.bg);
  root.style.setProperty('--theme-card-bg', p.colors.cardBg);
  root.style.setProperty('--theme-light-bg', p.colors.lightBg);
  root.style.setProperty('--theme-border', p.colors.border);
  root.style.setProperty('--theme-border-light', p.colors.borderLight);
  root.style.setProperty('--theme-shadow', p.colors.shadow);
  root.style.setProperty('--theme-bubble-fill', p.colors.bubbleFill);
  root.style.setProperty('--theme-bubble-shadow', p.colors.bubbleShadow);

  // Translucent overlay & glow colors for Welcome Screen and Mascot Aura
  root.style.setProperty('--theme-bg-overlay', hexToRgba(p.colors.bg, 0.94));
  root.style.setProperty('--theme-accent-glow', hexToRgba(p.colors.accent, 0.55));
  root.style.setProperty('--theme-border-glow', hexToRgba(p.colors.borderLight, 0.55));
  root.style.setProperty('--theme-placeholder', hexToRgba(p.colors.primary, 0.65));

  // Set background color on body
  document.body.style.backgroundColor = p.colors.bg;
  document.body.style.color = p.colors.secondary;
}

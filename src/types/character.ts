export type Character = {
  id: string;
  name: string;
  avatarUrl: string | null; // Circular Avatar / Icon
  mainImageUrl?: string | null; // Main artwork for the titlehere.jpg frame
  fandom: string;
  platform: string;
  characterLink: string;
  description: string;
  tags: string[];
  notes: string;
  category: string;
  isFavorite: boolean;
  createdAt: number;
  subheader?: string;
  palette?: string[]; // 6 hex colors for the profile swatches
  likes?: number;
  selectedColorIndex?: number; // Chosen palette color index for this profile
  musicUrl?: string | null; // Audio file or URL for character profile
  musicTitle?: string | null; // Audio track title (e.g. Song - Artist)
  vinylCoverUrl?: string | null; // Custom center image for spinning vinyl disc
  vinylZoom?: number; // Zoom for vinyl center image
  vinylPanX?: number; // Pan X for vinyl center image
  vinylPanY?: number; // Pan Y for vinyl center image
};

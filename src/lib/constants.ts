export interface StylePreset {
  id: string;
  label: string;
  modifier: string;
  icon: string;
}
export const STYLE_PRESETS: StylePreset[] = [
  { id: 'none', label: 'None', modifier: '', icon: '��' },
  { id: 'cinematic', label: 'Cinematic', modifier: 'cinematic lighting, 8k, highly detailed, film grain, masterpiece', icon: '🎬' },
  { id: 'ghibli', label: 'Studio Ghibli', modifier: 'studio ghibli style, hand-drawn, whimsical, lush landscapes, anime aesthetic', icon: '☁️' },
  { id: 'cyberpunk', label: 'Cyberpunk', modifier: 'cyberpunk aesthetic, neon lighting, rainy streets, futuristic, high contrast', icon: '🌆' },
  { id: 'synthwave', label: '80s Synthwave', modifier: '80s synthwave style, retro-futuristic, neon pink and purple, grid background', icon: '🕹️' },
  { id: 'minimalist', label: 'Minimalist', modifier: 'minimalist digital art, clean lines, simple composition, flat colors', icon: '⚪' },
  { id: 'oil', label: 'Oil Painting', modifier: 'textured oil painting, thick brushstrokes, classical art style, rich colors', icon: '🎨' },
];
export const LOADING_TERMS = [
  "Crystallizing Vision", 
  "Mapping Neurons", 
  "Mixing Light", 
  "Harmonizing Latents", 
  "Forging Pixels", 
  "Edge Synthesis"
];
export const MAX_GALLERY_IMAGES = 50;
export const RATE_LIMIT_PER_MINUTE = 10;
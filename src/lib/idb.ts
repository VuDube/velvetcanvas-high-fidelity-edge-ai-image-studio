import { get, set, del, keys } from 'idb-keyval';
export interface SavedImage {
  id: string;
  prompt: string;
  url: string; // Base64
  timestamp: number;
}
const GALLERY_KEY = 'velvet_canvas_gallery';
export async function saveImage(id: string, imageData: SavedImage): Promise<void> {
  try {
    const existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    // Keep only last 50 images to avoid quota issues
    const updated = [imageData, ...existing].slice(0, 50);
    await set(GALLERY_KEY, updated);
  } catch (error) {
    console.error('IDB Save Error:', error);
  }
}
export async function getImages(): Promise<SavedImage[]> {
  try {
    return await get<SavedImage[]>(GALLERY_KEY) || [];
  } catch (error) {
    console.error('IDB Get Error:', error);
    return [];
  }
}
export async function deleteImage(id: string): Promise<void> {
  try {
    const existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    const updated = existing.filter(img => img.id !== id);
    await set(GALLERY_KEY, updated);
  } catch (error) {
    console.error('IDB Delete Error:', error);
  }
}
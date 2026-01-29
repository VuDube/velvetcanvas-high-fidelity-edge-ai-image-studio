import { get, set } from 'idb-keyval';
export interface SavedImage {
  id: string;
  prompt: string;
  url: string; // Base64
  timestamp: number;
}
const GALLERY_KEY = 'velvet_canvas_gallery_v2';
const MAX_IMAGES = 50;
export async function saveImage(id: string, imageData: SavedImage): Promise<void> {
  try {
    const existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    // Check for exact prompt duplication to prevent cluttering
    const isDuplicate = existing.some(img => img.prompt.toLowerCase() === imageData.prompt.toLowerCase());
    if (isDuplicate) {
      // Move duplicate to the front if it exists
      const filtered = existing.filter(img => img.prompt.toLowerCase() !== imageData.prompt.toLowerCase());
      const updated = [imageData, ...filtered].slice(0, MAX_IMAGES);
      await set(GALLERY_KEY, updated);
      return;
    }
    const updated = [imageData, ...existing].slice(0, MAX_IMAGES);
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
export async function getStorageInfo(): Promise<{ count: number; sizeMB: number }> {
  const images = await getImages();
  const jsonString = JSON.stringify(images);
  const sizeInBytes = new Blob([jsonString]).size;
  return {
    count: images.length,
    sizeMB: parseFloat((sizeInBytes / (1024 * 1024)).toFixed(2))
  };
}
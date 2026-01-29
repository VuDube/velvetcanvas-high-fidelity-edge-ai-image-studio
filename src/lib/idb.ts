import { get, set } from 'idb-keyval';
export interface SavedImage {
  id: string;
  prompt: string;
  url: string; // Base64
  timestamp: number;
}
const GALLERY_KEY = 'velvet_canvas_gallery_v2';
const QUEUE_KEY = 'velvet_canvas_queue_v1';
const MAX_IMAGES = 50;
export async function saveImage(id: string, imageData: SavedImage): Promise<void> {
  try {
    let existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    // Exact prompt duplication check
    const isDuplicate = existing.some(img => img.prompt.toLowerCase() === imageData.prompt.toLowerCase());
    if (isDuplicate) {
      existing = existing.filter(img => img.prompt.toLowerCase() !== imageData.prompt.toLowerCase());
    }
    let updated = [imageData, ...existing];
    // Auto-eviction: Delete 10% oldest if full
    if (updated.length > MAX_IMAGES) {
      const excess = Math.ceil(MAX_IMAGES * 0.1);
      updated = updated.slice(0, updated.length - excess);
    }
    await set(GALLERY_KEY, updated);
  } catch (error) {
    console.error('IDB Save Error:', error);
  }
}
export async function queuePrompt(prompt: string): Promise<void> {
  try {
    const existing = await get<string[]>(QUEUE_KEY) || [];
    if (!existing.includes(prompt)) {
      await set(QUEUE_KEY, [prompt, ...existing]);
    }
  } catch (error) {
    console.error('Queue Error:', error);
  }
}
export async function getQueuedPrompts(): Promise<string[]> {
  try {
    return await get<string[]>(QUEUE_KEY) || [];
  } catch (error) {
    return [];
  }
}
export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
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
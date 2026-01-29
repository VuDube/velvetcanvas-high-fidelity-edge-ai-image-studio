import { get, set } from 'idb-keyval';
import { MAX_GALLERY_IMAGES } from './constants';
export interface SavedImage {
  id: string;
  prompt: string;
  blob: Blob;
  timestamp: number;
}
const GALLERY_KEY = 'velvet_canvas_gallery_v3';
const QUEUE_KEY = 'velvet_canvas_queue_v2';
export async function saveImage(id: string, imageData: SavedImage): Promise<void> {
  try {
    let existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    // Uniqueness by prompt
    existing = existing.filter(img => img.prompt.toLowerCase() !== imageData.prompt.toLowerCase());
    let updated = [imageData, ...existing];
    // LRU Eviction
    if (updated.length > MAX_GALLERY_IMAGES) {
      updated = updated.slice(0, MAX_GALLERY_IMAGES);
    }
    await set(GALLERY_KEY, updated);
  } catch (error) {
    console.error('[IDB SAVE ERROR]', error);
  }
}
export async function queuePrompt(prompt: string): Promise<void> {
  try {
    const existing = await get<string[]>(QUEUE_KEY) || [];
    if (!existing.includes(prompt)) {
      await set(QUEUE_KEY, [prompt, ...existing]);
    }
  } catch (error) {
    console.error('[IDB QUEUE ERROR]', error);
  }
}
export async function getQueuedPrompts(): Promise<string[]> {
  try {
    return (await get<string[]>(QUEUE_KEY)) || [];
  } catch (e) {
    return [];
  }
}
export async function clearQueue(): Promise<void> {
  try {
    await set(QUEUE_KEY, []);
  } catch (e) {
    console.error('[IDB CLEAR QUEUE ERROR]', e);
  }
}
export async function getImages(): Promise<SavedImage[]> {
  try {
    return (await get<SavedImage[]>(GALLERY_KEY)) || [];
  } catch (e) {
    return [];
  }
}
export async function deleteImage(id: string): Promise<void> {
  try {
    const existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    const updated = existing.filter(img => img.id !== id);
    await set(GALLERY_KEY, updated);
  } catch (error) {
    console.error('[IDB DELETE ERROR]', error);
  }
}
export async function getStorageInfo(): Promise<{ count: number; sizeMB: number }> {
  try {
    const images = await getImages();
    let totalBytes = 0;
    images.forEach(img => { totalBytes += img.blob.size; });
    return {
      count: images.length,
      sizeMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2))
    };
  } catch (e) {
    return { count: 0, sizeMB: 0 };
  }
}
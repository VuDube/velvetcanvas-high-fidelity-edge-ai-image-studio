import { get, set } from 'idb-keyval';
export interface SavedImage {
  id: string;
  prompt: string;
  blob: Blob; // Store raw binary for efficiency
  timestamp: number;
}
const GALLERY_KEY = 'velvet_canvas_gallery_v3';
const QUEUE_KEY = 'velvet_canvas_queue_v2';
const MAX_IMAGES = 50;
export async function saveImage(id: string, imageData: SavedImage): Promise<void> {
  try {
    let existing = await get<SavedImage[]>(GALLERY_KEY) || [];
    // Remove existing with same prompt for uniqueness
    existing = existing.filter(img => img.prompt.toLowerCase() !== imageData.prompt.toLowerCase());
    let updated = [imageData, ...existing];
    // Auto-eviction: Keep it within limits
    if (updated.length > MAX_IMAGES) {
      updated = updated.slice(0, MAX_IMAGES);
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
  return (await get<string[]>(QUEUE_KEY)) || [];
}
export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
}
export async function getImages(): Promise<SavedImage[]> {
  return (await get<SavedImage[]>(GALLERY_KEY)) || [];
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
  let totalBytes = 0;
  images.forEach(img => {
    totalBytes += img.blob.size;
  });
  return {
    count: images.length,
    sizeMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2))
  };
}
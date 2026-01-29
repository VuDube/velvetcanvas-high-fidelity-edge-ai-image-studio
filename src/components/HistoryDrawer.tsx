import React, { useEffect, useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import { getImages, deleteImage, type SavedImage } from '@/lib/idb';
import { Trash2, Download, Image as ImageIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lightbox } from './Lightbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
export function HistoryDrawer({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const objectUrls = useMemo(() => {
    const map = new Map<string, string>();
    images.forEach(img => {
      map.set(img.id, URL.createObjectURL(img.blob));
    });
    return map;
  }, [images]);
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [objectUrls]);
  const loadImages = async () => {
    const data = await getImages();
    setImages(data);
  };
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    for (const id of idsToDelete) {
      await deleteImage(id);
    }
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success('Gallery optimized.');
  };
  const handleDownload = (e: React.MouseEvent, img: SavedImage) => {
    e.stopPropagation();
    const url = objectUrls.get(img.id);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `art-${img.id.slice(0, 8)}.png`;
    link.click();
  };
  const activeLightboxImage = images.find(img => img.id === selectedImageId);
  return (
    <>
      <Drawer.Root onOpenChange={(open) => open && loadImages()}>
        <Drawer.Trigger asChild>{children}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
          <Drawer.Content className="bg-zinc-950 border-t border-white/10 flex flex-col rounded-t-[40px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 outline-none">
            <div className="mx-auto w-12 h-1 rounded-full bg-zinc-800 my-4" />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vault</h2>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 text-zinc-500 font-bold">{images.length} / 50</span>
                  </div>
                  {images.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        setSelectedIds(new Set());
                      }}
                      className={cn("rounded-full px-4 text-[10px] font-black uppercase tracking-widest", selectionMode ? "bg-violet-600 text-white" : "text-zinc-400")}
                    >
                      {selectionMode ? 'Done' : 'Select'}
                    </Button>
                  )}
                </div>
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                    <ImageIcon className="w-12 h-12 opacity-10 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-30">No artifacts found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
                    <AnimatePresence>
                      {images.map((img) => (
                        <motion.div
                          layout
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => selectionMode ? toggleSelection(img.id) : setSelectedImageId(img.id)}
                          className={cn(
                            "group relative aspect-square rounded-[24px] overflow-hidden bg-zinc-900 border transition-all cursor-pointer",
                            selectionMode && selectedIds.has(img.id) ? "border-violet-500 ring-4 ring-violet-500/20" : "border-white/5"
                          )}
                        >
                          <img src={objectUrls.get(img.id)} alt="" className="w-full h-full object-cover" loading="lazy" />
                          {selectionMode && (
                            <div className={cn("absolute inset-0 flex items-center justify-center", selectedIds.has(img.id) ? "bg-violet-600/30" : "bg-black/40")}>
                               <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", selectedIds.has(img.id) ? "bg-white border-white text-violet-600" : "border-white/50")}>
                                {selectedIds.has(img.id) && <Zap className="w-3.5 h-3.5 fill-current" />}
                              </div>
                            </div>
                          )}
                          {!selectionMode && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full glass" onClick={(e) => handleDownload(e, img)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
            {selectionMode && selectedIds.size > 0 && (
              <div className="p-6 bg-zinc-900/50 backdrop-blur-xl border-t border-white/10 flex items-center justify-between pb-safe">
                <span className="text-xs font-black text-white">{selectedIds.size} ITEMS</span>
                <Button variant="destructive" onClick={handleBulkDelete} className="rounded-full px-8 font-black uppercase text-[10px]">
                  Purge Selected
                </Button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      {activeLightboxImage && (
        <Lightbox
          isOpen={!!selectedImageId}
          onClose={() => setSelectedImageId(null)}
          imageUrl={objectUrls.get(activeLightboxImage.id) || null}
          prompt={activeLightboxImage.prompt}
        />
      )}
    </>
  );
}
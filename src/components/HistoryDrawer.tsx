import React, { useEffect, useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import { getImages, deleteImage, type SavedImage } from '@/lib/idb';
import { Trash2, Download, Image as ImageIcon, Zap, Share2, Info, X } from 'lucide-react';
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
  // Manage object URLs for gallery items
  const objectUrls = useMemo(() => {
    const map = new Map<string, string>();
    images.forEach(img => {
      map.set(img.id, URL.createObjectURL(img.blob));
    });
    return map;
  }, [images]);
  // Cleanup object URLs when images change or component unmounts
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
    const count = selectedIds.size;
    for (const id of Array.from(selectedIds)) {
      await deleteImage(id);
    }
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${count} artworks purged.`);
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteImage(id);
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('Artwork deleted');
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
      <Drawer.Root onOpenChange={(open) => {
        if (open) loadImages();
        else {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }
      }}>
        <Drawer.Trigger asChild>{children}</Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
          <Drawer.Content className="bg-zinc-950 border-t border-white/10 flex flex-col rounded-t-[40px] h-[90vh] fixed bottom-0 left-0 right-0 z-50 outline-none">
            <div className="mx-auto w-16 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 my-6" />
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Gallery</h2>
                      <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Edge Vault</p>
                    </div>
                  </div>
                  {images.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectionMode(!selectionMode);
                        setSelectedIds(new Set());
                      }}
                      className={cn(
                        "rounded-full px-4 font-bold text-[11px] uppercase tracking-wider transition-all",
                        selectionMode ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400"
                      )}
                    >
                      {selectionMode ? 'Cancel' : 'Manage'}
                    </Button>
                  )}
                </div>
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-zinc-700 gap-6">
                    <ImageIcon className="w-16 h-16 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">The vault is empty</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-24">
                    <AnimatePresence>
                      {images.map((img) => (
                        <motion.div
                          layout
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => {
                            if (selectionMode) toggleSelection(img.id);
                            else setSelectedImageId(img.id);
                          }}
                          className={cn(
                            "group relative aspect-square rounded-[24px] overflow-hidden bg-zinc-900 border transition-all cursor-pointer",
                            selectionMode && selectedIds.has(img.id) ? "border-violet-500 ring-4 ring-violet-500/20 scale-95" : "border-white/5",
                            !selectionMode && "hover:border-white/20"
                          )}
                        >
                          <img
                            src={objectUrls.get(img.id)}
                            alt={img.prompt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {selectionMode && (
                            <div className={cn(
                              "absolute inset-0 flex items-center justify-center transition-colors",
                              selectedIds.has(img.id) ? "bg-violet-600/40" : "bg-black/20"
                            )}>
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                selectedIds.has(img.id) ? "bg-white border-white text-violet-600" : "border-white/50"
                              )}>
                                {selectedIds.has(img.id) && <Zap className="w-3.5 h-3.5 fill-current" />}
                              </div>
                            </div>
                          )}
                          {!selectionMode && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <div className="flex justify-between items-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-white hover:bg-white/10"
                                  onClick={(e) => handleDownload(e, img)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/20"
                                  onClick={(e) => handleDelete(e, img.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
              <motion.div 
                initial={{ y: 50 }} 
                animate={{ y: 0 }}
                className="p-6 bg-zinc-900 border-t border-white/10 flex items-center justify-between safe-area-bottom"
              >
                <span className="text-sm font-black text-white uppercase tracking-tighter">{selectedIds.size} SELECTED</span>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="rounded-full px-8 font-black uppercase tracking-widest text-xs h-12 shadow-lg"
                >
                  PURGE SELECTION
                </Button>
              </motion.div>
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
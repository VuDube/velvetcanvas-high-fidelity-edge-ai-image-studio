import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { getImages, deleteImage, type SavedImage } from '@/lib/idb';
import { Trash2, Download, Clock, Image as ImageIcon, Zap, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lightbox } from './Lightbox';
import { cn } from '@/lib/utils';
export function HistoryDrawer({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
    for (const id of Array.from(selectedIds)) {
      await deleteImage(id);
    }
    setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${selectedIds.size} images purged from edge.`);
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteImage(id);
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('Purged from edge storage');
  };
  const handleDownload = (e: React.MouseEvent, img: SavedImage) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `t2i-${img.id.slice(0, 8)}.png`;
    link.click();
  };
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
                    <div className="p-2.5 rounded-2xl bg-violet-600/20 text-violet-400">
                      <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Studio Gallery</h2>
                      <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Edge Stored • Uncensored</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                        {selectionMode ? 'Cancel' : 'Select'}
                      </Button>
                    )}
                  </div>
                </div>
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-zinc-700 gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">Your vision is a blank canvas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectionMode(true);
                          toggleSelection(img.id);
                        }}
                        onClick={() => {
                          if (selectionMode) toggleSelection(img.id);
                          else setSelectedImage(img);
                        }}
                        className={cn(
                          "group relative aspect-square rounded-[24px] overflow-hidden bg-zinc-900 border transition-all duration-300 cursor-pointer shadow-xl",
                          selectionMode && selectedIds.has(img.id) ? "border-violet-500 ring-4 ring-violet-500/20 scale-95" : "border-white/5 scale-100",
                          !selectionMode && "hover:scale-[1.02] hover:border-white/20"
                        )}
                      >
                        {/* Force exactly 256px visual style via container */}
                        <div className="w-full h-full relative">
                          <img
                            src={img.url}
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                              <p className="text-[11px] font-medium text-white/90 line-clamp-2 mb-3 leading-tight tracking-tight">
                                {img.prompt}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-8 w-8 rounded-xl glass bg-white/10"
                                  onClick={(e) => handleDownload(e, img)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-500 border-none hover:bg-rose-500 hover:text-white"
                                  onClick={(e) => handleDelete(e, img.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectionMode && selectedIds.size > 0 && (
              <div className="p-6 bg-zinc-900 border-t border-white/5 flex items-center justify-between gap-4 safe-area-bottom">
                <span className="text-sm font-black text-white uppercase tracking-tighter">{selectedIds.size} ITEMS SELECTED</span>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    className="rounded-full px-6 font-black uppercase tracking-widest text-xs h-12"
                  >
                    PURGE
                  </Button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <Lightbox
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.url || null}
        prompt={selectedImage?.prompt || ''}
      />
    </>
  );
}
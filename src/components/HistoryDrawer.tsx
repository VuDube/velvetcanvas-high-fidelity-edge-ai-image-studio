import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { getImages, deleteImage, type SavedImage } from '@/lib/idb';
import { Trash2, Download, Share2, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lightbox } from './Lightbox';
export function HistoryDrawer({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const loadImages = async () => {
    const data = await getImages();
    setImages(data);
  };
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteImage(id);
    setImages(prev => prev.filter(img => img.id !== id));
    toast.success('Removed from gallery');
  };
  const handleDownload = (e: React.MouseEvent, img: SavedImage) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `velvet-${img.id.slice(0, 8)}.png`;
    link.click();
  };
  return (
    <>
      <Drawer.Root onOpenChange={(open) => open && loadImages()}>
        <Drawer.Trigger asChild>
          {children}
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-zinc-950 border-t border-white/10 flex flex-col rounded-t-[32px] h-[85vh] fixed bottom-0 left-0 right-0 z-50 outline-none">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 my-4" />
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-400" />
                    Your Gallery
                  </h2>
                  <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-full border border-white/5">
                    {images.length}/50 stored locally
                  </span>
                </div>
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-4">
                    <ImageIcon className="w-16 h-16 opacity-10" />
                    <p>Your creative journey begins here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img) => (
                      <div 
                        key={img.id} 
                        onClick={() => setSelectedImage(img)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-lg cursor-pointer"
                      >
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <p className="text-[10px] text-white/90 line-clamp-2 mb-2 leading-tight">
                            {img.prompt}
                          </p>
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className="h-7 w-7 rounded-lg glass" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(e, img);
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="h-7 w-7 rounded-lg bg-rose-500/20 text-rose-500 border-none hover:bg-rose-500 hover:text-white" 
                              onClick={(e) => handleDelete(e, img.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
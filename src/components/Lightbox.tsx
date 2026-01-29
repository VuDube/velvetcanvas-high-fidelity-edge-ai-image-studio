import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Maximize2 } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  prompt: string;
}
export function Lightbox({ isOpen, onClose, imageUrl, prompt }: LightboxProps) {
  if (!imageUrl) return null;
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `velvet-canvas-${Date.now()}.png`;
    link.click();
    toast.success('Downloading masterpiece...');
  };
  const handleShare = async () => {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], 'artwork.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'VelvetCanvas Art',
          text: prompt,
        });
      } else {
        await navigator.clipboard.writeText(prompt);
        toast.info('Link/Prompt copied to clipboard');
      }
    } catch (e) {
      toast.error('Sharing failed');
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] h-[100vh] p-0 bg-black/95 border-none gap-0 overflow-hidden flex flex-col z-[100]">
        <DialogTitle className="sr-only">Image Viewer: {prompt}</DialogTitle>
        {/* Glass Header */}
        <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 glass bg-black/20">
          <div className="flex-1 mr-4">
            <p className="text-white text-sm font-medium line-clamp-1 opacity-80">{prompt}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-white hover:bg-white/10" 
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </header>
        {/* Zoomable Stage */}
        <div className="flex-1 relative flex items-center justify-center">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
            wheel={{ step: 0.2 }}
            doubleClick={{ mode: "reset" }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={imageUrl}
                    alt={prompt}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                </TransformComponent>
                {/* Controls Overlay */}
                <div className="absolute bottom-24 right-6 flex flex-col gap-2 z-50 md:flex-row md:bottom-8">
                   <Button variant="secondary" size="icon" className="glass rounded-full" onClick={() => zoomIn()}>
                    <span className="text-lg font-bold">+</span>
                   </Button>
                   <Button variant="secondary" size="icon" className="glass rounded-full" onClick={() => zoomOut()}>
                    <span className="text-lg font-bold">-</span>
                   </Button>
                   <Button variant="secondary" size="icon" className="glass rounded-full" onClick={() => resetTransform()}>
                    <Maximize2 className="w-4 h-4" />
                   </Button>
                </div>
              </>
            )}
          </TransformWrapper>
        </div>
        {/* Action Footer */}
        <footer className="p-6 pb-safe flex items-center justify-center gap-4 glass bg-black/40 z-50">
          <Button 
            onClick={handleShare}
            className="rounded-2xl px-6 bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
          <Button 
            onClick={handleDownload}
            className="rounded-2xl px-6 bg-violet-600 hover:bg-violet-500 text-white shadow-glow flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Save to Device</span>
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
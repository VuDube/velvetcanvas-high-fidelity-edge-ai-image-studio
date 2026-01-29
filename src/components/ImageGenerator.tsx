import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, Sparkles, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { saveImage } from '@/lib/idb';
import { chatService } from '@/lib/chat';
export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };
  useEffect(() => {
    adjustHeight();
  }, [prompt]);
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setCurrentImage(null);
    const sessionId = chatService.getSessionId();
    try {
      const response = await fetch(`/api/chat/${sessionId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }
      const data = await response.json();
      if (data.image) {
        const base64Image = `data:image/png;base64,${data.image}`;
        setCurrentImage(base64Image);
        // Save to IndexedDB for persistence
        const id = crypto.randomUUID();
        await saveImage(id, {
          id,
          prompt: prompt.trim(),
          url: base64Image,
          timestamp: Date.now()
        });
        toast.success('Masterpiece ready');
      }
    } catch (error: any) {
      console.error('Generation Error:', error);
      toast.error(error.message || 'The studio is busy, try again later.');
    } finally {
      setIsGenerating(false);
    }
  };
  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `velvet-${Date.now()}.png`;
    link.click();
  };
  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Result Area */}
      <div className="flex-1 min-h-[400px] relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-sm group shadow-2xl">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/80"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-white">Dreaming...</p>
                <p className="text-sm text-zinc-400 px-8 max-w-xs">Mixing light and shadow on the edge</p>
              </div>
            </motion.div>
          ) : currentImage ? (
            <motion.div 
              key="result"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full w-full relative"
            >
              <img 
                src={currentImage} 
                alt="Generated Art" 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="rounded-full glass" onClick={handleDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              className="h-full w-full flex flex-col items-center justify-center text-zinc-500 gap-4"
            >
              <div className="p-6 rounded-full bg-zinc-800/50">
                <ImageIcon className="w-12 h-12 opacity-20" />
              </div>
              <p className="text-sm font-medium">Describe your vision below</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Control Deck */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition" />
        <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-2 shadow-xl focus-within:ring-2 ring-violet-500/50 transition-all">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cosmic cyberpunk city in neon rain, cinematic lighting, 8k..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-600 resize-none min-h-[44px] py-3 pl-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <Button 
              size="icon" 
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
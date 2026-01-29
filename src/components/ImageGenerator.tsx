import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, Sparkles, Download, History, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { saveImage } from '@/lib/idb';
import { chatService } from '@/lib/chat';
import { HistoryDrawer } from './HistoryDrawer';
const CREATIVE_SNIPPETS = [
  "cinematic lighting, 8k, highly detailed",
  "masterpiece, ethereal, surreal digital art",
  "vaporwave aesthetic, neon colors",
  "pencil sketch, hand-drawn, minimalist",
  "macro photography, bokeh, sharp focus"
];
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
        const id = crypto.randomUUID();
        await saveImage(id, {
          id,
          prompt: prompt.trim(),
          url: base64Image,
          timestamp: Date.now()
        });
        toast.success('Masterpiece generated');
      }
    } catch (error: any) {
      console.error('Generation Error:', error);
      toast.error(error.message || 'Server is resting, try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  const randomizePrompt = () => {
    const snippet = CREATIVE_SNIPPETS[Math.floor(Math.random() * CREATIVE_SNIPPETS.length)];
    setPrompt(prev => prev ? `${prev}, ${snippet}` : snippet);
  };
  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto pb-safe">
      <div className="flex-1 min-h-[420px] relative rounded-[32px] overflow-hidden border border-white/10 bg-zinc-900/40 backdrop-blur-md group shadow-2xl">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950/90"
            >
              <div className="relative">
                <div className="w-24 h-24 border-2 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-white tracking-tight">Generating... ~3s</p>
                <p className="text-sm text-zinc-500 font-medium">Mixing light on the edge</p>
              </div>
              <div className="absolute bottom-10 left-0 right-0 px-8">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          ) : currentImage ? (
            <motion.div
              key="result"
              initial={{ scale: 0.98, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              className="h-full w-full relative"
            >
              <img
                src={currentImage}
                alt="Generated Art"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full glass h-12 w-12 shadow-xl hover:scale-110 active:scale-90 transition-transform" 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = currentImage;
                    link.download = `velvet-${Date.now()}.png`;
                    link.click();
                  }}
                >
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              className="h-full w-full flex flex-col items-center justify-center text-zinc-600 gap-6"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-violet-500/5 blur-2xl rounded-full" />
                <ImageIcon className="w-16 h-16 relative opacity-20" />
              </div>
              <p className="text-sm font-medium tracking-wide uppercase opacity-40">Your vision starts here</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-500 hover:text-white gap-2 h-9 rounded-full bg-white/5"
            onClick={randomizePrompt}
          >
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold">Randomize</span>
          </Button>
          <HistoryDrawer>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-500 hover:text-white gap-2 h-9 rounded-full bg-white/5"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold">History</span>
            </Button>
          </HistoryDrawer>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-[24px] blur-lg group-focus-within:opacity-100 opacity-0 transition-opacity" />
          <div className="relative bg-zinc-900/80 border border-white/10 rounded-[24px] p-2.5 shadow-2xl backdrop-blur-md focus-within:ring-1 ring-violet-500/50 transition-all">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cosmic cyberpunk city in neon rain..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-600 resize-none min-h-[48px] py-3.5 pl-4 text-base leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-12 px-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:brightness-110 active:scale-95 transition-all shrink-0 font-bold shadow-glow relative overflow-hidden group/btn"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Generate</span>
                    <Send className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                )}
                {!isGenerating && !prompt.trim() && (
                  <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
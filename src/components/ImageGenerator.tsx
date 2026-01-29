import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, Sparkles, History, Wand2, Maximize2, WifiOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { saveImage, queuePrompt, getQueuedPrompts, clearQueue } from '@/lib/idb';
import { chatService } from '@/lib/chat';
import { HistoryDrawer } from './HistoryDrawer';
import { Lightbox } from './Lightbox';
const CREATIVE_SNIPPETS = [
  "cinematic lighting, 8k, highly detailed",
  "masterpiece, ethereal, surreal digital art",
  "vaporwave aesthetic, neon colors",
  "pencil sketch, hand-drawn, minimalist",
  "macro photography, bokeh, sharp focus",
  "volumetric lighting, cyberpunk, hyper-realistic"
];
export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const handleStatusChange = () => {
      const status = navigator.onLine;
      setIsOnline(status);
      if (status) {
        processOfflineQueue();
      }
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);
  const processOfflineQueue = async () => {
    const queued = await getQueuedPrompts();
    if (queued.length === 0) return;
    toast.info(`Processing ${queued.length} queued prompts...`, {
      icon: <Zap className="w-4 h-4 text-orange-500" />
    });
    for (const p of queued) {
      await handleGenerate(p, true);
    }
    await clearQueue();
  };
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };
  useEffect(() => adjustHeight(), [prompt]);
  const handleGenerate = async (targetPrompt?: string, fromQueue = false) => {
    const activePrompt = targetPrompt || prompt.trim();
    if (!activePrompt || (isGenerating && !fromQueue)) return;
    if (!isOnline) {
      await queuePrompt(activePrompt);
      toast.info("Offline Queue Active", {
        description: "Your prompt is saved. We'll generate it when you're back online.",
        icon: <WifiOff className="w-4 h-4" />
      });
      return;
    }
    if (!fromQueue) setIsGenerating(true);
    if (!fromQueue) setCurrentImage(null);
    const sessionId = chatService.getSessionId();
    try {
      const response = await fetch(`/api/chat/${sessionId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: activePrompt }),
      });
      if (response.status === 429) {
        const data = await response.json();
        throw new Error(data.error || "Engine cooling down...");
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Crystallization failed');
      }
      const data = await response.json();
      if (data.image) {
        const base64Image = `data:image/png;base64,${data.image}`;
        if (!fromQueue) setCurrentImage(base64Image);
        const id = crypto.randomUUID();
        await saveImage(id, {
          id,
          prompt: activePrompt,
          url: base64Image,
          timestamp: Date.now()
        });
        if (fromQueue) {
          toast.success(`Crystallized: ${activePrompt.slice(0, 20)}...`);
        } else {
          toast.success('Masterpiece crystallized');
        }
      }
    } catch (error: any) {
      console.error('Generation Error:', error);
      toast.error(error.message || 'Server is resting, try again.');
    } finally {
      if (!fromQueue) setIsGenerating(false);
    }
  };
  const randomizePrompt = () => {
    const snippet = CREATIVE_SNIPPETS[Math.floor(Math.random() * CREATIVE_SNIPPETS.length)];
    setPrompt(prev => prev ? `${prev}, ${snippet}` : snippet);
  };
  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto pb-safe">
      <div className="flex-1 min-h-[420px] relative rounded-[40px] overflow-hidden border border-white/10 bg-zinc-900/40 backdrop-blur-xl group shadow-2xl">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950/95 z-20"
            >
              <div className="relative">
                <div className="w-32 h-32 border-4 border-violet-500/10 border-t-violet-600 rounded-full animate-spin shadow-[0_0_40px_rgba(124,58,237,0.3)]" />
                <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-black text-white tracking-tighter">CRYSTALLIZING...</p>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Mixing light on the edge</p>
              </div>
              <div className="absolute bottom-12 left-10 right-10">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-glow"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          ) : currentImage ? (
            <motion.div
              key="result"
              initial={{ scale: 1.1, opacity: 0, filter: "blur(40px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              className="h-full w-full relative cursor-zoom-in group/img"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img src={currentImage} alt="Generated Art" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
              <div className="absolute bottom-8 right-8 flex gap-3 transform translate-y-4 group-hover/img:translate-y-0 opacity-0 group-hover/img:opacity-100 transition-all duration-300">
                 <Button size="icon" variant="secondary" className="rounded-full glass h-14 w-14 shadow-2xl hover:scale-110 active:scale-90 transition-all bg-white/10">
                  <Maximize2 className="w-6 h-6 text-white" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="placeholder" className="h-full w-full flex flex-col items-center justify-center text-zinc-600 gap-8">
              <div className="relative">
                <div className="absolute -inset-10 bg-violet-600/10 blur-[80px] rounded-full animate-pulse" />
                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                   <ImageIcon className="w-12 h-12 opacity-30" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-black tracking-[0.3em] uppercase opacity-30">Studio Ready</p>
                <p className="text-sm font-medium text-zinc-500 mt-2">Enter your vision below to begin</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-white gap-2 h-10 rounded-full bg-white/5 border border-white/5 px-4"
            onClick={randomizePrompt}
          >
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-black uppercase tracking-tighter">Magic</span>
          </Button>
          <HistoryDrawer>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-white gap-2 h-10 rounded-full bg-white/5 border border-white/5 px-4"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-tighter">Gallery</span>
            </Button>
          </HistoryDrawer>
          {!isOnline && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Offline Mode</span>
            </div>
          )}
        </div>
        <div className="relative group p-1">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-violet-600/30 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-zinc-900/90 border border-white/10 rounded-[30px] p-3 shadow-2xl backdrop-blur-2xl transition-all">
            <div className="flex items-end gap-3">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your masterpiece..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-600 resize-none min-h-[56px] py-4 pl-5 text-lg font-medium leading-tight"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Button
                  size="lg"
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() || isGenerating}
                  className="h-14 px-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all shrink-0 font-black shadow-glow relative overflow-hidden group/btn"
                >
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="tracking-tighter uppercase text-sm">{isOnline ? 'Crystallize' : 'Queue'}</span>
                      <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={currentImage}
        prompt={prompt}
      />
    </div>
  );
}
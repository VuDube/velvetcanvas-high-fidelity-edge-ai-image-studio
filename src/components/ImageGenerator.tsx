import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, Sparkles, History, Wand2, Maximize2, WifiOff, Zap, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { saveImage, queuePrompt, getQueuedPrompts, clearQueue } from '@/lib/idb';
import { HistoryDrawer } from './HistoryDrawer';
import { Lightbox } from './Lightbox';
import { StylePresets, type StylePreset, STYLE_PRESETS } from './StylePresets';
const LOADING_TERMS = ["Crystallizing Vision", "Mapping Neurons", "Mixing Light", "Harmonizing Latents", "Forging Pixels", "Edge Synthesis"];
export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(STYLE_PRESETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageBlob, setCurrentImageBlob] = useState<Blob | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Revoke ObjectURL on cleanup or update
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);
  const handleGenerate = useCallback(async (targetPrompt?: string, fromQueue = false) => {
    const rawPrompt = targetPrompt || prompt.trim();
    if (!rawPrompt || (isGenerating && !fromQueue)) return;
    const fullPrompt = selectedStyle.modifier 
      ? `${rawPrompt}, ${selectedStyle.modifier}` 
      : rawPrompt;
    if (!isOnline) {
      await queuePrompt(fullPrompt);
      toast.info("Offline Queue Active", {
        description: "Your prompt is saved. We'll generate it when you're back online.",
        icon: <WifiOff className="w-4 h-4" />
      });
      return;
    }
    if (!fromQueue) setIsGenerating(true);
    if (!fromQueue) {
      setCurrentImageBlob(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'image/png'
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });
      if (response.status === 429) {
        const data = await response.json();
        throw new Error(data.error || "Engine cooling down...");
      }
      if (!response.ok) {
        throw new Error('Crystallization failed on the edge');
      }
      const blob = await response.blob();
      const newUrl = URL.createObjectURL(blob);
      if (!fromQueue) {
        setCurrentImageBlob(blob);
        setObjectUrl(newUrl);
      }
      const id = crypto.randomUUID();
      await saveImage(id, {
        id,
        prompt: rawPrompt,
        blob: blob,
        timestamp: Date.now()
      });
      if (fromQueue) {
        toast.success(`Crystallized: ${rawPrompt.slice(0, 20)}...`);
      } else {
        toast.success('Masterpiece crystallized');
      }
    } catch (error: any) {
      console.error('Generation Error:', error);
      toast.error(error.message || 'Server is resting, try again.');
    } finally {
      if (!fromQueue) setIsGenerating(false);
    }
  }, [prompt, selectedStyle, isGenerating, isOnline, objectUrl]);
  const processOfflineQueue = useCallback(async () => {
    const queued = await getQueuedPrompts();
    if (queued.length === 0) return;
    toast.info(`Processing ${queued.length} queued prompts...`, {
      icon: <Zap className="w-4 h-4 text-orange-500" />
    });
    for (const p of queued) {
      await handleGenerate(p, true);
    }
    await clearQueue();
  }, [handleGenerate]);
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) processOfflineQueue();
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [processOfflineQueue]);
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingTextIdx(prev => (prev + 1) % LOADING_TERMS.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };
  useEffect(() => adjustHeight(), [prompt]);
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
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950/95 z-20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent animate-pulse" />
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 border-t-2 border-r-2 border-violet-500 rounded-full shadow-[0_0_60px_rgba(124,58,237,0.2)]" 
                />
                <Cpu className="absolute inset-0 m-auto w-12 h-12 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2 z-10">
                <motion.p 
                  key={loadingTextIdx}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-2xl font-black text-white tracking-tighter uppercase"
                >
                  {LOADING_TERMS[loadingTextIdx]}
                </motion.p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Direct Edge Pipelining</p>
              </div>
              <div className="absolute bottom-12 left-10 right-10">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 shadow-glow"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 15, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          ) : objectUrl ? (
            <motion.div
              key="result"
              initial={{ scale: 1.05, opacity: 0, filter: "blur(20px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              className="h-full w-full relative cursor-zoom-in group/img"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img src={objectUrl} alt="Generated Art" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
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
                <p className="text-xs font-black tracking-[0.3em] uppercase opacity-30">Studio Node Idle</p>
                <p className="text-sm font-medium text-zinc-500 mt-2">Summon your imagination</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-4">
        <StylePresets selectedId={selectedStyle.id} onSelect={setSelectedStyle} />
        <div className="flex items-center gap-3 px-2">
          <HistoryDrawer>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-white gap-2 h-10 rounded-full bg-white/5 border border-white/5 px-4"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-tighter">History</span>
            </Button>
          </HistoryDrawer>
          {!isOnline && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Queue Mode</span>
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
                placeholder="Describe your vision..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-zinc-600 resize-none min-h-[56px] py-4 pl-5 text-lg font-medium leading-tight"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
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
            </div>
          </div>
        </div>
      </div>
      {objectUrl && (
        <Lightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={objectUrl}
          prompt={prompt}
        />
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Image as ImageIcon, History, Maximize2, WifiOff, Zap, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { saveImage, queuePrompt, getQueuedPrompts, clearQueue } from '@/lib/idb';
import { HistoryDrawer } from './HistoryDrawer';
import { Lightbox } from './Lightbox';
import { StylePresets } from './StylePresets';
import { LOADING_TERMS, STYLE_PRESETS, type StylePreset } from '@/lib/constants';
export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>(STYLE_PRESETS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef(prompt);
  const styleRef = useRef(selectedStyle);
  useEffect(() => { promptRef.current = prompt; }, [prompt]);
  useEffect(() => { styleRef.current = selectedStyle; }, [selectedStyle]);
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);
  const handleGenerate = useCallback(async (targetPrompt?: string, fromQueue = false) => {
    const activePrompt = targetPrompt || promptRef.current.trim();
    const activeStyle = styleRef.current;
    if (!activePrompt || (isGenerating && !fromQueue)) return;
    const fullPrompt = activeStyle.modifier
      ? `${activePrompt}, ${activeStyle.modifier}`
      : activePrompt;
    if (!navigator.onLine && !fromQueue) {
      await queuePrompt(fullPrompt);
      toast.info("Offline Queue Active", {
        description: "Prompt saved for later synchronization.",
        icon: <WifiOff className="w-4 h-4" />
      });
      return;
    }
    if (!fromQueue) {
      setIsGenerating(true);
      setObjectUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
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
      if (!response.ok) throw new Error('Edge synthesis failed');
      const blob = await response.blob();
      const newUrl = URL.createObjectURL(blob);
      if (!fromQueue) setObjectUrl(newUrl);
      const id = crypto.randomUUID();
      await saveImage(id, {
        id,
        prompt: activePrompt,
        blob: blob,
        timestamp: Date.now()
      });
      if (fromQueue) {
        toast.success(`Crystallized: ${activePrompt.slice(0, 20)}...`);
      } else {
        toast.success('Masterpiece crystallized');
      }
    } catch (error: any) {
      console.error('[GENERATOR ERROR]', error);
      toast.error(error.message || 'Server connection lost');
    } finally {
      if (!fromQueue) setIsGenerating(false);
    }
  }, [isGenerating]);
  const processOfflineQueue = useCallback(async () => {
    const queued = await getQueuedPrompts();
    if (queued.length === 0) return;
    toast.info(`Synchronizing ${queued.length} prompts...`);
    for (const p of queued) {
      await handleGenerate(p, true);
    }
    await clearQueue();
  }, [handleGenerate]);
  useEffect(() => {
    const handleStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) processOfflineQueue();
    };
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
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
      <div className="flex-1 min-h-[380px] relative rounded-[40px] overflow-hidden border border-white/10 bg-zinc-900/40 backdrop-blur-xl group shadow-2xl">
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
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-40 h-40 border-t-2 border-r-2 border-violet-500 rounded-full shadow-glow"
                />
                <Cpu className="absolute inset-0 m-auto w-12 h-12 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <motion.p
                  key={loadingTextIdx}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-2xl font-black text-white tracking-tighter uppercase"
                >
                  {LOADING_TERMS[loadingTextIdx]}
                </motion.p>
              </div>
            </motion.div>
          ) : objectUrl ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="h-full w-full relative cursor-zoom-in group/img"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img src={objectUrl} alt="Generated Art" className="w-full h-full object-contain" />
              <div className="absolute bottom-8 right-8 opacity-0 group-hover/img:opacity-100 transition-opacity">
                 <Button size="icon" variant="secondary" className="rounded-full glass h-14 w-14 shadow-2xl">
                  <Maximize2 className="w-6 h-6 text-white" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="placeholder" className="h-full w-full flex flex-col items-center justify-center text-zinc-600 gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center">
                 <ImageIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-xs font-black tracking-[0.3em] uppercase opacity-30">Studio Node Standby</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-4">
        <StylePresets selectedId={selectedStyle.id} onSelect={setSelectedStyle} />
        <div className="flex items-center gap-3 px-2">
          <HistoryDrawer>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white gap-2 h-10 rounded-full bg-white/5">
              <History className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-tighter">Vault</span>
            </Button>
          </HistoryDrawer>
          {!isOnline && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase">Queue Active</span>
            </div>
          )}
        </div>
        <div className="relative group">
          <div className="relative bg-zinc-900/90 border border-white/10 rounded-[30px] p-2 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your masterpiece..."
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white resize-none min-h-[56px] py-4 px-4 text-lg font-medium"
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
                className="h-14 px-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 font-black shadow-glow shrink-0 transition-transform active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
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
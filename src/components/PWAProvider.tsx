import React, { createContext, useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface PWAContextType {
  isInstallable: boolean;
  install: () => Promise<void>;
}
const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  install: async () => {},
});
// Fixed linting error by exporting hook separately if needed, 
// but keeping in file is okay if it's the only export besides the component.
// Re-arranged to ensure primary export is the component.
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };
  return (
    <PWAContext.Provider value={{ isInstallable: !!deferredPrompt, install }}>
      {children}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-80 z-[60]"
          >
            <div className="glass bg-zinc-950/95 border-violet-500/40 rounded-[28px] p-5 shadow-glow-lg flex flex-col gap-4 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-violet-600 to-indigo-600" />
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-violet-600 flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight">T2I UNCENSORED</h3>
                    <p className="text-[11px] text-zinc-400 font-medium leading-tight mt-0.5">Install the studio for the full edge experience.</p>
                  </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={install}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl py-6 flex items-center gap-2 shadow-glow active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                INSTALL STUDIO
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}
export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) throw new Error("usePWA must be used within PWAProvider");
  return context;
};
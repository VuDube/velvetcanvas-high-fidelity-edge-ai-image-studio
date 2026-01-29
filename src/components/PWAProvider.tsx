import React, { createContext, useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface PWAContextType {
  isInstallable: boolean;
  install: () => Promise<void>;
}
const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  install: async () => {},
});
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not already in standalone mode
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
            <div className="glass bg-zinc-900/90 border-violet-500/30 rounded-[24px] p-4 shadow-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-violet-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Add to Home Screen</h3>
                    <p className="text-xs text-zinc-400">Install for a native-like studio experience.</p>
                  </div>
                </div>
                <button onClick={() => setShowBanner(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Button 
                onClick={install}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install Now
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
}
export const usePWA = () => useContext(PWAContext);
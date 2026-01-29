import React, { createContext, useContext, useEffect, useState } from 'react';
interface PWAContextType {
  isInstallable: boolean;
  install: () => Promise<void>;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
}
export const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  install: async () => {},
  showBanner: false,
  setShowBanner: () => {},
});
export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) throw new Error("usePWA must be used within PWAProvider");
  return context;
};
export function usePWAState() {
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
  return {
    isInstallable: !!deferredPrompt,
    install,
    showBanner,
    setShowBanner
  };
}
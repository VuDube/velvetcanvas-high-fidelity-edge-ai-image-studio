import React, { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageGenerator } from '@/components/ImageGenerator';
import { Zap, Info, ShieldAlert, Download, BarChart3 } from 'lucide-react';
import { PWAProvider, usePWA } from '@/components/PWAProvider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
function Header() {
  const { isInstallable, install } = usePWA();
  return (
    <header className="w-full max-w-7xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between relative z-10 flex-shrink-0">
      <div className="flex items-center gap-4 group cursor-default">
        <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-orange-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
          <Zap className="w-8 h-8 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-500 leading-none">
            ⚡ T2I UNCENSORED
          </h1>
          <p className="text-[10px] font-black text-orange-500 tracking-[0.4em] uppercase leading-none mt-2 ml-0.5">
            SDXL EDGE STUDIO
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-wider text-violet-400 border border-violet-500/20 transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Get App</span>
          </button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-3 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white border border-transparent hover:border-white/5">
                <Info className="w-6 h-6" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-zinc-950 border-zinc-800 text-zinc-300 p-4 shadow-2xl rounded-2xl">
              <div className="space-y-3">
                <p className="font-black flex items-center gap-2 text-white uppercase text-xs tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  Edge Studio v2.5
                </p>
                <div className="h-px bg-white/5 w-full" />
                <p className="text-xs leading-relaxed text-zinc-400 font-medium">
                  Direct SDXL Base 1.0 pipeline. Uncensored creative freedom with strict 10 req/min session limits.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
export function HomePage() {
  const [stats, setStats] = useState<{ totalSessions: number } | null>(null);
  useEffect(() => {
    fetch('/api/sessions/stats')
      .then(res => res.json())
      .then(data => data.success && setStats(data.data))
      .catch(() => {});
  }, []);
  return (
    <PWAProvider>
      <div className="fixed inset-0 bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500/30 overflow-hidden">
        <ThemeToggle className="fixed top-6 right-6 z-50 opacity-0 pointer-events-none" />
        {/* Balanced Cyber-Noir Ambience */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-violet-600/10 blur-[160px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-indigo-600/10 blur-[160px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        </div>
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-2 relative z-10 overflow-y-auto scrollbar-hide">
          <ImageGenerator />
        </main>
        <footer className="w-full max-w-7xl mx-auto px-6 py-8 text-center relative z-10 flex-shrink-0">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                  {stats?.totalSessions ?? '...'} ACTIVE NODES
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Engine Optimized</span>
              </div>
            </div>
            <p className="text-[9px] text-zinc-600 font-bold tracking-[0.5em] uppercase opacity-50">
              Edge Infrastructure • 2025
            </p>
          </div>
        </footer>
        <Toaster richColors position="top-center" closeButton theme="dark" />
      </div>
    </PWAProvider>
  );
}
export default HomePage;
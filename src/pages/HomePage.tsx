import React, { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ImageGenerator } from '@/components/ImageGenerator';
import { Zap, Info, ShieldAlert, Download, Activity } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
function Header() {
  const { isInstallable, install } = usePWA();
  return (
    <header className="w-full flex items-center justify-between relative z-10 flex-shrink-0 px-2 py-6">
      <div className="flex items-center gap-4 group cursor-default">
        <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-orange-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">
              VELVET CANVAS
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-violet-600/20 text-violet-400 text-[8px] font-black uppercase border border-violet-500/20 animate-pulse">v2.5</span>
          </div>
          <p className="text-[9px] font-black text-zinc-500 tracking-[0.3em] uppercase leading-none mt-1.5">
            PRO GENERATIVE STUDIO
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider text-violet-400 border border-violet-500/20 transition-all shadow-lg active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2.5 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
                <Info className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-zinc-950 border-zinc-800 text-zinc-300 p-4 shadow-2xl rounded-2xl">
              <div className="space-y-3">
                <p className="font-black flex items-center gap-2 text-white uppercase text-xs tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  Edge Protocols
                </p>
                <div className="h-px bg-white/5 w-full" />
                <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                  Direct SDXL Base 1.0 integration. Uncensored creativity on Cloudflare Edge. Persistent local storage with binary optimization.
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
    const fetchStats = () => {
      fetch('/api/sessions/stats')
        .then(res => res.json())
        .then(data => data.success && setStats(data.data))
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500/30 overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-violet-600/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-indigo-600/5 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent bg-[length:100%_4px] animate-scanline pointer-events-none" />
      </div>
      <div className="max-w-7xl mx-auto w-full h-full px-4 sm:px-6 lg:px-8 flex flex-col relative z-10">
        <Header />
        <main className="flex-1 py-4 md:py-6 overflow-y-auto scrollbar-hide">
          <ImageGenerator />
        </main>
        <footer className="py-8 text-center flex-shrink-0">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Activity className="w-3 h-3 text-violet-500 animate-pulse" />
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">
                  {stats?.totalSessions ?? '...'} NODES ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Low Latency</span>
              </div>
            </div>
            <p className="text-[8px] text-zinc-700 font-bold tracking-[0.6em] uppercase opacity-50">
              VANILLA EDGE INFRASTRUCTURE • 2025
            </p>
          </div>
        </footer>
      </div>
      <Toaster richColors position="bottom-right" closeButton theme="dark" />
    </div>
  );
}
export default HomePage;
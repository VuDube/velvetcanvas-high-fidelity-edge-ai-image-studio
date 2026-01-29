import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageGenerator } from '@/components/ImageGenerator';
import { Zap, Info, ShieldAlert } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export function HomePage() {
  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500/30 overflow-hidden">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-violet-600/10 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>
      <header className="w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-glow-lg transition-transform group-hover:scale-105">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-500">
              T2I UNCENSORED
            </h1>
            <p className="text-[10px] font-bold text-orange-500 tracking-[0.2em] uppercase leading-none mt-1">
              SDXL Edge Engine
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2.5 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
                <Info className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-zinc-900 border-zinc-800 text-zinc-300 p-3 shadow-2xl">
              <div className="space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-white">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  Uncensored Access
                </p>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Direct text-to-image pipeline. Note: Generative AI request limits apply across all shared sessions.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-2 relative z-10 overflow-y-auto scrollbar-hide">
        <ImageGenerator />
      </main>
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center relative z-10 flex-shrink-0">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-zinc-600 font-black tracking-widest uppercase">
            Powered by Cloudflare Workers AI
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Engine Online: v2.1.0</span>
          </div>
        </div>
      </footer>
      <Toaster richColors position="top-center" closeButton theme="dark" />
    </div>
  );
}
export default HomePage;
import React, { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageGenerator } from '@/components/ImageGenerator';
import { Sparkles, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-500/30">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full" />
      </div>
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            VelvetCanvas
          </h1>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white">
                <Info className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs bg-zinc-900 border-zinc-800 text-zinc-300">
              <p>High-fidelity image generation powered by SDXL on Cloudflare Edge AI.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <ImageGenerator />
      </main>
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-xs text-zinc-500 font-medium">
          Note: AI request limits apply. Powered by Cloudflare Workers AI.
        </p>
      </footer>
      <Toaster richColors position="top-center" />
    </div>
  );
}
export default HomePage;
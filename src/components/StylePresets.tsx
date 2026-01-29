import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { STYLE_PRESETS, type StylePreset } from '@/lib/constants';
interface StylePresetsProps {
  selectedId: string;
  onSelect: (preset: StylePreset) => void;
}
export function StylePresets({ selectedId, onSelect }: StylePresetsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide pb-2">
      <div className="flex items-center gap-3 px-1">
        {STYLE_PRESETS.map((style) => (
          <motion.button
            key={style.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(style)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 border text-xs font-black uppercase tracking-tighter relative",
              selectedId === style.id
                ? "bg-violet-600 border-violet-400 text-white shadow-glow"
                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <span>{style.icon}</span>
            <span>{style.label}</span>
            {selectedId === style.id && (
              <motion.div 
                layoutId="active-pill" 
                className="absolute inset-0 rounded-full border-2 border-violet-400/50 pointer-events-none" 
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
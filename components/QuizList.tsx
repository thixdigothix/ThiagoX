'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Top10Item } from '@/lib/types';
import { Check, Lock } from 'lucide-react';

interface QuizListProps {
  items: Top10Item[];
  isDevMode?: boolean;
}

export default function QuizList({ items, isDevMode }: QuizListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
      {items.map((item, index) => (
        <motion.div
          key={item.rank}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`relative group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
            item.revealed 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-white/5 border-white/5'
          }`}
        >
          {/* Rank Number */}
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm italic ${
              item.revealed ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'
            }`}>
              {item.rank}
            </div>
            
            {/* Content */}
            <div className="flex flex-col">
              <span className={`font-bold transition-all ${
                item.revealed || isDevMode ? 'text-white' : 'text-white/10 blur-[4px]'
              }`}>
                {item.revealed || isDevMode ? item.name : '??????????????'}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-mono transition-all ${
                item.revealed || isDevMode ? 'text-white/40' : 'text-transparent'
              }`}>
                {item.revealed || isDevMode ? item.value : ''}
              </span>
            </div>
          </div>

          {/* Reveal Indicator */}
          <div className="flex items-center gap-3">
             {item.revealedBy && (
               <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/10 uppercase ${
                 item.revealedBy === 'player1' ? 'text-orange-400' : 'text-blue-400'
               }`}>
                 {item.revealedBy === 'player1' ? 'P1' : 'P2'}
               </span>
             )}
            
            <div className={`p-2 rounded-full ${
              item.revealed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/10'
            }`}>
              {item.revealed ? <Check size={16} /> : <Lock size={16} />}
            </div>
          </div>
          
          {/* Progress hint if dev mode */}
          {isDevMode && !item.revealed && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-xl border border-blue-500/20 pointer-events-none" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

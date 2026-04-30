'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, RotateCcw, Trophy, Brain, Target, User, Users } from 'lucide-react';
import { GameMode, GameState, QuizTopic, Top10Item } from '@/lib/types';
import { PREDEFINED_TOPICS, generateTop10List, getCustomTopics } from '@/lib/gemini';
import QuizList from '@/components/QuizList';
import Link from 'next/link';

import { Suspense } from 'react';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const topicId = searchParams.get('topic');
  const mode = (searchParams.get('mode') as GameMode) || GameMode.SOLO;
  const isDevModeParam = searchParams.get('dev') === 'true';

  const [topic, setTopic] = useState<QuizTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState<GameState>({
    mode,
    topic: null,
    score: { player1: 0, player2: 0 },
    currentPlayer: 'player1',
    isGameOver: false,
    attempts: 0,
    lastGuessResult: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTopic() {
      if (!topicId) return;
      setLoading(true);
      
      try {
        // 1. Check custom topics first (client-side storage)
        const custom = getCustomTopics();
        const customTopic = custom.find(t => t.id === topicId);
        
        if (customTopic) {
          setTopic(customTopic);
        } else {
          // 2. Check predefined topics
          const predefined = PREDEFINED_TOPICS.find(t => t.id === topicId);
          if (predefined) {
            const data = await generateTop10List(topicId, predefined.title);
            setTopic(data);
          }
        }
      } catch (error) {
        console.error("Failed to load topic", error);
      } finally {
        setLoading(false);
      }
    }
    loadTopic();
  }, [topicId]);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !topic || gameState.isGameOver) return;

    const normalizedGuess = guess.toLowerCase().trim();
    // Smart validation: check name AND aliases
    const foundIndex = topic.items.findIndex(
      item => {
        if (item.revealed) return false;
        
        const nameMatch = item.name.toLowerCase().includes(normalizedGuess) || 
                         normalizedGuess.includes(item.name.toLowerCase());
        
        const aliasMatch = item.aliases?.some(alias => 
          alias.toLowerCase().includes(normalizedGuess) || 
          normalizedGuess.includes(alias.toLowerCase())
        );

        return nameMatch || aliasMatch;
      }
    );

    if (foundIndex !== -1) {
      const foundItem = topic.items[foundIndex];
      const points = 11 - foundItem.rank;
      
      const updatedItems = [...topic.items];
      updatedItems[foundIndex] = { 
        ...foundItem, 
        revealed: true, 
        revealedBy: gameState.currentPlayer 
      };

      setTopic({ ...topic, items: updatedItems });
      
      setGameState(prev => ({
        ...prev,
        score: {
          ...prev.score,
          [prev.currentPlayer]: prev.score[prev.currentPlayer] + points
        },
        lastGuessResult: 'hit',
        attempts: prev.attempts + 1,
        // In versus, switch player after hit to keep it moving
        currentPlayer: prev.mode === GameMode.VERSUS ? (prev.currentPlayer === 'player1' ? 'player2' : 'player1') : 'player1'
      }));

      // Check if all revealed
      if (updatedItems.every(i => i.revealed)) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    } else {
      setGameState(prev => ({
        ...prev,
        lastGuessResult: 'miss',
        attempts: prev.attempts + 1,
        currentPlayer: prev.mode === GameMode.VERSUS ? (prev.currentPlayer === 'player1' ? 'player2' : 'player1') : 'player1'
      }));
    }

    setGuess('');
    inputRef.current?.focus();

    // Reset result message after delay
    setTimeout(() => {
      setGameState(prev => ({ ...prev, lastGuessResult: null }));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-white/40 font-mono text-sm tracking-widest uppercase">Consultando Gemini AI...</p>
        </div>
      </div>
    );
  }

  if (!topic) return <div>Erro ao carregar tópico.</div>;

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-[-10%] ${gameState.currentPlayer === 'player1' ? 'left-[-10%]' : 'right-[-10%]'} w-[60%] h-[60%] transition-all duration-1000 ${
          gameState.currentPlayer === 'player1' ? 'bg-orange-600/10' : 'bg-blue-600/10'
        } rounded-full blur-[140px]`} />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Top Controls */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-mono uppercase tracking-widest">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {gameState.mode === GameMode.VERSUS && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Users size={14} className="text-blue-400" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-white/60">Modo Versus</span>
              </div>
            )}
            <button 
               onClick={() => router.refresh()}
               className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{topic.title}</h1>
            <p className="text-white/40 text-sm max-w-lg mx-auto">{topic.description}</p>
          </div>

          {/* Scores Overview */}
          <div className="flex justify-center items-stretch gap-4 md:gap-6">
            <motion.div 
              animate={{ scale: gameState.currentPlayer === 'player1' ? 1.05 : 0.95, opacity: gameState.currentPlayer === 'player1' ? 1 : 0.5 }}
              className={`flex-1 p-6 rounded-3xl border transition-colors ${
                gameState.currentPlayer === 'player1' ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-xl ${gameState.currentPlayer === 'player1' ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'}`}>
                  <User size={20} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Jogador 1</span>
                <span className="text-4xl font-black text-orange-500">{gameState.score.player1}</span>
              </div>
            </motion.div>

            {gameState.mode === GameMode.VERSUS && (
              <motion.div 
                animate={{ scale: gameState.currentPlayer === 'player2' ? 1.05 : 0.95, opacity: gameState.currentPlayer === 'player2' ? 1 : 0.5 }}
                className={`flex-1 p-6 rounded-3xl border transition-colors ${
                  gameState.currentPlayer === 'player2' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/5'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-xl ${gameState.currentPlayer === 'player2' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white'}`}>
                    <User size={20} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Jogador 2</span>
                  <span className="text-4xl font-black text-blue-500">{gameState.score.player2}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="relative max-w-xl mx-auto">
            <form onSubmit={handleGuess} className="relative group">
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={gameState.isGameOver ? "Fim de Jogo!" : "Digite seu palpite..."}
                disabled={gameState.isGameOver}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-14 text-xl font-bold focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20">
                <Brain size={24} />
              </div>
              <button 
                type="submit"
                disabled={gameState.isGameOver || !guess.trim()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-orange-500 text-black transition-all group disabled:opacity-0 hover:scale-105 active:scale-95"
              >
                <Send size={18} fill="currentColor" />
              </button>
            </form>

            {/* Feedback Message */}
            <AnimatePresence>
              {gameState.lastGuessResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    gameState.lastGuessResult === 'hit' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  }`}
                >
                  {gameState.lastGuessResult === 'hit' ? 'Acerto!' : 'Tente Novamente!'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* List Display */}
          <div className="pt-8">
            <QuizList items={topic.items} isDevMode={isDevModeParam} />
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-8 py-12">
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Palpites</span>
                <span className="font-bold">{gameState.attempts}</span>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Revelados</span>
                <span className="font-bold">{topic.items.filter(i => i.revealed).length} / 10</span>
             </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-[40px] text-center space-y-8 shadow-[0_0_80px_rgba(249,115,22,0.1)]"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-yellow-500/20 blur-[40px] rounded-full" />
                <div className="relative p-6 bg-yellow-500 rounded-3xl text-black">
                  <Trophy size={48} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase italic">
                  {gameState.mode === GameMode.VERSUS 
                    ? (gameState.score.player1 > gameState.score.player2 
                        ? 'Jogador 1 Venceu!' 
                        : gameState.score.player2 > gameState.score.player1 
                          ? 'Jogador 2 Venceu!' 
                          : 'Empate!')
                    : 'Vitória!'}
                </h2>
                <p className="text-white/40 text-sm">
                  {gameState.mode === GameMode.VERSUS 
                    ? 'O desafio de elite chegou ao fim.' 
                    : 'Você completou a lista com maestria.'}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 flex justify-around">
                <div className="text-center">
                  <p className="text-[10px] font-mono text-white/30 uppercase mb-1">P1 Score</p>
                  <p className="text-3xl font-black text-orange-500">{gameState.score.player1}</p>
                </div>
                {gameState.mode === GameMode.VERSUS && (
                  <>
                    <div className="w-px h-full bg-white/10" />
                    <div className="text-center">
                      <p className="text-[10px] font-mono text-white/30 uppercase mb-1">P2 Score</p>
                      <p className="text-3xl font-black text-blue-500">{gameState.score.player2}</p>
                    </div>
                  </>
                )}
                <div className="w-px h-full bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] font-mono text-white/30 uppercase mb-1">Tentativas</p>
                  <p className="text-3xl font-black">{gameState.attempts}</p>
                </div>
              </div>

              <button 
                onClick={() => router.push('/')}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg hover:bg-orange-500 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] hover:text-white"
              >
                Jogar Novamente
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}


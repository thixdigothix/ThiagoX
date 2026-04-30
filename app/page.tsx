'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, User, Play, Info, Star, Plus, Loader2, Sparkles, Wand2, Search, Link as LinkIcon, X } from 'lucide-react';
import { PREDEFINED_TOPICS, getCustomTopics, saveCustomTopic, generateTop10List, suggestRandomTopic } from '@/lib/gemini';
import { GameMode, QuizTopic } from '@/lib/types';
import Link from 'next/link';

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.SOLO);
  const [customTopics, setCustomTopics] = useState<QuizTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [userInput, setUserInput] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');

  useEffect(() => {
    setCustomTopics(getCustomTopics());
  }, []);

  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatusMessage('IA pesquisando no Google...');
    
    try {
      const topicId = `custom-${Date.now()}`;
      const newTopic = await generateTop10List(topicId, userInput);
      
      saveCustomTopic(newTopic);
      setCustomTopics(getCustomTopics());
      setUserInput('');
      setStatusMessage('Lista criada com sucesso!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error("Erro ao criar tema", error);
      setStatusMessage('Erro ao gerar lista. Tente um tema mais popular.');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setStatusMessage('Buscando conteúdo do site...');
    try {
      const res = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: userInput })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatusMessage('IA processando dados...');
      const topicId = `custom-${Date.now()}`;
      const newTopic = await generateTop10List(topicId, "Importado de Link", data.content);
      
      saveCustomTopic(newTopic);
      setCustomTopics(getCustomTopics());
      setUserInput('');
      setStatusMessage('Importado com sucesso!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setStatusMessage('Erro ao importar link.');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggest = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setStatusMessage('Pensando em algo...');
    try {
      const title = await suggestRandomTopic();
      setUserInput(title);
      setActiveTab('create');
      setStatusMessage('');
    } catch (error) {
      setStatusMessage('Erro ao sugerir.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteTopic = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = customTopics.filter(t => t.id !== id);
    setCustomTopics(updated);
    localStorage.setItem('custom_topics', JSON.stringify(updated));
  };

  const allTopics = [...customTopics, ...PREDEFINED_TOPICS];

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 lg:py-20">
        {/* Header Section */}
        <header className="mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono tracking-[0.2em] text-orange-500 uppercase font-semibold">Quiz de Elite</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-6 shadow-glow">
              Top 10 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-200">Cultura Pop</span>
            </h1>
          </motion.div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-8">
            {/* Mode Toggle */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button 
                onClick={() => setSelectedMode(GameMode.SOLO)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${selectedMode === GameMode.SOLO ? 'bg-orange-500 text-black font-bold' : 'text-white/40 hover:text-white'}`}
              >
                <User size={18} /> Solo
              </button>
              <button 
                onClick={() => setSelectedMode(GameMode.VERSUS)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${selectedMode === GameMode.VERSUS ? 'bg-blue-500 text-white font-bold' : 'text-white/40 hover:text-white'}`}
              >
                <Users size={18} /> Versus
              </button>
            </div>

            {/* AI Generator Box */}
            <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wider italic">Gerador de Listas</h3>
                </div>
                <button onClick={handleSuggest} className="text-[10px] font-mono uppercase text-white/30 hover:text-orange-500 transition-colors">Sugerir</button>
              </div>

              <div className="flex gap-2 border-b border-white/5 pb-2">
                <button onClick={() => setActiveTab('create')} className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-all ${activeTab === 'create' ? 'text-orange-500 border-b border-orange-500' : 'text-white/30'}`}>Criar Tema</button>
                <button onClick={() => setActiveTab('import')} className={`text-[10px] font-mono uppercase tracking-widest pb-1 transition-all ${activeTab === 'import' ? 'text-blue-500 border-b border-blue-500' : 'text-white/30'}`}>Importar URL</button>
              </div>

              <form onSubmit={activeTab === 'create' ? handleCreateTheme : handleImportUrl} className="space-y-4">
                <div className="relative group">
                  {activeTab === 'create' ? <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" /> : <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />}
                  <input 
                    type={activeTab === 'create' ? 'text' : 'url'}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={activeTab === 'create' ? "Ex: Melhores Vilões da Disney..." : "Cole um link da web..."}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
                <button 
                  disabled={isGenerating || !userInput.trim()}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase italic text-xs tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Gerar com IA'}
                </button>
              </form>

              {statusMessage && (
                <p className="text-center text-[10px] font-mono uppercase tracking-widest text-emerald-500 animate-pulse">{statusMessage}</p>
              )}
            </div>
          </div>

          {/* Topic List */}
          <div className="lg:col-span-7">
            <h2 className="text-xs font-mono uppercase tracking-widest text-white/40 mb-4 px-2">Listas Disponíveis</h2>
            <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {allTopics.map((topic, index) => (
                <motion.div key={topic.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link 
                    href={`/game?topic=${topic.id}&mode=${selectedMode}`}
                    className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      topic.id.startsWith('custom-') ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/[0.03] border-white/5'
                    } hover:border-white/20`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-black text-white/10 group-hover:text-orange-500/30 transition-colors">{(index + 1).toString().padStart(2, '0')}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{topic.title}</h3>
                          {topic.id.startsWith('custom-') && (
                            <>
                              <div className="w-1 h-1 rounded-full bg-purple-500" />
                              <button onClick={(e) => deleteTopic(topic.id, e)} className="p-1 text-white/10 hover:text-red-500 transition-colors"><X size={12} /></button>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{topic.description}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 text-white/20 group-hover:text-white transition-all">
                      <Play size={16} fill="currentColor" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
          <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest uppercase">
             <span>Gemini 1.5 Flash</span>
             <div className="w-px h-4 bg-white/10" />
             <span>Google Search Grounding Ready</span>
          </div>
          <div className="text-[10px] font-mono tracking-wider uppercase">© 2026 TOP 10 • V2.5</div>
        </footer>
      </div>

      <style jsx global>{`
        .shadow-glow { text-shadow: 0 0 40px rgba(0,0,0,0.5); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </main>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useRoomStore } from '@/lib/store';
import { Navigation } from '@/components/global/navigation';
import { Footer } from '@/components/global/footer';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Award, X, Search, Activity, BookOpen, Layers, Plus } from 'lucide-react';

export default function FFCSMode() {
  const navigate = useNavigate();
  const { rooms } = useRoomStore();
  const [compareRooms, setCompareRooms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState<number | null>(null);

  const allRooms = Object.values(rooms);
  const filteredRooms = useMemo(() =>
    allRooms.filter(r => r.id.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12),
    [allRooms, searchQuery]
  );

  const compareData = compareRooms.map(id => allRooms.find(r => r.id === id)!).filter(Boolean);

  const addRoom = (roomId: string) => {
    if (compareRooms.length < 3 && !compareRooms.includes(roomId)) {
      setCompareRooms([...compareRooms, roomId]);
    }
    setShowSearch(null);
    setSearchQuery('');
  };

  const removeRoom = (idx: number) => {
    setCompareRooms(compareRooms.filter((_, i) => i !== idx));
  };

  const scores = compareData.map(r => ({
    id: r.id,
    // Add safe access since the user's template referenced mock properties we assume exist on `Room` definition
    // Defaulting missing metrics to a random high 80-99 value for prototype aesthetics
    total: (((r as any).metrics?.download || 85) * 0.35) + (((r as any).metrics?.latency ? 100 - (r as any).metrics.latency : 90) * 0.25) + 85 * 0.15 + 90 * 0.15 + 95 * 0.1,
    wifi: (r as any).metrics?.download || 85,
    quiet: 88,
    ac: 95,
    sockets: 90
  }));
  
  const bestPick = scores.length >= 2 ? scores.reduce((a, b) => a.total > b.total ? a : b) : null;

  function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div className="mb-4">
        <div className="flex justify-between text-[9px] mb-2 font-mono uppercase tracking-widest text-white/30">
          <span>{label}</span>
          <span style={{ color }}>{Math.floor(value)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen noise-overlay bg-obsidian" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Remove absolute positioning inside Navigation for proper document flow if necessary, but existing Navbar works */}
      <Navigation />

      <div className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Studio Header System */}
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 border-b border-white/5 pb-12">
            <div>
              <motion.button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-10 text-[10px] uppercase tracking-[0.3em] font-bold text-white/30" whileHover={{ x: -4, color: 'rgba(255,255,255,1)' }}>
                <ArrowLeft size={12} /> Dashboard
              </motion.button>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase mb-6 leading-[0.9] text-white">
                Fully Flexible Credit System <br /><span className="text-white/20 italic font-mono lowercase">Drafted.</span>
              </h1>
              <div className="flex items-center gap-10">
                <p className="font-mono text-[10px] text-white/20 tracking-[0.2em] flex items-center gap-3 uppercase">
                  <BookOpen size={12} className="text-amber-500" /> FFCS OPTIMIZATION
                </p>
                <p className="font-mono text-[10px] text-white/20 tracking-[0.2em] flex items-center gap-3 uppercase">
                  <Layers size={12} className="text-emerald-500" /> SLOT COMPARISON
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="block mb-2 opacity-30 text-[9px] uppercase tracking-[0.3em] font-bold">Module Status</span>
              <div className="font-mono text-xl text-white/60 uppercase">INTELLIGENCE MODE // ON</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[0, 1, 2].map(slotIdx => {
              const room = compareData[slotIdx];
              return (
                <div key={slotIdx}>
                  <AnimatePresence mode="wait">
                    {room ? (
                      <motion.div
                        className="group relative p-10 rounded-[2.5rem] border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        {/* Header Badge */}
                        {bestPick?.id === room.id && (
                          <div className="absolute top-0 right-0 p-8">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] uppercase tracking-widest font-bold flex items-center gap-2">
                              <Award size={10} /> Optimal Choice
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-10 pt-2">
                          <h3 className="text-3xl font-black tracking-tight text-white/90">
                            {room.block} <span className="text-white/20 ml-2">{room.name}</span>
                          </h3>
                          <button onClick={() => removeRoom(slotIdx)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                            <X size={14} className="text-white/20 group-hover:text-white" />
                          </button>
                        </div>

                        <div className="space-y-6 mb-12">
                          <StatBar label="Network Velocity" value={scores[slotIdx].wifi} color="#22D3EE" />
                          <StatBar label="Acoustic Buffer" value={scores[slotIdx].quiet} color="#A78BFA" />
                          <StatBar label="Thermal Logic" value={scores[slotIdx].ac} color="#34D399" />
                          <StatBar label="Power Density" value={scores[slotIdx].sockets} color="#FBBF24" />
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <span className="text-[9px] text-white/20 block mb-2 uppercase tracking-widest font-bold">Composite Score</span>
                          <span className="text-5xl font-black tracking-tighter italic" style={{
                            color: scores[slotIdx]?.total > 60 ? '#34D399' : scores[slotIdx]?.total > 40 ? '#FBBF24' : '#FB7185',
                          }}>
                            {scores[slotIdx]?.total.toFixed(0)}<span className="text-xl opacity-20 ml-1">/100</span>
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-12 rounded-[2.5rem] bg-white/[0.01] border border-white/5 min-h-[440px] flex flex-col items-center justify-center transition-all hover:bg-white/[0.02]">
                        {showSearch === slotIdx ? (
                          <div className="w-full">
                            <div className="relative mb-6">
                              <input
                                className="w-full bg-[#111115] border border-white/10 rounded-xl px-12 py-4 font-mono text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                placeholder="Search space index..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                autoFocus
                              />
                              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            </div>
                            <div className="max-h-[250px] overflow-auto space-y-2 no-scrollbar pr-2">
                              {filteredRooms.map(r => (
                                <motion.button
                                  key={r.id}
                                  onClick={() => addRoom(r.id)}
                                  className="w-full text-left p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center justify-between hover:bg-white/10 transition-colors group"
                                  whileHover={{ x: 4 }}
                                >
                                  <span className="font-mono text-sm text-white/60 group-hover:text-white transition-colors">{r.id}</span>
                                  <div className="flex gap-4 opacity-30 group-hover:opacity-60">
                                    <Activity size={12} />
                                    <Zap size={12} />
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => setShowSearch(slotIdx)}
                            className="flex flex-col items-center gap-6 group w-full h-full justify-center"
                            whileHover={{ y: -5 }}
                          >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                              <Plus size={32} className="text-white/10 group-hover:text-amber-500 transition-colors" />
                            </div>
                            <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Initialize Node {slotIdx + 1}</span>
                          </motion.button>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {bestPick && compareData.length >= 2 && (
            <motion.div className="p-12 rounded-[2.5rem] bg-white/[0.01] border border-white/5 shadow-2xl relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Zap size={40} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-emerald-400 mb-4 block uppercase tracking-[0.4em] text-[10px] font-bold">Optimal Selection Decision</h3>
                  <p className="text-2xl text-white/70 leading-relaxed font-medium">
                    Node <span className="text-white font-bold">{bestPick.id}</span> demonstrates the highest infrastructure yielding a composite reliability score of <span className="text-emerald-400 italic font-black text-3xl ml-2">✦ {bestPick.total.toFixed(2)}</span>.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
      <Footer />
    </motion.div>
  );
}

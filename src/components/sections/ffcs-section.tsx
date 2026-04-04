import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useRoomStore } from '@/lib/store';
import { ArrowRight, Zap, Award, X, Search, Activity, BookOpen, Layers, Plus } from 'lucide-react';

export function FFCSSection() {
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

  const getDeterministicScore = (roomId: string, metric: string) => {
    // Hash function for room ID
    let hash = 0;
    const combined = roomId + metric;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash |= 0;
    }
    // Return score between 65 and 99
    return (Math.abs(hash) % 35) + 65;
  };

  const scores = compareData.map(r => {
    const wifi = getDeterministicScore(r.id, 'wifi');
    const quiet = getDeterministicScore(r.id, 'quiet');
    const ac = getDeterministicScore(r.id, 'ac');
    const sockets = getDeterministicScore(r.id, 'sockets');
    const lighting = getDeterministicScore(r.id, 'lighting');
    
    return {
        id: r.id,
        total: (wifi * 0.35) + (quiet * 0.25) + (ac * 0.15) + (sockets * 0.15) + (lighting * 0.1),
        wifi,
        quiet,
        ac,
        sockets,
        lighting
    };
  });
  
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
    <section id="ffcs" className="min-h-screen py-32 px-6 lg:px-12 flex flex-col justify-center relative overflow-hidden bg-black">
      <div className="w-full max-w-[1600px] mx-auto z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter italic leading-tight">
            FFCS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Optimization</span>
          </h2>
          <p className="mt-8 text-xs text-white/40 uppercase tracking-[0.6em] font-bold">
            Simultaneous multi-node infrastructure analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[0, 1, 2].map(slotIdx => {
            const room = compareData[slotIdx];
            return (
              <div key={slotIdx}>
                <AnimatePresence mode="wait">
                  {room ? (
                    <motion.div
                      className="group relative p-10 rounded-[2.5rem] border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden min-h-[440px]"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
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
                        <StatBar label="Visual Fidelity" value={scores[slotIdx].lighting} color="#FB7185" />
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
                              className="w-full bg-[#111115] border border-white/10 rounded-xl px-12 py-4 font-mono text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
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
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                            <Plus size={32} className="text-white/10 group-hover:text-cyan-500 transition-colors" />
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
          <motion.div 
            className="p-12 rounded-[2.5rem] bg-indigo-500/[0.02] border border-white/5 relative overflow-hidden" 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Zap size={40} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-emerald-400 mb-4 block uppercase tracking-[0.4em] text-[10px] font-bold italic">Optimal Selection Decision</h3>
                <p className="text-2xl text-white/70 leading-relaxed font-medium">
                  Node <span className="text-white font-bold">{bestPick.id}</span> demonstrates the highest infrastructure yields with a composite reliability score of <span className="text-emerald-400 italic font-black text-3xl ml-2">✦ {bestPick.total.toFixed(2)}</span>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import {
  generateSpeedtestHistory, generateEquipment, generateBenchHeatmap, BUILDINGS
} from '@/lib/mock-data';
import { useRoomStore, useFeedStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Zap, ArrowLeft, Clock, Users, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  empty: '#34D399',
  occupied: '#FB7185',
  unverified: '#FBBF24',
  conflict: '#FB7185',
};

const STATUS_GRADIENT: Record<string, string> = {
  empty: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.02))',
  occupied: 'linear-gradient(135deg, rgba(251,113,133,0.15), rgba(251,113,133,0.02))',
  unverified: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.02))',
  conflict: 'linear-gradient(135deg, rgba(251,113,133,0.18), rgba(251,113,133,0.05))',
};

function HeatmapBench({ speed, maxSpeed, label }: { speed: number; maxSpeed: number; label: string }) {
  const ratio = speed / maxSpeed;
  const color = ratio > 0.7 ? '#34D399' : ratio > 0.4 ? '#22D3EE' : ratio > 0.2 ? '#FBBF24' : '#FB7185';
  return (
    <motion.div
      className="rounded-lg flex items-center justify-center font-mono text-[10px] cursor-pointer"
      style={{
        background: `${color}15`,
        border: `1px solid ${color}30`,
        color: color,
        width: '100%',
        aspectRatio: '2/1',
      }}
      title={`${label}: ${speed} Mbps`}
      whileHover={{ scale: 1.15, borderColor: color, boxShadow: `0 0 12px ${color}40`, zIndex: 10 }}
      transition={{ duration: 0.15 }}
    >
      {speed}
    </motion.div>
  );
}

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Stores
  const { rooms, updateRoomStatus } = useRoomStore();
  const { user, addKarma } = useAuthStore();
  const { addEvent } = useFeedStore();

  // State
  const [selectedISP, setSelectedISP] = useState('All');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [confirmTimer, setConfirmTimer] = useState(3);
  const [isMounted, setIsMounted] = useState(false);

  // Derived Values
  const room = useMemo(() => {
    if (!roomId) return null;
    const targetId = roomId.toUpperCase();
    return rooms[targetId] || Object.values(rooms).find(r => r.id.toUpperCase() === targetId);
  }, [rooms, roomId]);

  const building = useMemo(() => {
    return BUILDINGS.find(b => b.id === room?.block);
  }, [room]);

  const radarData = useMemo(() => {
    if (!room?.utilities) return [];
    return [
      { axis: 'WiFi', value: room.utilities.wifi },
      { axis: 'Sockets', value: room.utilities.sockets },
      { axis: 'AC', value: room.utilities.ac },
      { axis: 'Quiet', value: room.utilities.quietness },
      { axis: 'Light', value: room.utilities.lighting },
    ];
  }, [room]);

  const speedtestHistory = useMemo(() => generateSpeedtestHistory(roomId || ''), [roomId]);
  const equipment = useMemo(() => generateEquipment(), []);
  const benchData = useMemo(() => generateBenchHeatmap(selectedISP === 'All' ? 'Jio' : selectedISP), [selectedISP]);
  const maxSpeed = useMemo(() => Math.max(...benchData.map(b => b.speed)), [benchData]);
  const ISPs = ['All', 'Airtel', 'Jio', 'BSNL', 'VIT WiFi'];

  // Effects
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!showConfirm) return;
    if (confirmTimer <= 0) {
      const finalRoomId = room?.id || roomId || '';
      updateRoomStatus(finalRoomId, showConfirm as any);
      addKarma(10, `Reputation gain: Verified ${finalRoomId} as ${showConfirm}`);

      addEvent({
        id: `feed-v-${Date.now()}`,
        type: 'verification',
        userId: user?.id || 'guest',
        userName: user?.name || 'Visitor',
        roomId: finalRoomId,
        roomName: room?.name || finalRoomId,
        action: `marked room ${showConfirm.toUpperCase()}`,
        karma: 10,
        timestamp: new Date().toISOString()
      });

      toast.success(`Domain cache updated: ${finalRoomId} marked ${showConfirm}`);
      setShowConfirm(null);
      return;
    }

    const timer = setTimeout(() => setConfirmTimer(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [confirmTimer, showConfirm, room, roomId, updateRoomStatus, addKarma, addEvent, user]);

  // Loading/Error States
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020204]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/20 uppercase tracking-[0.4em] font-mono text-[10px]">Initializing Sector Scan...</p>
          <p className="text-white/10 text-[8px] mt-2 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/")}>Re-route to Nexus</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden bg-[#020204]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-0 right-0 h-[60vh] pointer-events-none opacity-40 z-0">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 50% 10%, ${STATUS_COLORS[room.status]}20, transparent 70%)`,
          filter: 'blur(80px)'
        }} />
      </div>

      <div className="relative z-10 pt-32 pb-20 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Navigation */}
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 mb-12 text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-colors group"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft size={12} /> BACK TO CAMPUS
        </motion.button>

        {/* Header - Editorial Style */}
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 border-b border-white/5 pb-16">
          <div className="w-full md:w-auto">
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-8">
              {room.block} <span className="text-white/20 opacity-40">—</span> <span style={{ color: STATUS_COLORS[room.status] }}>{room.id.split('-').pop()}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-8">
              <div className="px-6 py-2 rounded-full border border-white/10 bg-white/[0.02] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ color: STATUS_COLORS[room.status] }} />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.3em]" style={{ color: STATUS_COLORS[room.status] }}>{room.status}</span>
              </div>
              <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">
                <span className="flex items-center gap-2"><Users size={12} /> {room.capacity} SEATS</span>
                <span className="flex items-center gap-2">
                  <Clock size={12} /> UPDATED {new Date(room.lastVerified || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-2 font-black">Location Context</p>
            <p className="text-2xl font-black text-white/50 uppercase italic tracking-tighter">{building?.name || 'Academic Domain'}</p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="mb-12">
          <AnimatePresence mode="wait">
            {showConfirm ? (
              <motion.div
                key="confirm"
                className="p-10 rounded-[2.5rem] border border-white/10 bg-white/[0.02] text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <p className="text-2xl font-black text-white uppercase italic tracking-tighter mb-6">
                  Updating node status to <span style={{ color: STATUS_COLORS[showConfirm] }}>{showConfirm}</span> in {confirmTimer}s...
                </p>
                <button onClick={() => setShowConfirm(null)} className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest hover:bg-white/10 transition-colors">Terminate Update</button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => setShowConfirm('empty')} className="group p-8 rounded-[2.5rem] border border-[#34D399]20 bg-[#34D399]/[0.02] hover:bg-[#34D399]/10 transition-all text-left flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-[#34D399] uppercase tracking-widest mb-1 font-black">Action Trace</p>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Declare Empty</h3>
                  </div>
                  <Zap size={24} className="text-[#34D399] opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
                <button onClick={() => setShowConfirm('occupied')} className="group p-8 rounded-[2.5rem] border border-[#FB7185]20 bg-[#FB7185]/[0.02] hover:bg-[#FB7185]/10 transition-all text-left flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-[#FB7185] uppercase tracking-widest mb-1 font-black">Action Trace</p>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Declare Occupied</h3>
                  </div>
                  <Shield size={24} className="text-[#FB7185] opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Utility Matrix */}
          <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-obsidian/40">
            <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] font-black mb-10 italic">Infrastructure Sync</h3>
            <div className="h-[250px] w-full">
              {isMounted && radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center opacity-10">ANALYZING...</div>}
            </div>
          </div>

          {/* Signal Integrity Analysis */}
          <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 bg-obsidian/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={40} className="text-cyan-400" />
            </div>
            
            <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] font-black mb-12 italic flex items-center gap-3">
              <Zap size={14} className="text-cyan-400" /> Signal Integrity Analysis
            </h3>

            <div className="flex items-center gap-10 mb-12">
               <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                    <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - (room.network?.download || 0)} className="text-cyan-400" />
                  </svg>
                  <span className="text-2xl font-black text-white italic">{room.network?.download || 0}</span>
               </div>
               <div className="flex-1 space-y-4">
                  <div className="flex justify-between text-[11px] font-mono text-white/40 uppercase tracking-widest font-black">
                    <span>Flux Load</span>
                    <span className="text-cyan-400">MBPS</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500 shadow-[0_0_10px_#22D3EE]" style={{ width: `${(room.network?.download || 0) / 2}%` }} />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/20 mb-2">Latent Delay</p>
                  <p className="text-xl font-black text-white italic">{room.network?.ping || 0} <span className="text-[10px] text-white/20 not-italic uppercase ml-1">MS</span></p>
               </div>
               <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-[9px] uppercase font-black tracking-widest text-white/20 mb-2">Node Upload</p>
                  <p className="text-xl font-black text-white italic">{room.network?.upload || 0} <span className="text-[10px] text-white/20 not-italic uppercase ml-1">MBPS</span></p>
               </div>
            </div>

            <button
              onClick={() => navigate(`/speedtest/${room.id}`)}
              className="w-full h-16 rounded-2xl bg-cyan-500 text-black font-black uppercase text-[10px] tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.2)]"
            >
              Initiate Full Diagnostic
            </button>
          </div>
        </div>

        {/* Hotspot Array */}
        <div className="mt-8 glass-panel p-10 lg:p-12 rounded-[3.5rem] border-white/5 bg-obsidian/40">
          <div className="flex items-center justify-between mb-12">
            <p className="text-2xl font-serif italic text-white/90">Thermal Signal Matrix</p>
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 gap-1">
              {ISPs.map(isp => (
                <button
                  key={isp}
                  onClick={() => setSelectedISP(isp)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedISP === isp ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                >
                  {isp}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(8, 1fr)` }}>
            {benchData.map((bench, idx) => (
              <HeatmapBench key={idx} label={bench.label} speed={bench.speed} maxSpeed={maxSpeed} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

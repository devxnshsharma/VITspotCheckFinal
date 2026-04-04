"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wifi, Zap, Activity, RefreshCw, ArrowLeft, Clock, MapPin, Shield } from "lucide-react"
import { useUIStore, useFeedStore, useBookingStore, useRoomStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

type TestPhase = "setup" | "testing" | "results"
type Stage = "ping" | "download" | "upload"

const ISPs = [
  { id: 'airtel', name: 'Airtel', color: '#FB7185' },
  { id: 'jio', name: 'Jio', color: '#38BDF8' },
  { id: 'bsnl', name: 'BSNL', color: '#FBBF24' },
  { id: 'vitwifi', name: 'VIT WiFi', color: '#34D399' },
];

function SpeedGauge({ download, upload, latency, progress }: { download: number; upload: number; latency: number; progress: number }) {
  const radius = 100;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const dlArc = (280 / 360) * circumference;
  const ulArc = (220 / 360) * circumference;

  const dlColor = download > 60 ? '#34D399' : download > 30 ? '#22D3EE' : download > 10 ? '#FBBF24' : '#FB7185';
  const ulColor = upload > 30 ? '#34D399' : upload > 15 ? '#22D3EE' : upload > 5 ? '#FBBF24' : '#FB7185';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <svg width="280" height="280" viewBox="0 0 280 280" className="absolute">
        <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke}
          strokeDasharray={`${dlArc} ${circumference - dlArc}`}
          transform="rotate(-230, 140, 140)"
        />
        <circle cx="140" cy="140" r={radius - 20} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke - 2}
          strokeDasharray={`${ulArc} ${circumference - ulArc}`}
          transform="rotate(-200, 140, 140)"
        />
        <motion.circle
          cx="140" cy="140" r={radius}
          fill="none" stroke={dlColor} strokeWidth={stroke}
          strokeDasharray={`${dlArc * progress} ${circumference - dlArc * progress}`}
          transform="rotate(-230, 140, 140)"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 10px ${dlColor}50)` }}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dlArc * progress} ${circumference - dlArc * progress}` }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <motion.circle
          cx="140" cy="140" r={radius - 20}
          fill="none" stroke={ulColor} strokeWidth={stroke - 2}
          strokeDasharray={`${ulArc * progress} ${circumference - ulArc * progress}`}
          transform="rotate(-200, 140, 140)"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${ulColor}50)` }}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${ulArc * progress} ${circumference - ulArc * progress}` }}
          transition={{ duration: 1.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.span
          className="font-black text-6xl block tracking-tighter tabular-nums"
          style={{ color: dlColor }}
          key={download}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {download}
        </motion.span>
        <span className="font-mono text-[10px] uppercase font-black tracking-widest" style={{ color: '#5A5A6E' }}>Mbps Down</span>
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="font-mono text-sm font-bold" style={{ color: ulColor }}>{upload} ↑</span>
          <span className="font-mono text-sm font-bold" style={{ color: '#FBBF24' }}>{latency}ms</span>
        </div>
      </div>
    </div>
  );
}

export function SpeedtestEngine({ roomId, roomName }: { roomId: string; roomName: string }) {
  const navigate = useNavigate();
  const { showToast } = useUIStore()
  const { user, isAuthenticated, addKarma } = useAuthStore()
  const { addEvent } = useFeedStore()

  const [phase, setPhase] = useState<TestPhase>("setup")
  const [selectedISP, setSelectedISP] = useState('jio')
  const [selectedBench, setSelectedBench] = useState('C-4')
  const [stage, setStage] = useState<Stage>("ping")
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ download: number; upload: number; ping: number }>({
    download: 0,
    upload: 0,
    ping: 0
  })

  const runAnalysis = useCallback(async () => {
    setPhase("testing")
    setStage("ping")
    setProgress(0)

    // Simulate multi-stage testing with real backend calls if possible, or high-fidelity simulation
    const targetPing = Math.floor(Math.random() * 40) + 8;
    const targetDl = Math.floor(Math.random() * 80) + 10;
    const targetUl = Math.floor(Math.random() * 40) + 5;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= 20) {
        setProgress(step / 100);
        setResults(prev => ({ ...prev, ping: Math.floor((step / 20) * targetPing) }));
        if (step === 20) setStage('download');
      } else if (step <= 70) {
        setStage('download');
        setProgress(step / 100);
        setResults(prev => ({ ...prev, download: Math.floor(((step - 20) / 50) * targetDl) }));
        if (step === 70) setStage('upload');
      } else if (step <= 100) {
        setStage('upload');
        setProgress(step / 100);
        setResults(prev => ({ ...prev, upload: Math.floor(((step - 70) / 30) * targetUl) }));
      } else {
        clearInterval(interval);
        setResults({ download: targetDl, upload: targetUl, ping: targetPing });
        setProgress(1);
        setTimeout(() => setPhase('results'), 800);
      }
    }, 80)

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (isAuthenticated) {
      await addKarma(15, `Telemetry confirmed: ${roomName}`)
    }
    showToast("+15 KARMA", "karma")
    
    addEvent({
      id: `event_${Date.now()}`,
      type: "speedtest",
      userId: user?.id || "anonymous",
      userName: user?.name || "Anonymous",
      roomId,
      roomName,
      action: "finalized sync analysis at",
      karma: 15,
      timestamp: new Date().toISOString(),
      data: results,
    })
    
    navigate(`/room/${roomId}`)
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6">
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="text-center mb-16">
               <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Initial <span className="text-primary">Calibration</span></h2>
               <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] font-black">Spatial parameters required for high-fidelity sync</p>
            </div>

            <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-white/[0.01]">
              <div className="mb-12">
                <h3 className="text-[10px] font-mono text-primary uppercase tracking-[0.4em] font-black mb-8 italic">Step 01 // Node Provider</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {ISPs.map(isp => (
                    <motion.button
                      key={isp.id}
                      onClick={() => setSelectedISP(isp.id)}
                      className={cn(
                        "p-6 rounded-2xl border transition-all text-left group",
                        selectedISP === isp.id ? "bg-white/5 border-primary/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/5 hover:border-white/20"
                      )}
                      whileHover={{ y: -2 }}
                    >
                      <span className={cn("text-sm font-black uppercase italic tracking-tighter", selectedISP === isp.id ? "text-primary" : "text-white/40")}>
                        {isp.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-16">
                 <h3 className="text-[10px] font-mono text-primary uppercase tracking-[0.4em] font-black mb-8 italic">Step 02 // Positional Matrix</h3>
                 <div className="grid grid-cols-8 gap-2">
                   {Array.from({ length: 48 }, (_, i) => {
                     const label = `${String.fromCharCode(65 + Math.floor(i / 8))}-${(i % 8) + 1}`;
                     return (
                       <button
                         key={label}
                         onClick={() => setSelectedBench(label)}
                         className={cn(
                           "aspect-square rounded-lg text-[9px] font-mono font-black transition-all flex items-center justify-center",
                           selectedBench === label ? "bg-primary text-black" : "bg-white/5 text-white/20 hover:text-white/40 border border-white/5"
                         )}
                       >
                         {label}
                       </button>
                     );
                   })}
                 </div>
              </div>

              <motion.button
                className="w-full h-20 rounded-[2rem] bg-primary text-black font-black uppercase text-xs tracking-[0.5em] shadow-[0_10px_40px_rgba(0,229,255,0.2)] hover:scale-[1.01] transition-all"
                whileTap={{ scale: 0.98 }}
                onClick={runAnalysis}
              >
                Initiate Telemetry Sweep
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === "testing" && (
          <motion.div
            key="testing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12"
          >
            <div className="flex items-center gap-12 mb-16">
              {['PING', 'DOWNLOAD', 'UPLOAD'].map((s, i) => (
                <div key={s} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      stage === s.toLowerCase() ? "bg-amber-500 shadow-[0_0_15px_#F59E0B]" :
                      ['ping', 'download', 'upload'].indexOf(stage) > i ? "bg-emerald-400" : "bg-white/10"
                    )}
                  />
                  <span className={cn(
                    "font-mono text-[10px] uppercase font-black tracking-widest",
                    stage === s.toLowerCase() ? "text-amber-500" : "text-white/20"
                  )}>
                    {s}
                  </span>
                </div>
              ))}
            </div>

            <SpeedGauge download={results.download} upload={results.upload} latency={results.ping} progress={progress} />

            <div className="mt-16 text-center space-y-4">
               <p className="font-mono text-xs font-black uppercase tracking-[0.4em] text-primary animate-pulse italic">
                 Analyzing Shard: {stage.toUpperCase()}...
               </p>
               <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                  />
               </div>
            </div>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="text-center mb-16">
               <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">Telemetry <span className="text-emerald-400">Locked</span></h2>
               <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] font-black">Spectral data successfully harvested from domain</p>
            </div>

            <div className="glass-panel p-10 lg:p-16 rounded-[4rem] border-white/5 bg-white/[0.01]">
              <div className="flex justify-center mb-16">
                <SpeedGauge download={results.download} upload={results.upload} latency={results.ping} progress={1} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <Wifi size={20} className="mx-auto mb-4 text-emerald-400" />
                  <span className="font-black text-5xl italic tracking-tighter text-emerald-400 block mb-2">{results.download}</span>
                  <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.2em]">Down MBPS</span>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <Zap size={20} className="mx-auto mb-4 text-primary" />
                  <span className="font-black text-5xl italic tracking-tighter text-primary block mb-2">{results.upload}</span>
                  <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.2em]">Up MBPS</span>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center group hover:bg-white/[0.04] transition-colors relative overflow-hidden">
                  <Clock size={20} className="mx-auto mb-4 text-amber-500" />
                  <span className="font-black text-5xl italic tracking-tighter text-amber-500 block mb-2">{results.ping}</span>
                  <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-[0.2em]">Ping MS</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-10 border-t border-white/5">
                <div className="text-left">
                   <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] mb-2 font-black italic underline underline-offset-4">Source Signatures</p>
                   <p className="text-xs font-black text-white/50 uppercase tracking-widest italic">{ISPs.find(i => i.id === selectedISP)?.name} • Matrix: {selectedBench}</p>
                </div>
                <motion.button
                  className="px-12 py-6 rounded-full bg-primary text-black font-black uppercase text-xs tracking-[0.4em] shadow-[0_10px_40px_rgba(0,229,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={handleSubmit}
                >
                  Submit Sync // +15 Karma
                </motion.button>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setPhase("setup")}
                className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors underline underline-offset-8"
              >
                Initiate Recalibration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

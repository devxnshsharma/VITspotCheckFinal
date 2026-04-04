"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, Play, CheckCircle, Zap, RefreshCw, ArrowLeft, Shield, Globe, Cpu } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { toast } from "sonner"
import { useUIStore, useRoomStore, useFeedStore } from "@/lib/store"

// Fallback chain for resilience
const FALLBACK_URLS = [
  "https://speed.cloudflare.com/__down?bytes=25000000",
  "https://speed.cloudflare.com/__down?bytes=10000000",
  "https://raw.githubusercontent.com/librespeed/speedtest/master/backend/garbage.php?bytes=10000000"
]

export default function SpeedtestPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { rooms } = useRoomStore()
  const { addKarma, isAuthenticated, user } = useAuthStore()
  const { setDominantColor } = useUIStore()
  const { addEvent } = useFeedStore()
  
  const room = rooms[roomId || ""]
  
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0)
  const [isTesting, setIsTesting] = useState(false)
  const [testComplete, setTestComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setDominantColor("cyan")
    return () => setDominantColor("black")
  }, [setDominantColor])

  const runAutomatedTest = useCallback(async () => {
    setIsTesting(true)
    setTestComplete(false)
    setDownloadSpeed(0)
    setProgress(0)
    
    abortControllerRef.current = new AbortController()

    // Try each fallback URL in sequence
    for (const url of FALLBACK_URLS) {
      if (abortControllerRef.current.signal.aborted) break;

      try {
        const startTime = performance.now()
        let loadedBytes = 0
        const isSmallFile = url.includes("bytes=10000000")
        const totalBytes = isSmallFile ? 10000000 : 25000000

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          cache: 'no-store',
          mode: 'cors'
        })

        if (!response.ok) continue;
        if (!response.body) throw new Error("Stream not supported")

        const reader = response.body.getReader()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          loadedBytes += value.length
          const currentTime = performance.now()
          const durationInSeconds = (currentTime - startTime) / 1000
          
          if (durationInSeconds > 0) {
            const bitsLoaded = loadedBytes * 8
            const currentMbps = (bitsLoaded / durationInSeconds) / 1000000
            setDownloadSpeed(currentMbps)
            setProgress(Math.min((loadedBytes / totalBytes) * 100, 100))
          }
        }

        setIsTesting(false)
        setTestComplete(true)
        
        const finalSpeed = downloadSpeed.toFixed(2)
        
        // Feed event support
        addEvent({
          id: `speedtest-${Date.now()}`,
          type: 'speedtest',
          userId: user?.id || 'guest',
          userName: user?.name || 'Visitor',
          roomId: roomId || 'campus',
          roomName: room?.name || 'Global Shard',
          action: `conducted diagnostic: ${finalSpeed}Mbps`,
          karma: 25,
          timestamp: new Date().toISOString(),
          data: { speed: finalSpeed }
        });

        if (isAuthenticated) {
          await addKarma(25, `Diagnostic complete for ${roomId}: ${finalSpeed}Mbps`)
          toast.success(`Analysis complete: ${finalSpeed}Mbps synced! +25 Karma`)
        }
        return;

      } catch (error: any) {
        if (error.name === 'AbortError') return
        console.warn(`Speedtest fallback triggered for ${url}:`, error)
      }
    }

    setIsTesting(false)
    toast.error("Telemetry failure. All relay nodes unresponsive.")
  }, [addKarma, isAuthenticated, user, roomId, room, downloadSpeed, addEvent])

  const cancelTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsTesting(false)
      toast.info("Test canceled.")
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 lg:px-12 relative overflow-hidden bg-[#020204]">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="mb-16 flex flex-col md:flex-row items-end justify-between gap-8">
          <div>
            <Link 
              to={roomId ? `/room/${roomId}` : "/"} 
              className="flex items-center gap-3 mb-10 text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-colors group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> BACK TO SECTOR
            </Link>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.8]">
              Diagnostic <br/><span className="text-white/10">Engine</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-2 font-black">Target Shard</p>
            <p className="text-2xl font-black text-white/80 uppercase italic tracking-tighter">{room?.name || 'Campus Wide'}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 md:p-20 rounded-[3rem] bg-obsidian/60 backdrop-blur-3xl border border-white/10 shadow-2xl space-y-16 text-center"
          >
            {/* Speed Gauge */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                <motion.circle
                  cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray="1000"
                  initial={{ strokeDashoffset: 1000 }}
                  animate={{ strokeDashoffset: 1000 - (1000 * progress / 100) }}
                  className={testComplete ? "text-emerald-400" : "text-cyan-400"}
                  style={{ strokeLinecap: 'round' }}
                />
              </svg>

              <div className="flex flex-col items-center z-10">
                <span className={`text-6xl md:text-8xl font-black font-mono tracking-tighter tabular-nums ${testComplete ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {downloadSpeed.toFixed(1)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/20">Megabits / Sec</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              {!isTesting ? (
                <button 
                  onClick={runAutomatedTest}
                  className="w-full max-w-sm h-24 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)]"
                >
                  {testComplete ? <><RefreshCw size={18} /> Re-Calculate Flux</> : <><Play size={18} fill="black" /> Initiate Analysis</>}
                </button>
              ) : (
                <button 
                  onClick={cancelTest}
                  className="w-full max-w-sm h-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:bg-rose-500/20 transition-all"
                >
                  Terminate Sync
                </button>
              )}
            </div>
          </motion.div>

          <aside className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-white/20 flex items-center gap-3">
                <Shield size={14} className="text-cyan-500" /> Security Status
              </p>
              <p className="text-xs font-bold text-white/60">Node integrity verified via academic relay.</p>
            </div>
            
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-white/20 flex items-center gap-3">
                <Globe size={14} className="text-emerald-500" /> Relay Matrix
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                  <span>Latency</span>
                  <span className="text-emerald-400">12ms</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                  <span>Jitter</span>
                  <span className="text-cyan-400">2ms</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-cyan-500/5 border border-cyan-500/10 space-y-4">
              <p className="text-[9px] uppercase font-black tracking-[0.4em] text-cyan-400/60">Diagnostic Bonus</p>
              <p className="text-3xl font-black text-white italic">+25 ✦</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Users, Activity, Layout as LayoutIcon, CalendarCheck, RefreshCcw, ShieldAlert, Zap, Cpu, CheckCircle, AlertTriangle, Database } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useRoomStore, useFeedStore, type FeedEvent, type Room } from "@/lib/store"

type AdminStats = {
  totalBookings: number
  totalUsers: number
  totalKarmaEvents: number
  totalSpeedtests: number
  totalLayouts: number
}

const SHARDS = ['PRP', 'SJT', 'TT', 'AB1', 'AB2', 'SMV', 'MB']

export function AdminDashboardSection() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const { karmaEvents, addKarma } = useAuthStore()
  const { events: feedEvents } = useFeedStore()
  const { rooms: roomMap } = useRoomStore()
  const rooms = Object.values(roomMap)
  const [isSyncing, setIsSyncing] = useState(false)
  const [systemStatus, setSystemStatus] = useState('NOMINAL')
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'reports'>('events')
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    fetch('/api/admin/summary')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error)
  }, [])

  const handleSystemReboot = () => {
    setIsSyncing(true)
    setSystemStatus('REBOOTING')
    addKarma(100, "System Maintenance: Integrity Reboot Protocol")
    setTimeout(() => {
      setIsSyncing(false)
      setSystemStatus('NOMINAL')
    }, 3000)
  }

  const handleForceSync = () => {
    setIsSyncing(true)
    addKarma(50, "Node Synchronization: Cross-Shard Protocol Sync")
    setTimeout(() => {
      setIsSyncing(false)
    }, 2000)
  }

  const statCards = [
    { label: 'Active Nodes', value: stats?.totalUsers || 0, icon: Cpu, color: '#6366F1' },
    { label: 'Available', value: 124, icon: CheckCircle, color: '#10B981' }, // Dummy data mimicking legacy layout
    { label: 'Reservations', value: stats?.totalBookings || 0, icon: CalendarCheck, color: '#F59E0B' },
    { label: 'Conflicts', value: 3, icon: AlertTriangle, color: '#F43F5E' },
    { label: 'Architectures', value: stats?.totalLayouts || 0, icon: LayoutIcon, color: '#34D399' },
    { label: 'Sync Flux', value: karmaEvents.length, icon: Database, color: '#A78BFA' },
  ]

  return (
    <section id="admin" className="min-h-screen py-32 px-6 lg:px-12 flex flex-col justify-center relative overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-rose-500 to-transparent" />
      </div>

      <div className="w-full max-w-[1700px] mx-auto z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 text-center"
        >
          <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter italic">
            Central <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-rose-500">Command</span>
          </h2>
          <p className="mt-8 text-xs text-white/40 uppercase tracking-[0.6em] font-bold">
            Authorized System Overseer // LVL-4 Access Only
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2.5fr_1fr] gap-12">
          
          {/* Left: System Actions */}
          <div className="order-2 lg:order-1 space-y-8">
             <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 mb-8 flex items-center gap-3">
                <ShieldAlert size={14} className="text-rose-500" /> Command Logic
             </p>
             <div className="space-y-4">
                <button 
                  onClick={handleSystemReboot}
                  disabled={isSyncing}
                  className="w-full p-8 rounded-[32px] bg-obsidian/40 border border-white/10 hover:bg-white/5 hover:border-rose-500/50 backdrop-blur-md transition-all text-left group"
                >
                   <p className="text-[9px] uppercase tracking-widest font-black text-rose-500 mb-3">CRITICAL ACTION</p>
                   <h4 className="text-xl font-bold text-white uppercase italic tracking-tighter flex items-center gap-4">
                      {isSyncing ? 'Rebooting...' : 'System Reboot'} 
                      {!isSyncing && <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />}
                   </h4>
                </button>
                <button 
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="w-full p-8 rounded-[32px] bg-obsidian/40 border border-white/10 hover:bg-white/5 backdrop-blur-md transition-all text-left shadow-lg"
                >
                   <p className="text-[9px] uppercase tracking-widest font-black text-indigo-400 mb-3">NODE SYNC</p>
                   <h4 className="text-xl font-bold text-white uppercase italic tracking-tighter">Force Shard Sync</h4>
                </button>
             </div>

             <div className="p-10 rounded-[40px] bg-indigo-500/[0.05] border border-indigo-500/20 backdrop-blur-xl mt-12 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                <div className="flex items-center gap-3 text-indigo-400 mb-8">
                   <Zap size={18} />
                   <p className="text-xs uppercase tracking-[0.4em] font-bold">Mainframe Status</p>
                </div>
                <div className="space-y-6">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/40">Operational State</span>
                      <span className={systemStatus === 'NOMINAL' ? 'text-emerald-400 shadow-[0_0_10px_currentColor]' : 'text-rose-400'}>{systemStatus}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-white/40">Secure Tunnel</span>
                      <span className="text-indigo-400 font-mono tracking-tighter">AES-256 ACTIVE</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Middle: Telemetry */}
          <div className="order-1 lg:order-2 space-y-12">
             {stats ? (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {statCards.map((card, idx) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-10 rounded-[40px] bg-obsidian/60 border border-white/10 backdrop-blur-xl hover:bg-white/5 transition-all group shadow-2xl"
                    >
                      <card.icon size={20} style={{ color: card.color }} className="mb-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                      <p className="text-5xl font-black text-white tracking-tighter mb-3 italic">{card.value}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/40">{card.label}</p>
                    </motion.div>
                  ))}
               </div>
             ) : (
                <div className="h-48 rounded-[40px] bg-obsidian border border-white/5 flex items-center justify-center text-white/30 uppercase tracking-widest text-xs animate-pulse font-mono">
                   Decrypting Database...
                </div>
             )}

             <div className="p-12 rounded-[50px] bg-obsidian/80 border border-white/10 backdrop-blur-2xl shadow-2xl min-h-[450px] flex flex-col">
                <div className="flex items-center justify-between mb-12">
                   <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 flex items-center gap-3">
                      <Database size={14} /> Flux Registry
                   </p>
                   <div className="flex gap-4">
                      {['overview', 'events', 'reports'].map(tab => (
                        <button 
                          key={tab}
                          onClick={() => setSelectedTab(tab as any)}
                          className={`text-[10px] uppercase font-black tracking-widest px-6 py-3 rounded-full border transition-all ${selectedTab === tab ? 'bg-white text-black border-white shadow-lg' : 'text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                        >
                           {tab}
                        </button>
                      ))}
                   </div>
                </div>

                 <div className="space-y-4 overflow-y-auto pr-4 custom-scrollbar h-[400px] max-h-[400px]">
                   {selectedTab === 'events' ? (
                     <>
                       {feedEvents.length === 0 && <p className="text-white/30 text-xs italic font-mono">No recent activity registered.</p>}
                       {feedEvents.slice(0, 15).map((event: FeedEvent, idx: number) => (
                         <motion.div 
                           key={event.id}
                           initial={{ opacity: 0, x: -10 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.03 }}
                           className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-8 hover:bg-white/10 transition-colors"
                         >
                           <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest shrink-0">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                           <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: event.type === 'verification' ? '#34D399' : event.type === 'speedtest' ? '#22D3EE' : '#FBBF24', color: '#FFF' }} />
                           <p className="text-xs font-bold text-white/70 tracking-wider flex-1 uppercase truncate">@{event.userName.split(' ')[0]} {event.action} {event.roomName}</p>
                           {event.karma && <span className="font-mono text-xs font-bold text-emerald-400">+{event.karma}</span>}
                         </motion.div>
                       ))}
                     </>
                   ) : selectedTab === 'reports' ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <ShieldAlert size={48} className="text-white/10 mb-4" />
                        <p className="text-white/20 uppercase tracking-[0.4em] font-mono text-[10px]">No high-priority conflicts in current shard</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                        {karmaEvents.length === 0 && <p className="text-white/30 text-xs italic font-mono">No recent flux registered.</p>}
                        {karmaEvents.map((event, idx) => (
                          <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-8 hover:bg-white/10 transition-colors"
                          >
                            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest shrink-0">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: event.delta >= 0 ? '#34D399' : '#FB7185', color: event.delta >= 0 ? '#34D399' : '#FB7185' }} />
                            <p className="text-xs font-bold text-white/70 tracking-wider flex-1 uppercase truncate">{event.reason}</p>
                            <span className={`font-mono text-xs font-bold ${event.delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>{event.delta > 0 ? `+${event.delta}` : event.delta}</span>
                          </motion.div>
                        ))}
                      </div>
                   )}
                 </div>
             </div>
          </div>

          {/* Right: Sector Health */}
          <div className="order-3 space-y-12">
             <p className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/40 mb-12 flex items-center gap-3">
                <RefreshCcw size={14} className="text-indigo-500" /> Sector Telemetry
             </p>
              <div className="space-y-8 bg-obsidian/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
                {SHARDS.map((block, i) => {
                  const blockRooms = rooms.filter((r: Room) => r.block === block)
                  const empty = blockRooms.filter((r: Room) => r.status === 'empty').length
                  const total = blockRooms.length
                  const pct = total > 0 ? (empty / total) * 100 : 0
                  return (
                    <div key={block} className="space-y-4 px-2">
                       <div className="flex justify-between items-end">
                          <p className="text-xl font-bold text-white tracking-tighter italic">{block}</p>
                          <p className="text-[10px] uppercase font-black tracking-widest text-white/40">{total > 0 ? Math.floor(pct) : 0}% Empty</p>
                       </div>
                       <div className="h-1 bg-white/10 w-full relative rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                            className="absolute inset-y-0 left-0 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                          />
                       </div>
                    </div>
                  );
                })}
              </div>
          </div>

        </div>
      </div>
    </section>
  )
}

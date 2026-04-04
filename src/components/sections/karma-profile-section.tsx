"use client"

import { useAuthStore } from "@/lib/auth-store"
import { motion } from "framer-motion"
import { ShieldAlert, Verified, Star, Fingerprint, Award, TrendingUp, Zap, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { LEADERBOARD } from "@/lib/mock-data"
import { useFeedStore, type FeedEvent } from "@/lib/store"

const TRUST_TIERS: Record<string, { label: string; range: string; color: string; weight: number }> = {
  OBSERVER: { label: 'Observer', range: '0', color: '#94A3B8', weight: 1.0 },
  SPOTTER: { label: 'Spotter', range: '100', color: '#34D399', weight: 1.2 },
  NAVIGATOR: { label: 'Navigator', range: '500', color: '#3B82F6', weight: 1.5 },
  ARCHITECT: { label: 'Architect', range: '1500', color: '#A855F7', weight: 2.0 },
  ORACLE: { label: 'Oracle', range: '3000', color: '#F59E0B', weight: 3.0 }
}

const TIER_ORDER = ['OBSERVER', 'SPOTTER', 'NAVIGATOR', 'ARCHITECT', 'ORACLE'] as const

export function KarmaProfileSection() {
  const { user, isAuthenticated, karmaEvents } = useAuthStore()
  const { events: feedEvents } = useFeedStore()
  const [leaderboardTab, setLeaderboardTab] = useState<'weekly' | 'alltime'>('alltime')
  const [leaderboard, setLeaderboard] = useState<any[]>(LEADERBOARD)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setLeaderboard(data))
      .catch(console.error)
  }, [])

  if (!hasMounted || !isAuthenticated || !user) return null

  // Process data from user
  const currentTier = (user.trustTier?.toUpperCase() || 'OBSERVER') as keyof typeof TRUST_TIERS
  const tierInfo = TRUST_TIERS[currentTier] || TRUST_TIERS['OBSERVER']
  const currentTierIdx = TIER_ORDER.indexOf(currentTier as any)
  const nextTier = currentTierIdx < 4 ? TRUST_TIERS[TIER_ORDER[currentTierIdx + 1]] : null
  const currentThreshold = parseInt(tierInfo.range)
  const nextThreshold = nextTier ? parseInt(nextTier.range) : (user?.karma || 0)
  const diff = nextThreshold - currentThreshold
  const rawProgress = diff > 0 ? ((user?.karma || 0) - currentThreshold) / diff : 1
  const tierProgress = isNaN(rawProgress) ? 0 : Math.max(0, Math.min(1, rawProgress))

  return (
    <section id="karma" className="min-h-screen py-24 px-6 lg:px-12 flex flex-col justify-center relative overflow-hidden">
      <div className="w-full max-w-[1600px] mx-auto z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-left"
        >
          <h2 className="text-4xl md:text-7xl font-bold text-white uppercase tracking-tight italic bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Karma & Network
          </h2>
          <p className="mt-4 text-xs text-white/50 uppercase tracking-[0.4em] font-medium flex items-center justify-start gap-2">
            <Fingerprint size={14} className="text-amber-400" /> Identity Verified // {user.email}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_2fr] gap-8 items-start mb-16">
          
          {/* Identity Card */}
          <div className="p-10 rounded-[40px] bg-obsidian/80 backdrop-blur-xl border border-white/10 relative overflow-hidden group shadow-2xl">
             <div className="absolute inset-0 opacity-20 pointer-events-none blur-[80px]">
               <div className="w-full h-full" style={{ background: `radial-gradient(circle at center, ${tierInfo.color}, transparent 60%)` }} />
             </div>

             <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 rounded-full mb-8 relative">
                   <motion.div 
                      className="absolute inset-0 rounded-full border border-white/20"
                      animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                   />
                   <div className="w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      <span className="text-5xl grayscale group-hover:grayscale-0 transition-all duration-700">👤</span>
                   </div>
                </div>
                <h3 className="text-4xl font-bold text-white tracking-tighter uppercase italic mb-2">{user.name}</h3>
                <p className="font-mono text-xs text-white/50 uppercase tracking-widest">{user.email}</p>

                <div className="mt-12 w-full pt-10 border-t border-white/10 flex flex-col gap-8">
                   <div>
                      <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold block mb-4">Current Authorization</span>
                      <div className="flex items-center justify-center gap-3">
                         <ShieldAlert size={20} style={{ color: tierInfo.color }} />
                         <span className="text-2xl font-bold tracking-tight text-white uppercase italic">{tierInfo.label}</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest px-4 border border-white/10 rounded-full py-4 bg-white/5">
                      <span className="text-white/40">Global Scope Rank</span>
                      <span className="text-white">#1</span>
                   </div>
                   <button 
                      onClick={() => (window as any).location.href = '/my-bookings'}
                      className="w-full py-4 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-black tracking-widest text-white/40 hover:bg-white hover:text-black transition-all"
                    >
                      View Space Reservations
                    </button>
                 </div>
             </div>
          </div>

          {/* Stats & Progress */}
          <div className="space-y-8">
              <div className="p-10 rounded-[40px] bg-obsidian/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                 <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-12">
                     <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold mb-4">Total Accrued Karma</p>
                        <span className="text-6xl md:text-8xl font-bold tracking-tighter text-amber-500 italic drop-shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                           {user.karma.toLocaleString()}
                        </span>
                     </div>
                     {nextTier && (
                       <div className="w-full md:w-80">
                          <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-4">
                             <span className="text-white/40">{tierInfo.label}</span>
                             <span style={{ color: nextTier.color }}>{nextTier.label}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
                             <motion.div 
                                className="h-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                style={{ background: `linear-gradient(to right, ${tierInfo.color}, ${nextTier.color})` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${tierProgress * 100}%` }}
                                transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
                             />
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold text-right italic">
                            {nextThreshold - user.karma} Points to Evolution
                          </p>
                       </div>
                     )}
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10 cursor-default">
                     {[
                       { label: 'Sys Updates', val: karmaEvents.length, icon: TrendingUp, col: '#34D399' },
                       { label: 'Validated', val: user.verificationsCount || Math.floor(karmaEvents.length / 2), icon: Award, col: '#22D3EE' },
                       { label: 'Trusted By', val: 'Peers', icon: Shield, col: '#A78BFA' },
                       { label: 'Network', val: 'Active', icon: Zap, col: '#FB7185' }
                     ].map(stat => (
                       <div key={stat.label} className="group">
                          <div className="flex items-center gap-2 mb-2 opacity-40 group-hover:opacity-100 transition-opacity">
                             <stat.icon size={14} style={{ color: stat.col }} />
                             <span className="text-[10px] uppercase tracking-widest font-bold text-white">{stat.label}</span>
                          </div>
                          <p className="text-3xl font-bold text-white tracking-tighter">{stat.val}</p>
                       </div>
                     ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Event Registry */}
                 <div className="p-8 rounded-[40px] bg-obsidian/60 border border-white/5 backdrop-blur-xl space-y-6 flex flex-col h-[400px]">
                    <div className="flex items-center gap-3">
                       <Star size={16} className="text-amber-400" />
                       <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">Event Registry</p>
                    </div>
                     <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {feedEvents.length === 0 && <p className="text-white/30 text-xs italic">No activity recorded yet.</p>}
                        {feedEvents.slice(0, 10).map((event: FeedEvent) => (
                          <div key={event.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-center group">
                             <div>
                                <p className="text-xs font-bold text-white mb-2">{event.action} {event.roomName}</p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest">@{event.userName.split(' ')[0]} // {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                             </div>
                             <span className={`text-xl font-bold font-mono transition-transform group-hover:scale-110 ${event.karma && event.karma >= 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                {event.karma && event.karma >= 0 ? `+${event.karma}` : '--'}
                             </span>
                          </div>
                        ))}
                     </div>
                 </div>

                 {/* Leaderboard Summary */}
                 <div className="p-8 rounded-[40px] bg-obsidian/60 border border-white/5 backdrop-blur-xl space-y-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-bold">Network Index</p>
                       <div className="flex gap-2">
                          <button onClick={() => setLeaderboardTab('weekly')} className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full transition-colors ${leaderboardTab === 'weekly' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}>Week</button>
                          <button onClick={() => setLeaderboardTab('alltime')} className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full transition-colors ${leaderboardTab === 'alltime' ? 'bg-white text-black' : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'}`}>Global</button>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                       {leaderboard.map((lbUser, idx) => (
                           <div key={lbUser.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                              <span className="text-[10px] font-mono text-white/30 w-4">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold text-white truncate">{lbUser.name}</p>
                                 <p className="text-[9px] uppercase tracking-widest font-bold text-amber-400/80">{lbUser.trustTier}</p>
                              </div>
                              <span className="text-sm font-bold text-white/80 font-mono italic">✦{lbUser.karma.toLocaleString()}</span>
                           </div>
                       ))}
                       {leaderboard.length === 0 && <p className="text-white/30 text-xs italic">Syncing mainframe database...</p>}
                    </div>
                 </div>
              </div>
          </div>
        </div>

        {/* Tier Hierarchy Map */}
        <div className="p-10 rounded-[40px] border border-white/5 bg-obsidian/40 backdrop-blur-md">
           <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/30 mb-8 text-center">Institutional Trust Hierarchy</p>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {TIER_ORDER.map((tier, i) => {
                 const info = TRUST_TIERS[tier as keyof typeof TRUST_TIERS]
                 const isActive = tier === currentTier
                 return (
                   <motion.div
                     key={tier}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className={`p-8 rounded-[32px] border transition-all text-center ${
                       isActive ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'bg-white/5 border-white/10'
                     }`}
                   >
                     <p className="text-sm font-bold uppercase tracking-tight mb-2" style={{ color: info.color }}>{info.label}</p>
                     <p className="text-[10px] font-mono text-white/50 mb-6">{info.range} pts</p>
                     <div className="pt-4 border-t border-white/10">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{info.weight}x Mux</span>
                     </div>
                   </motion.div>
                 )
              })}
           </div>
        </div>
      </div>
    </section>
  )
}

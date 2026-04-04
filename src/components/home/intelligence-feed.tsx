"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Terminal, Activity, Zap, Shield, AlertTriangle, Calendar, AlertCircle } from "lucide-react"
import { useFeedStore, useUIStore } from "@/lib/store"
import type { FeedEvent } from "@/lib/store"
import { cn } from "@/lib/utils"
import { CampusMap } from "./campus-map"

const TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  verification: { color: '#34D399', icon: Activity, label: 'TELEMETRY' },
  speedtest: { color: '#22D3EE', icon: Zap, label: 'NETWORK' },
  status_change: { color: '#FB7185', icon: AlertTriangle, label: 'CONFLICT' },
  equipment: { color: '#A78BFA', icon: Shield, label: 'HARDWARE' },
  booking: { color: '#FBBF24', icon: Terminal, label: 'RESERVE' },
  karma: { color: '#FB923C', icon: Zap, label: 'REPUTATION' },
  status: { color: '#34D399', icon: Activity, label: 'TELEMETRY' },
};

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return `${Math.floor(diffHours / 24)}d ago`
}

interface FeedItemProps {
  event: FeedEvent
  index: number
}

function FeedItem({ event, index }: FeedItemProps) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.verification;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      viewport={{ once: true }}
      className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all relative group overflow-hidden"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 mt-1">
           <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
              <Icon size={14} style={{ color: config.color }} />
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
             <span className="font-mono text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: config.color }}>
                {config.label}
             </span>
             <span className="font-mono text-[9px] text-white/20">{formatTimeAgo(event.timestamp)}</span>
          </div>
          
          <p className="font-mono text-[11px] text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
            <span className="text-white/70 font-bold">@{event.userName.replace(/\s+/g, '').toLowerCase()}</span> {event.action} <span className="text-primary font-bold">{event.roomName}</span>
          </p>

          {/* Speedtest data */}
          {event.type === "speedtest" && event.data && (
            <p className="mt-2 text-[10px] font-mono text-white/30 border-t border-white/5 pt-2">
              Sync Speed: {event.data.download as number}↓ {event.data.upload as number}↑ Mbps
            </p>
          )}

          {/* Meta */}
          {event.karma && event.karma > 0 && (
            <div className="mt-2 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-accent" />
               <span className="text-[9px] font-mono text-accent uppercase tracking-widest">+{event.karma} Rep Cache</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Accent Line */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: config.color }} />
    </motion.div>
  )
}

export function IntelligenceFeed() {
  const [events, setEvents] = useState<any[]>([])
  const { setDominantColor } = useUIStore()

  // Set background color when section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDominantColor("amber")
        }
      },
      { threshold: 0.3 }
    )

    const element = document.getElementById("feed")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [setDominantColor])

  const MOCK_EVENTS = [
    { id: 'm1', type: 'verification', userName: 'Devansh Sharma', roomName: 'SJT-402', action: 'marked EMPTY', timestamp: new Date(Date.now() - 120000).toISOString(), karma: 15 },
    { id: 'm2', type: 'speedtest', userName: 'Vikram R.', roomName: 'TT-301', action: 'recorded 47 Mbps', data: { download: 47, upload: 12 }, timestamp: new Date(Date.now() - 300000).toISOString(), karma: 10 },
    { id: 'm3', type: 'booking', userName: 'IEEE Club', roomName: 'AB1-201', action: 'secured lock', timestamp: new Date(Date.now() - 600000).toISOString(), karma: 50 },
    { id: 'm4', type: 'status_change', userName: 'Admin', roomName: 'MB-102', action: 'flagged CONFLICT', timestamp: new Date(Date.now() - 1200000).toISOString() },
  ]

  // Poll real events every 5s
  useEffect(() => {
    const fetchFeed = async () => {
       try {
         const res = await fetch('/api/feed')
         if (res.ok) {
           const data = await res.json()
           setEvents(data.length > 0 ? data : MOCK_EVENTS)
         } else setEvents(MOCK_EVENTS)
       } catch (e) {
         setEvents(MOCK_EVENTS)
       }
    }
    fetchFeed()
    const interval = setInterval(fetchFeed, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="feed" className="min-h-screen py-24 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* Campus Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl glass-panel overflow-hidden lg:min-h-[600px]"
          >
            <CampusMap />
          </motion.div>

          {/* Intelligence Feed */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <Terminal size={16} className="text-amber-500" />
                   <h2 className="font-mono text-xs font-bold text-white/80 uppercase tracking-[0.4em]">
                     Protocol Feed
                   </h2>
                </div>
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] italic">
                  Live Stream Synchronized
                </p>
              </div>
              <div className="hidden sm:block">
                 <span className="font-mono text-[8px] text-white/10 uppercase tracking-[0.4em]">Node: PRP-GATEWAY-01</span>
              </div>
            </div>

            {/* Feed Items */}
            <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4 pr-2 custom-scrollbar">
              {events.map((event, index) => (
                <FeedItem key={event.id} event={event as FeedEvent} index={index} />
              ))}
            </div>

            {/* Footer / Status */}
            <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between opacity-30">
                    <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/60">Encryption Active</span>
                    <div className="flex gap-1.5">
                       {Array.from({ length: 4 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" 
                            style={{ animationDelay: `${i * 0.2}s` }} 
                          />
                       ))}
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

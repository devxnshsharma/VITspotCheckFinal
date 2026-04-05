"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowLeft, QrCode, X, MapPin, Activity, Database, Sparkles, Clock, AlertCircle } from 'lucide-react'
import { useBookingStore, useRoomStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Footer } from '@/components/global/footer'
import { toast } from 'sonner'

interface BackendBooking {
  id: string
  roomName: string
  startTime: string
  endTime: string
  reason: string
  status: string
  createdAt: string
}

export default function MyBookings() {
  const navigate = useNavigate()
  const { bookings: localBookings, cancelBooking } = useBookingStore()
  const { rooms } = useRoomStore()
  const { user, isAuthenticated } = useAuthStore()
  const [dbBookings, setDbBookings] = useState<BackendBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Issue 3: Fetch bookings from backend on mount
  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false)
      return
    }

    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setDbBookings(data)
        }
      } catch (e) {
        console.error('Failed to fetch bookings from backend:', e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [user?.email])

  // Merge backend + local bookings (deduplicate by id)
  const mergedBookings = (() => {
    const seen = new Set<string>()
    const result: Array<{
      id: string
      roomLabel: string
      date: string
      startTime: string
      endTime: string
      status: string
      purpose: string
      source: 'db' | 'local'
    }> = []

    // Backend bookings first (authoritative)
    for (const b of dbBookings) {
      seen.add(b.id)
      const start = new Date(b.startTime)
      const end = new Date(b.endTime)
      result.push({
        id: b.id,
        roomLabel: b.roomName,
        date: start.toISOString().split('T')[0],
        startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: b.status || 'confirmed',
        purpose: b.reason || 'Study / Meeting',
        source: 'db',
      })
    }

    // Local bookings that aren't in DB
    for (const b of localBookings) {
      if (!seen.has(b.id)) {
        result.push({
          id: b.id,
          roomLabel: rooms[b.roomId]?.name || b.roomId,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          purpose: b.purpose || 'Study / Meeting',
          source: 'local',
        })
      }
    }

    return result
  })()

  const statusColors: Record<string, string> = {
    confirmed: '#34D399',
    completed: '#FFFFFF',
    cancelled: '#FB7185',
    pending: '#FBBF24',
  }

  // Separate into upcoming and past
  const now = new Date()
  const activeBookings = mergedBookings.filter(b => {
    if (b.status === 'cancelled') return false
    const bookingEnd = new Date(`${b.date}T${b.endTime}:00`)
    return bookingEnd > now && (b.status === 'confirmed' || b.status === 'pending')
  })
  const pastBookings = mergedBookings.filter(b => {
    if (b.status === 'cancelled') return true
    const bookingEnd = new Date(`${b.date}T${b.endTime}:00`)
    return bookingEnd <= now || b.status === 'completed'
  })

  // Issue 3: Cancel booking via backend
  const handleCancel = async (bookingId: string, source: 'db' | 'local') => {
    if (source === 'db') {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Cancel failed' }))
          toast.error(err.error || 'Cannot cancel this booking')
          return
        }
        // Update local state
        setDbBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        toast.success('Booking cancelled')
      } catch {
        toast.error('Failed to cancel booking')
      }
    } else {
      cancelBooking(bookingId)
      toast.success('Booking cancelled')
    }
  }

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden" 
      style={{ background: '#020204' }} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 pt-32 pb-20 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 border-b border-white/5 pb-16">
          <div>
            <motion.button 
              onClick={() => navigate('/')} 
              className="flex items-center gap-3 mb-10 text-[10px] uppercase tracking-[0.4em] font-black text-white/30 hover:text-white transition-colors group" 
              whileHover={{ x: -5 }}
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Nexus Dashboard
            </motion.button>
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-8">
              Space <br/><span className="text-white/10 italic">Reservations</span>
            </h1>
            <div className="flex items-center gap-8">
               <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-3 font-bold">
                 <Activity size={12} className="text-emerald-500" /> {activeBookings.length} Active Sessions
               </p>
               <p className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] flex items-center gap-3 font-bold">
                 <Database size={12} className="text-white/10" /> {pastBookings.length} Archived
               </p>
            </div>
          </div>
          
          <motion.button
            className="group flex items-center gap-4 px-10 py-5 rounded-full bg-primary text-black font-black uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_rgba(0,229,255,0.2)] hover:scale-105 transition-all"
            onClick={() => navigate('/booking')}
            whileTap={{ scale: 0.95 }}
          >
            + Create Reservation
          </motion.button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/30 uppercase tracking-widest text-xs font-mono animate-pulse">
              Syncing reservations from mainframe...
            </div>
          </div>
        )}

        {/* Global Statistics Matrix */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-20 overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl">
             <div className="p-10 border-r border-white/5 relative group hover:bg-white/[0.01] transition-colors">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-4 block font-black">Temporal Status</span>
                <span className="text-5xl font-black italic tracking-tighter text-emerald-400">{activeBookings.length}</span>
                <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity">
                   <Activity size={32} />
                </div>
             </div>
             <div className="p-10 border-r border-white/5 relative group hover:bg-white/[0.01] transition-colors">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-4 block font-black">Lifetime Syncs</span>
                <span className="text-5xl font-black italic tracking-tighter text-white/80">{mergedBookings.length}</span>
                <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity">
                   <Database size={32} />
                </div>
             </div>
             <div className="p-10 relative group hover:bg-white/[0.01] transition-colors">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-4 block font-black">Reputation Yield</span>
                <span className="text-5xl font-black italic tracking-tighter text-amber-500">✦ {mergedBookings.filter(b => b.status !== 'cancelled').length * 10}</span>
                <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-30 transition-opacity">
                   <Sparkles size={32} />
                </div>
             </div>
          </div>
        )}

        {/* Active Operations */}
        {!isLoading && activeBookings.length > 0 && (
          <div className="mb-24">
            <h2 className="text-[11px] font-mono text-white/40 uppercase tracking-[0.5em] mb-12 flex items-center gap-4 font-black">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34D399]" />
               Active Operations
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {activeBookings.map((booking, idx) => {
                const startTime = booking.startTime.includes('T') ? booking.startTime : `2026-04-04T${booking.startTime}:00`
                const endTime = booking.endTime.includes('T') ? booking.endTime : `2026-04-04T${booking.endTime}:00`
                const start = new Date(startTime)
                const end = new Date(endTime)
                const duration = !isNaN(start.getTime()) && !isNaN(end.getTime()) 
                  ? ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1)
                  : "1.0"
                
                return (
                  <motion.div
                    key={booking.id}
                    className="group relative p-12 rounded-[3.5rem] border border-white/10 bg-white/[0.02] transition-all hover:bg-white/[0.04] overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {/* Brand Tag */}
                    <div className="absolute top-0 right-0 p-12 font-mono text-[9px] text-white/10 uppercase tracking-widest pointer-events-none font-black">
                       VIT-STUDIO-RESERVE
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-10">
                         <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <MapPin size={28} className="text-emerald-400" />
                         </div>
                         <div>
                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-1">{booking.roomLabel}</h3>
                            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold">{booking.purpose}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8 mb-12">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em] block font-black">Temporal Date</span>
                          <span className="font-mono text-xs text-white/70 font-bold uppercase">{booking.date}</span>
                        </div>
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em] block font-black">Session Window</span>
                          <span className="font-mono text-xs text-white/70 font-bold uppercase">{booking.startTime} — {booking.endTime}</span>
                        </div>
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em] block font-black">Magnitude</span>
                          <span className="font-mono text-xs text-amber-500 font-black italic">{duration}H DURATION</span>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-10 border-t border-white/5">
                        <motion.button
                          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 text-[10px] font-black text-white uppercase tracking-[0.4em] hover:bg-white/10 transition-colors"
                          whileTap={{ scale: 0.98 }}
                        >
                          <QrCode size={16} className="text-primary" /> Digital Pass
                        </motion.button>
                        <motion.button
                          onClick={() => handleCancel(booking.id, booking.source)}
                          className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-rose-500/5 text-[10px] font-black text-rose-500 border border-rose-500/10 uppercase tracking-[0.4em] hover:bg-rose-500 hover:text-black transition-all duration-300"
                          whileTap={{ scale: 0.98 }}
                        >
                          <X size={16} /> Terminate
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Design Accent Blob */}
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500 opacity-[0.03] blur-[100px] pointer-events-none" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Archived History */}
        {!isLoading && pastBookings.length > 0 && (
          <div className="w-full">
            <h2 className="text-[11px] font-mono text-white/40 uppercase tracking-[0.5em] mb-12 font-black">Archived Syncs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pastBookings.map((booking, idx) => {
                const color = statusColors[booking.status] || '#FFFFFF'
                return (
                  <motion.div
                    key={booking.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition-all duration-500 gap-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-8">
                       <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center font-mono text-[9px] text-white/20 font-black">
                          #{booking.id.slice(-4)}
                       </div>
                       <div>
                          <h3 className={`text-2xl font-black uppercase italic tracking-tighter ${booking.status === 'cancelled' ? 'text-white/10 line-through' : 'text-white/40'}`}>
                            {booking.roomLabel}
                          </h3>
                          <div className="flex items-center gap-4 mt-2">
                             <span className="font-mono text-[9px] text-white/10 uppercase tracking-widest font-bold">{booking.purpose}</span>
                             <div className="w-1 h-1 rounded-full bg-white/10" />
                             <span className="font-mono text-[9px] text-white/10 uppercase tracking-widest font-bold">{booking.date}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-8 self-end sm:self-auto">
                       <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-black px-5 py-2 rounded-full border border-white/5" style={{ color: `${color}60` }}>
                          {booking.status}
                       </span>
                       <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ 
                             background: color, 
                             opacity: booking.status === 'cancelled' ? 0.2 : 0.6,
                             boxShadow: `0 0 20px ${color}40`
                          }} 
                       />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Null State */}
        {!isLoading && mergedBookings.length === 0 && (
          <motion.div 
            className="py-32 text-center border border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-24 h-24 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-10 border border-white/5">
               <Calendar size={32} className="text-white/10" />
            </div>
            <h3 className="text-4xl font-black text-white/40 uppercase italic tracking-tighter mb-6">No History Recorded</h3>
            <p className="font-mono text-[10px] text-white/10 uppercase tracking-[0.4em] mb-12 font-black">Node synchronization required to populate database</p>
            <button 
               className="px-12 py-6 rounded-full bg-white text-black font-black uppercase text-xs tracking-[0.3em] hover:bg-emerald-400 transition-all shadow-[0_0_60px_rgba(255,255,255,0.05)]"
               onClick={() => navigate('/booking')}
            >
              + Initiate Reservation
            </button>
          </motion.div>
        )}
      </div>
      <Footer />
    </motion.div>
  )
}

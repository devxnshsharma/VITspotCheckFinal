import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, MapPin, X, AlertCircle, RefreshCw, Smartphone } from "lucide-react"
import { useBookingStore, useRoomStore, useUIStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { cn } from "@/lib/utils"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  })
}

export function MyReservationsSection() {
  const { bookings, setBookings, cancelBooking } = useBookingStore()
  const { rooms } = useRoomStore()
  const { setDominantColor, showToast } = useUIStore()
  const { user } = useAuthStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchBookings = async () => {
    if (!user?.email) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/bookings?email=${user.email}`)
      if (response.ok) {
        const data = await response.json()
        const mappedBookings = data.map((b: any) => ({
          id: b.id,
          roomId: b.roomName,
          userId: b.userId,
          date: b.startTime.split('T')[0],
          startTime: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "confirmed",
          purpose: b.reason
        }))
        setBookings(mappedBookings)
      }
    } catch (err) {
      console.error("Failed to sync reservations", err)
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, [user?.email])

  const handleCancel = async (bookingId: string) => {
    // In a real app we'd call the API here too
    cancelBooking(bookingId)
    showToast("Reservation Terminated", "success")
  }

  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending")

  return (
    <section id="reservations" className="min-h-screen py-32 px-6 lg:px-12 relative overflow-hidden bg-black">
      <div className="w-full max-w-[1400px] mx-auto z-10 relative">
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter italic leading-tight">
              Awaiting <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Flux.</span>
            </h2>
            <p className="mt-8 text-xs text-white/40 uppercase tracking-[0.6em] font-bold">
              Active domain synchronization & security keys
            </p>
          </motion.div>

          <motion.button
            onClick={fetchBookings}
            disabled={isRefreshing}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white/40 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={14} className={cn("group-hover:rotate-180 transition-transform duration-700", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Synchronizing..." : "Refresh Shards"}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative p-8 rounded-[2rem] border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500 h-[380px] flex flex-col justify-between"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Domain Secured</span>
                       </div>
                       <button onClick={() => handleCancel(booking.id)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                          <X size={14} className="text-white/20" />
                       </button>
                    </div>

                    <div className="space-y-2">
                       <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Building Unit</span>
                       <h3 className="text-4xl font-black tracking-tighter text-white italic">
                          {rooms[booking.roomId]?.name || booking.roomId}
                       </h3>
                    </div>

                    <div className="mt-8 space-y-4">
                       <div className="flex items-center gap-4 text-white/60">
                          <Calendar size={16} className="text-amber-500" />
                          <span className="font-mono text-xs uppercase tracking-widest">{formatDate(booking.date)}</span>
                       </div>
                       <div className="flex items-center gap-4 text-white/60">
                          <Clock size={16} className="text-amber-500" />
                          <span className="font-mono text-xs uppercase tracking-widest">{booking.startTime} — {booking.endTime}</span>
                       </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                           <Smartphone size={20} className="text-white/30" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[8px] text-white/20 uppercase font-black">Digital Pass</span>
                           <span className="text-[10px] text-white/60 font-mono tracking-tighter">SEC-{booking.id.slice(-6).toUpperCase()}</span>
                        </div>
                     </div>
                     <button className="text-[9px] text-amber-500/60 hover:text-amber-500 font-bold uppercase tracking-widest transition-colors">Generate Key</button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 px-12 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.01]"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                  <AlertCircle size={32} className="text-white/20" />
                </div>
                <h3 className="text-2xl font-bold text-white/40 uppercase tracking-widest italic mb-4">No Active Syncs</h3>
                <p className="text-xs text-white/20 max-w-sm uppercase tracking-widest leading-loose">
                  Initialize a domain lock protocol in the booking section to verify your temporal presence.
                </p>
                <button 
                  onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold uppercase text-[9px] tracking-[0.3em] hover:bg-white/10 transition-colors"
                >
                  New Protocol
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}

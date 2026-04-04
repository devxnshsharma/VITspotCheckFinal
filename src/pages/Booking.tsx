"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Calendar, Clock, MapPin, Users } from "lucide-react"
import { useRoomStore, useBookingStore, useUIStore, useUserStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { BUILDINGS, TIME_SLOTS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function BookingPage() {
  const { rooms } = useRoomStore()
  const { 
    currentBookingStep, 
    selectedRoom, 
    selectedDate, 
    selectedTimeSlot,
    setBookingStep,
    setSelectedRoom,
    setSelectedDate,
    setSelectedTimeSlot,
    addBooking,
    resetBookingFlow 
  } = useBookingStore()
  const { setDominantColor, showToast } = useUIStore()
  const { currentUser } = useUserStore()
  const { user, isAuthenticated } = useAuthStore()

  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [purpose, setPurpose] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    setDominantColor("amber")
    return () => {
      setDominantColor("black")
      resetBookingFlow()
    }
  }, [setDominantColor, resetBookingFlow])

  const availableRooms = selectedBuilding 
    ? Object.values(rooms).filter(r => r.block === selectedBuilding && r.status === "empty")
    : []

  const room = selectedRoom ? rooms[selectedRoom] : null

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      value: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      isToday: i === 0
    }
  })

  const handleConfirm = async () => {
    if (!selectedRoom || !selectedDate || !selectedTimeSlot || !user) {
      if (!user) showToast("Please sign in to book", "error")
      return
    }

    setIsConfirming(true)
    
    try {
      // Combine date and time slot for API
      const startIso = `${selectedDate}T${selectedTimeSlot.start}:00`
      const endIso = `${selectedDate}T${selectedTimeSlot.end}:00`

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          roomName: room?.name || selectedRoom,
          startTime: startIso,
          endTime: endIso,
          reason: purpose || "Study / Meeting"
        })
      })

      if (!response.ok) throw new Error("Failed to book")

      const savedBooking = await response.json()

      addBooking({
        id: savedBooking.id,
        roomId: selectedRoom,
        userId: user.id,
        date: selectedDate,
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        status: "confirmed",
        purpose: purpose || undefined,
      })
      
      showToast("Booking Confirmed!", "success")
      setBookingStep(5) // Success step
    } catch (error) {
      console.error(error)
      showToast("Booking failed. Please try again.", "error")
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white uppercase tracking-tight">
            Book Space
          </h1>
          <p className="mt-2 text-white/60">Reserve a room in 4 easy steps</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-12"
        >
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                  currentBookingStep >= step
                    ? "bg-accent text-white"
                    : "bg-white/10 text-white/40"
                )}
              >
                {currentBookingStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1 transition-colors duration-300",
                    currentBookingStep > step ? "bg-accent" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Building */}
          {currentBookingStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-white text-center">
                Select Building
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {BUILDINGS.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => setSelectedBuilding(building.id)}
                    data-cursor="link"
                    className={cn(
                      "p-6 rounded-xl transition-all duration-200 text-center",
                      selectedBuilding === building.id
                        ? "glass-panel-amber border-accent"
                        : "glass-panel hover:bg-white/10"
                    )}
                  >
                    <div className="text-2xl font-bold text-white">{building.shortName}</div>
                    <div className="text-sm text-white/60 mt-1">{building.emptyRooms} available</div>
                  </button>
                ))}
              </div>

              {selectedBuilding && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setBookingStep(2)}
                    data-cursor="button"
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-yellow-500 text-white font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 inline ml-2" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Room */}
          {currentBookingStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBookingStep(1)}
                  data-cursor="link"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-1" />
                  Back
                </button>
                <h2 className="text-2xl font-bold text-white">Select Room</h2>
                <div className="w-16" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    data-cursor="link"
                    className={cn(
                      "p-4 rounded-xl transition-all duration-200",
                      selectedRoom === room.id
                        ? "glass-panel-amber border-accent"
                        : "glass-panel hover:bg-white/10"
                    )}
                  >
                    <div className="text-lg font-bold text-white">{room.name}</div>
                    <div className="flex items-center justify-center gap-1 text-sm text-white/60 mt-1">
                      <Users className="w-4 h-4" />
                      {room.capacity}
                    </div>
                  </button>
                ))}
              </div>

              {selectedRoom && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setBookingStep(3)}
                    data-cursor="button"
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-yellow-500 text-white font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 inline ml-2" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Select Date & Time */}
          {currentBookingStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBookingStep(2)}
                  data-cursor="link"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-1" />
                  Back
                </button>
                <h2 className="text-2xl font-bold text-white">Select Date & Time</h2>
                <div className="w-16" />
              </div>

              {/* Date Selection */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Date
                </h3>
                <div className="flex flex-wrap gap-3">
                  {dates.map((date) => (
                    <button
                      key={date.value}
                      onClick={() => setSelectedDate(date.value)}
                      data-cursor="link"
                      className={cn(
                        "px-4 py-3 rounded-xl transition-all duration-200",
                        selectedDate === date.value
                          ? "bg-accent text-white"
                          : "glass-panel text-white hover:bg-white/10"
                      )}
                    >
                      <div className="text-sm font-medium">{date.label}</div>
                      {date.isToday && <div className="text-xs opacity-60">Today</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Time Slot
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      onClick={() => setSelectedTimeSlot(slot)}
                      data-cursor="link"
                      className={cn(
                        "px-4 py-3 rounded-xl transition-all duration-200 text-sm",
                        selectedTimeSlot?.start === slot.start
                          ? "bg-accent text-white"
                          : "glass-panel text-white hover:bg-white/10"
                      )}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTimeSlot && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setBookingStep(4)}
                    data-cursor="button"
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-accent to-yellow-500 text-white font-bold uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 inline ml-2" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {currentBookingStep === 4 && room && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setBookingStep(3)}
                  data-cursor="link"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-1" />
                  Back
                </button>
                <h2 className="text-2xl font-bold text-white">Confirm Booking</h2>
                <div className="w-16" />
              </div>

              {/* Booking Summary */}
              <div className="glass-panel-amber rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-sm text-white/60">Room</div>
                    <div className="text-lg font-semibold text-white">{room.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-sm text-white/60">Date</div>
                    <div className="text-lg font-semibold text-white">
                      {selectedDate && new Date(selectedDate).toLocaleDateString("en-US", { 
                        weekday: "long", month: "long", day: "numeric" 
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-sm text-white/60">Time</div>
                    <div className="text-lg font-semibold text-white">
                      {selectedTimeSlot?.start} - {selectedTimeSlot?.end}
                    </div>
                  </div>
                </div>
              </div>

              {/* Purpose (optional) */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Purpose (optional)
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Study group, Project meeting..."
                  className="w-full px-4 py-3 rounded-xl glass-panel text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent"
                  data-cursor="input"
                />
              </div>

              {/* Confirm Button */}
              <div className="text-center">
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  data-cursor="button"
                  className={cn(
                    "px-12 py-4 rounded-full font-bold uppercase tracking-wider transition-all duration-200",
                    isConfirming
                      ? "bg-white/20 text-white/60"
                      : "bg-gradient-to-r from-accent to-yellow-500 text-white hover:scale-105 shadow-[0_8px_32px_rgba(251,146,60,0.5)]"
                  )}
                >
                  {isConfirming ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {currentBookingStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-status-empty/20 flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-status-empty" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-4">Booking Confirmed!</h2>
              <p className="text-white/60 mb-8">
                Your space has been reserved successfully.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    resetBookingFlow()
                    setSelectedBuilding(null)
                    setPurpose("")
                  }}
                  data-cursor="link"
                  className="px-6 py-3 rounded-full glass-panel text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Book Another
                </button>
                <button
                  onClick={() => navigate("/my-bookings")}
                  data-cursor="link"
                  className="px-6 py-3 rounded-full bg-accent text-white font-semibold hover:scale-105 transition-transform"
                >
                  View My Bookings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

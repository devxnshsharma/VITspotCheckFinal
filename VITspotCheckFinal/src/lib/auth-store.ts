"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface KarmaEvent {
  id: string
  delta: number
  reason: string
  timestamp: number
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  isVITStudent: boolean
  registrationNumber?: string
  karma: number
  trustTier: "newcomer" | "verified" | "trusted" | "elite" | string
  verificationsCount: number
  joinedAt: string
  isGuest?: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  showAuthModal: boolean
  karmaEvents: KarmaEvent[]
  lastKarmaUpdate: KarmaEvent | null
  setUser: (user: AuthUser | null) => void
  setIsLoading: (loading: boolean) => void
  setShowAuthModal: (show: boolean) => void
  logout: () => void
  addKarma: (amount: number, reason: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      showAuthModal: false,
      karmaEvents: [],
      lastKarmaUpdate: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      setShowAuthModal: (show) => set({ showAuthModal: show }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          karmaEvents: [],
          lastKarmaUpdate: null
        }),

      addKarma: async (amount, reason) => {
        const state = get()
        if (!state.user?.email) return

        if (state.user?.isGuest) {
          // Guests don't get karma sync, but we show a message
          const newEvent = { 
            id: `k-guest-${Date.now()}`, 
            delta: 0, 
            reason: `${reason} (Guest mode - no karma awarded)`, 
            timestamp: Date.now() 
          }
          set((state) => ({
            lastKarmaUpdate: newEvent
          }))
          return
        }

        try {
           const res = await fetch('/api/karma', {
              method: 'POST',
              body: JSON.stringify({ email: state.user.email, delta: amount, reason }),
              headers: { 'Content-Type': 'application/json' }
           })
           const data = await res.json()
           
           if (data.success) {
              const newEvent = { 
                id: `k-${Date.now()}`, 
                delta: amount, 
                reason, 
                timestamp: Date.now() 
              }

              set((state) => ({
                user: state.user ? { ...state.user, karma: data.newKarma, trustTier: data.tier } : null,
                karmaEvents: [newEvent, ...state.karmaEvents].slice(0, 50),
                lastKarmaUpdate: newEvent
              }))
           }
        } catch (e) {
           console.error("Failed to sync karma to DB", e)
        }
      },
    }),
    {
      name: "vitspotcheck-auth-v2",
      skipHydration: true,
    }
  )
)

export function isVITEmail(email: string): boolean {
  const vitDomains = ["@vitstudent.ac.in", "@vit.ac.in", "@vitbhopal.ac.in", "@vitap.ac.in", "@vitchennai.ac.in"]
  return vitDomains.some((domain) => email.toLowerCase().endsWith(domain))
}

export function extractRegNumber(email: string): string | null {
  const match = email.match(/^([a-z0-9]+)@/i)
  return match ? match[1].toUpperCase() : null
}

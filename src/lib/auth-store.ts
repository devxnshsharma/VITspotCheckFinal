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
  trustTier: "OBSERVER" | "SPOTTER" | "NAVIGATOR" | "ARCHITECT" | "ORACLE" | string
  verificationsCount: number
  joinedAt: string
  isGuest?: boolean
  lastKarmaUpdate?: { delta: number; reason: string; timestamp: number }
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  showAuthModal: boolean
  karmaEvents: KarmaEvent[]
  lastKarmaUpdate: { delta: number; reason: string; timestamp: number } | null
  setUser: (user: AuthUser | null) => void
  setIsLoading: (loading: boolean) => void
  setShowAuthModal: (show: boolean) => void
  logout: () => void
  addKarma: (amount: number, reason: string) => Promise<void>
  updateUser: (data: Partial<AuthUser>) => void
}

export const TRUST_TIERS = {
  OBSERVER: { range: "0–99", color: "#6B7280", label: "OBSERVER" },
  SPOTTER: { range: "100–499", color: "#00FF94", label: "SPOTTER" },
  NAVIGATOR: { range: "500–1499", color: "#00E5FF", label: "NAVIGATOR" },
  ARCHITECT: { range: "1500–2999", color: "#B14FFF", label: "ARCHITECT" },
  ORACLE: { range: "3000+", color: "#FFB830", label: "ORACLE" },
}

export function getTierForKarma(karma: number): string {
    if (karma >= 3000) return "ORACLE";
    if (karma >= 1500) return "ARCHITECT";
    if (karma >= 500) return "NAVIGATOR";
    if (karma >= 100) return "SPOTTER";
    return "OBSERVER";
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

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

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
        if (!state.user) return

        // 1. Create the event
        const newEvent: KarmaEvent = { 
          id: `k-${Date.now()}`, 
          delta: amount, 
          reason, 
          timestamp: Date.now() 
        }

        // 2. Update state locally immediately (Optimistic UI)
        set((state) => {
          if (!state.user) return state;
          const newKarma = state.user.karma + amount;
          return {
            user: { 
              ...state.user, 
              karma: newKarma,
              trustTier: getTierForKarma(newKarma)
            },
            karmaEvents: [newEvent, ...state.karmaEvents].slice(0, 50),
            lastKarmaUpdate: { delta: amount, reason, timestamp: Date.now() }
          };
        });

        if (state.user.isGuest) return;

        // 3. Sync with backend in background
        try {
           const res = await fetch('/api/karma', {
              method: 'POST',
              body: JSON.stringify({ email: state.user.email, delta: amount, reason }),
              headers: { 'Content-Type': 'application/json' }
           })
           const data = await res.json()
           
           if (data.success) {
              set((state) => ({
                user: state.user ? { ...state.user, karma: data.newKarma, trustTier: data.tier } : null
              }))
           }
        } catch (e) {
           console.error("Failed to sync karma to DB, kept local state", e)
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

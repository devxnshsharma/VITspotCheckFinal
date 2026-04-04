import { create } from "zustand"
import { persist } from "zustand/middleware"
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  type User as FirebaseUser 
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebaseClient"

// ─── Anonymous Guest Name Generator ────────────────────────────────────────
const ADJECTIVES = [
  "Shadow", "Stealth", "Phantom", "Cosmic", "Neon", "Quantum", "Cyber", "Digital",
  "Astral", "Mystic", "Silent", "Swift", "Iron", "Crystal", "Blaze", "Storm",
  "Frost", "Thunder", "Void", "Pulse", "Ember", "Zenith", "Apex", "Nova"
]
const NOUNS = [
  "Wolf", "Hawk", "Fox", "Raven", "Tiger", "Lynx", "Viper", "Phoenix",
  "Falcon", "Panther", "Dragon", "Jaguar", "Cobra", "Griffin", "Sparrow", "Cipher",
  "Ghost", "Specter", "Agent", "Scout", "Nomad", "Ranger", "Sentinel", "Voyager"
]
function generateAnonName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const tag = Math.floor(Math.random() * 9000) + 1000
  return `${adj}${noun}#${tag}`
}

// ─── Types ─────────────────────────────────────────────────────────────────
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

  // ── Actions ──
  setUser: (user: AuthUser | null) => void
  setIsLoading: (loading: boolean) => void
  setShowAuthModal: (show: boolean) => void
  logout: () => Promise<void>
  addKarma: (amount: number, reason: string) => Promise<void>
  updateUser: (data: Partial<AuthUser>) => void
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  loginAsGuest: () => void
  initAuthListener: () => () => void
}

// ─── Trust Tier Logic ──────────────────────────────────────────────────────
export const TRUST_TIERS = {
  OBSERVER: { range: "0–99", color: "#6B7280", label: "OBSERVER" },
  SPOTTER: { range: "100–499", color: "#00FF94", label: "SPOTTER" },
  NAVIGATOR: { range: "500–1499", color: "#00E5FF", label: "NAVIGATOR" },
  ARCHITECT: { range: "1500–2999", color: "#B14FFF", label: "ARCHITECT" },
  ORACLE: { range: "3000+", color: "#FFB830", label: "ORACLE" },
}

export function getTierForKarma(karma: number): string {
  if (karma >= 3000) return "ORACLE"
  if (karma >= 1500) return "ARCHITECT"
  if (karma >= 500) return "NAVIGATOR"
  if (karma >= 100) return "SPOTTER"
  return "OBSERVER"
}

// ─── VIT Email Helpers ─────────────────────────────────────────────────────
export function isVITEmail(email: string): boolean {
  const vitDomains = [
    "@vitstudent.ac.in",
    "@vit.ac.in",
    "@vitbhopal.ac.in",
    "@vitap.ac.in",
    "@vitchennai.ac.in",
  ]
  return vitDomains.some((domain) => email.toLowerCase().endsWith(domain))
}

export function extractRegNumber(email: string): string | null {
  const match = email.match(/^([a-z0-9]+)@/i)
  return match ? match[1].toUpperCase() : null
}

// ─── Helper: Firebase User → AuthUser ──────────────────────────────────────
function firebaseUserToAuthUser(fbUser: FirebaseUser): AuthUser {
  const email = fbUser.email || ""
  return {
    id: fbUser.uid,
    email,
    name: fbUser.displayName || extractRegNumber(email) || "VITian",
    avatar: fbUser.photoURL || undefined,
    isVITStudent: isVITEmail(email),
    registrationNumber: extractRegNumber(email) || undefined,
    karma: 0,
    trustTier: "OBSERVER",
    verificationsCount: 0,
    joinedAt: new Date().toISOString(),
    isGuest: false,
  }
}

// ─── Zustand Store ─────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,  // start true until auth listener resolves
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

      // ── Real Firebase Google Sign-In ──
      loginWithGoogle: async () => {
        set({ isLoading: true })
        try {
          const result = await signInWithPopup(auth, googleProvider)
          const fbUser = result.user
          const email = fbUser.email || ""

          // Enforce VIT email restriction
          if (!isVITEmail(email)) {
            // Sign out the non-VIT user immediately
            await signOut(auth)
            set({ isLoading: false })
            return {
              success: false,
              error: `Only VIT student emails are allowed. "${email}" is not a recognized VIT domain (@vitstudent.ac.in, @vit.ac.in, etc.)`,
            }
          }

          // Build AuthUser from Firebase data, preserving any existing karma
          const existingUser = get().user
          const authUser = firebaseUserToAuthUser(fbUser)
          
          // If returning user, preserve their karma and stats
          if (existingUser && existingUser.email === authUser.email) {
            authUser.karma = existingUser.karma
            authUser.trustTier = existingUser.trustTier
            authUser.verificationsCount = existingUser.verificationsCount
            authUser.joinedAt = existingUser.joinedAt
          }

          set({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        } catch (error: unknown) {
          set({ isLoading: false })
          const message =
            error instanceof Error ? error.message : "Google sign-in failed"
          
          // Don't treat popup closed as an error
          if (message.includes("popup-closed-by-user")) {
            return { success: false, error: "" }
          }
          
          return { success: false, error: message }
        }
      },

      // ── Guest Login with Random Name ──
      loginAsGuest: () => {
        const guestName = generateAnonName()
        const guestUser: AuthUser = {
          id: `guest-${Date.now()}`,
          email: `${guestName.toLowerCase().replace("#", "")}@guest.vitspotcheck`,
          name: guestName,
          isVITStudent: false,
          karma: 0,
          trustTier: "OBSERVER",
          verificationsCount: 0,
          joinedAt: new Date().toISOString(),
          isGuest: true,
        }

        set({
          user: guestUser,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      // ── Logout (Firebase + local state) ──
      logout: async () => {
        try {
          await signOut(auth)
        } catch (e) {
          console.error("Firebase signOut error:", e)
        }
        set({
          user: null,
          isAuthenticated: false,
          karmaEvents: [],
          lastKarmaUpdate: null,
        })
      },

      // ── Firebase Auth State Listener ──
      // Call once on app boot. Returns unsubscribe function.
      initAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser) {
            const email = fbUser.email || ""
            
            // Only auto-restore VIT users
            if (isVITEmail(email)) {
              const existingUser = get().user
              const authUser = firebaseUserToAuthUser(fbUser)

              // Preserve karma/stats from persisted state
              if (existingUser && existingUser.email === authUser.email) {
                authUser.karma = existingUser.karma
                authUser.trustTier = existingUser.trustTier
                authUser.verificationsCount = existingUser.verificationsCount
                authUser.joinedAt = existingUser.joinedAt
                authUser.lastKarmaUpdate = existingUser.lastKarmaUpdate
              }

              set({
                user: authUser,
                isAuthenticated: true,
                isLoading: false,
              })
            } else {
              // Non-VIT user somehow persisted — sign them out
              signOut(auth)
              set({ isLoading: false })
            }
          } else {
            // No Firebase user — check if there's a persisted guest
            const existingUser = get().user
            if (existingUser?.isGuest) {
              // Keep guest logged in
              set({ isAuthenticated: true, isLoading: false })
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false })
            }
          }
        })

        return unsubscribe
      },

      // ── Karma (unchanged from original) ──
      addKarma: async (amount, reason) => {
        const state = get()
        if (!state.user) return

        const newEvent: KarmaEvent = {
          id: `k-${Date.now()}`,
          delta: amount,
          reason,
          timestamp: Date.now(),
        }

        set((state) => {
          if (!state.user) return state
          const newKarma = state.user.karma + amount
          return {
            user: {
              ...state.user,
              karma: newKarma,
              trustTier: getTierForKarma(newKarma),
            },
            karmaEvents: [newEvent, ...state.karmaEvents].slice(0, 50),
            lastKarmaUpdate: { delta: amount, reason, timestamp: Date.now() },
          }
        })

        if (state.user.isGuest) return

        // Sync with backend in background
        try {
          const res = await fetch("/api/karma", {
            method: "POST",
            body: JSON.stringify({
              email: state.user.email,
              delta: amount,
              reason,
            }),
            headers: { "Content-Type": "application/json" },
          })
          const data = await res.json()

          if (data.success) {
            set((state) => ({
              user: state.user
                ? { ...state.user, karma: data.newKarma, trustTier: data.tier }
                : null,
            }))
          }
        } catch (e) {
          console.error("Failed to sync karma to DB, kept local state", e)
        }
      },
    }),
    {
      name: "vitspotcheck-auth-v3",
      // Only persist karma-related data + guest user. Firebase handles real auth sessions.
      partialize: (state) => ({
        user: state.user,
        karmaEvents: state.karmaEvents,
        lastKarmaUpdate: state.lastKarmaUpdate,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

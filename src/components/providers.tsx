import { useState, useEffect, ReactNode } from "react"
import { WebGLBackground } from "@/components/global/webgl-background"
import { AntigravityCursor } from "@/components/global/antigravity-cursor"
import { Navigation } from "@/components/global/navigation"
import { Preloader } from "@/components/global/preloader"
import { ToastNotification } from "@/components/global/toast-notification"
import { LiveUpdateBanner } from "@/components/global/live-update-banner"
import { GoogleAuthModal } from "@/components/auth/google-auth-modal"
import { useUIStore, useRoomStore, useFeedStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { BUILDINGS, ROOMS, FEED_EVENTS } from "@/lib/mock-data"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [showPreloader, setShowPreloader] = useState(true)
  const { isPreloaderComplete, setPreloaderComplete, dominantColor } = useUIStore()
  const { setBuildings, setRooms } = useRoomStore()
  const { setEvents } = useFeedStore()
  const { isAuthenticated, isLoading: authLoading, setShowAuthModal } = useAuthStore()

  // Initialize mock data + Firebase auth listener
  useEffect(() => {
    setBuildings(BUILDINGS)
    setRooms(ROOMS)
    setEvents(FEED_EVENTS)

    // Start Firebase auth listener (replaces Zustand rehydrate)
    const unsubscribe = useAuthStore.getState().initAuthListener()
    return () => unsubscribe()
  }, [setBuildings, setRooms, setEvents])

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
    setPreloaderComplete(true)

    // Show auth modal after preloader if not authenticated
    // Wait a bit for Firebase auth to resolve first
    setTimeout(() => {
      const { isAuthenticated: authed, isLoading: loading } = useAuthStore.getState()
      if (!authed && !loading) {
        setShowAuthModal(true)
      } else if (loading) {
        // Auth still loading — wait a bit more then check again
        const checkInterval = setInterval(() => {
          const state = useAuthStore.getState()
          if (!state.isLoading) {
            clearInterval(checkInterval)
            if (!state.isAuthenticated) {
              setShowAuthModal(true)
            }
          }
        }, 200)
        // Safety: clear after 5s no matter what
        setTimeout(() => clearInterval(checkInterval), 5000)
      }
    }, 500)
  }

  return (
    <>
      {/* Preloader */}
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Google Auth Modal */}
      <GoogleAuthModal />

      {/* WebGL Background (persistent) */}
      <WebGLBackground dominantColor={dominantColor} />

      {/* Custom Antigravity Cursor (persistent) */}
      <AntigravityCursor />

      {/* Navigation (persistent) */}
      <Navigation />

      {/* Toast Notifications */}
      <ToastNotification />

      {/* Live Update Banner */}
      <LiveUpdateBanner />

      {/* Page Content */}
      <main className="relative z-10 min-h-screen">
        {children}
      </main>
    </>
  )
}

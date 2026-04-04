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
  const { isAuthenticated, setShowAuthModal } = useAuthStore()

  // Initialize mock data
  useEffect(() => {
    setBuildings(BUILDINGS)
    setRooms(ROOMS)
    setEvents(FEED_EVENTS)
    useAuthStore.persist.rehydrate()
  }, [setBuildings, setRooms, setEvents])

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
    setPreloaderComplete(true)

    // Show auth modal after preloader if not authenticated
    setTimeout(() => {
      if (!isAuthenticated) {
        setShowAuthModal(true)
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


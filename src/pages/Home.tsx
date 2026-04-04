"use client"

import { useEffect } from "react"
import { HeroSection } from "@/components/home/hero-section"
import { BlockSelector } from "@/components/home/block-selector"
import { IntelligenceFeed } from "@/components/home/intelligence-feed"
import { FloatingBookButton } from "@/components/home/floating-book-button"
import { SpeedtestSection } from "@/components/sections/speedtest-section"
import { BookingSection } from "@/components/sections/booking-section"
import { FFCSSection } from "@/components/sections/ffcs-section"
import { LayoutBuilderSection } from "@/components/sections/layout-builder-section"
import { KarmaProfileSection } from "@/components/sections/karma-profile-section"
import { AdminDashboardSection } from "@/components/sections/admin-dashboard-section"
import { Footer } from "@/components/global/footer"
import { useUIStore } from "@/lib/store"

export default function HomePage() {
  const { setDominantColor } = useUIStore()

  // Reset to black when at top of page
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 200) {
        setDominantColor("black")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setDominantColor])

  return (
    <div className="relative">
      <HeroSection />
      <BlockSelector />
      <IntelligenceFeed />
      
      {/* Newly Migrated Functional Sections */}
      <SpeedtestSection />
      <BookingSection />
      <FFCSSection />
      <LayoutBuilderSection />
      <KarmaProfileSection />
      <AdminDashboardSection />

      <Footer />
      <FloatingBookButton />
    </div>
  )
}

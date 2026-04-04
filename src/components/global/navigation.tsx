"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Sparkles, User, LogOut, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"

const NAV_SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "blocks", label: "Rooms" },
  { id: "speedtest", label: "Speedtest" },
  { id: "ffcs", label: "FFCS" },
  { id: "layout-builder", label: "Layout" },
  { id: "karma", label: "Karma" },
  { id: "admin", label: "Admin" },
]

export function Navigation() {
  const { isMenuOpen, toggleMenu } = useUIStore()
  const { user, isAuthenticated, setShowAuthModal, logout } = useAuthStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      // Determine active section
      const sections = NAV_SECTIONS.map((s) => document.getElementById(s.id))
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(NAV_SECTIONS[i].id)
          break
        }
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/#${sectionId}`
      return
    }
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
    if (isMenuOpen) toggleMenu()
  }

  return (
    <>
      {/* Fixed Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[1000] transition-all duration-300",
          isScrolled
            ? "bg-[#020204]/90 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        )}
      >
        <div className="h-20 px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-1 shrink-0">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-xl font-bold text-white tracking-tight hover:text-[#00E5FF] transition-colors"
            >
              VITspotCheck
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeSection === section.id
                    ? "text-[#00E5FF] bg-[#00E5FF]/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {section.label}
              </button>
            ))}
          </nav>



          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end gap-3 shrink-0">
            {/* Auth Button / User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Karma Badge */}
                <button
                  onClick={() => scrollToSection("karma")}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/20 hover:bg-[#FF9500]/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#FF9500]" />
                  <span className="text-sm font-semibold text-[#FF9500] tabular-nums">
                    {user.karma.toLocaleString()}
                  </span>
                </button>

                {/* User Avatar */}
                <div className="relative group">
                  <button className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-black font-bold transition-all overflow-hidden",
                    user.isGuest 
                      ? "bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-white/20" 
                      : "bg-gradient-to-br from-[#00E5FF] to-[#00FFD1]"
                  )}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl glass-panel border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="px-3 py-2 border-b border-white/10 mb-2">
                      <p className="font-medium text-white text-sm flex items-center gap-2">
                        {user.name}
                        {user.isGuest && <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 uppercase font-black">Guest</span>}
                        {user.isVITStudent && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] uppercase font-black">VIT</span>}
                      </p>
                      <p className="text-xs text-white/50 truncate">{user.email}</p>
                      {user.registrationNumber && (
                        <p className="text-xs text-cyan-400/70 mt-0.5">{user.registrationNumber}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const el = document.getElementById("karma")
                        if (el) el.scrollIntoView({ behavior: "smooth" })
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => scrollToSection("admin")}
                      className="w-full px-3 py-2 rounded-lg text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Admin
                    </button>
                    <button
                      onClick={logout}
                      className="w-full px-3 py-2 rounded-lg text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-lg bg-[#00E5FF] text-black font-semibold text-sm hover:bg-[#00FFD1] transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-white uppercase tracking-widest hover:text-[#00E5FF] transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full Screen Menu Overlay (Mobile) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999] bg-[#020204]/98 backdrop-blur-xl lg:hidden"
          >
            <div className="h-full flex flex-col items-center justify-center">
              <nav className="flex flex-col items-center gap-2">
                {NAV_SECTIONS.map((section, index) => (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "text-3xl sm:text-4xl font-bold tracking-tight py-3 transition-colors",
                      activeSection === section.id
                        ? "text-[#00E5FF]"
                        : "text-white hover:text-[#00E5FF]"
                    )}
                  >
                    {section.label}
                  </motion.button>
                ))}
              </nav>

              {/* Auth Button in Mobile Menu */}
              {!isAuthenticated && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => {
                    setShowAuthModal(true)
                    toggleMenu()
                  }}
                  className="mt-8 px-8 py-3 rounded-xl bg-[#00E5FF] text-black font-semibold hover:bg-[#00FFD1] transition-colors"
                >
                  Sign In / Try Demo
                </motion.button>
              )}

              {/* Version */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-8 text-sm text-white/30"
              >
                VITspotCheck v2.0
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

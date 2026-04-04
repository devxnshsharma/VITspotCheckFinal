import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { motion, useSpring, useMotionValue } from "framer-motion"

export function AntigravityCursor() {
  const [isHovering, setIsHovering] = useState(false)
  const location = useLocation()

  // Motion Values for exact tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring configurations for smoothness without lag
  const springConfig = { damping: 25, stiffness: 250, mass: 0.5 }
  const ringSpringConfig = { damping: 35, stiffness: 200, mass: 0.8 }

  const ringX = useSpring(mouseX, ringSpringConfig)
  const ringY = useSpring(mouseY, ringSpringConfig)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMouseMove)
  }, [mouseX, mouseY])

  // Track hovers
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive = 
         target.closest('a') || 
         target.closest('button') || 
         target.closest('input') ||
         target.closest('[role="button"]') ||
         target.hasAttribute('data-cursor');
         
      setIsHovering(!!isInteractive);
    }
    
    document.addEventListener("mouseover", handleMouseOver)
    return () => document.removeEventListener("mouseover", handleMouseOver)
  }, [location.pathname])

  // Hide default cursor
  useEffect(() => {
    document.body.style.cursor = 'none'
    return () => { document.body.style.cursor = 'auto' }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[999999]">
      {/* Studio Ring - inertia-based */}
      <motion.div 
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 48 : 28,
          height: isHovering ? 48 : 28,
          borderColor: isHovering ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.4)",
        }}
        transition={{ type: "spring", damping: 20, stiffness: 150 }}
        className="absolute top-0 left-0 rounded-full border border-white/40 mix-blend-difference"
      />

      {/* Sharp Dot - zero-latency */}
      <motion.div 
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 0 : 1,
          opacity: isHovering ? 0 : 1,
        }}
        className="absolute top-0 left-0 w-1.5 h-1.5 bg-white rounded-full mix-blend-difference"
      />
    </div>
  )
}

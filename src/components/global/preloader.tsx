"use client"

import { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface PreloaderProps {
  onComplete: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const animateProgress = useCallback(() => {
    const startTime = Date.now()
    const minDuration = 2500 // Minimum 2.5 seconds
    
    function update() {
      const elapsed = Date.now() - startTime
      const baseProgress = Math.min(elapsed / minDuration * 100, 100)
      
      // Add some organic variation
      const variation = Math.sin(elapsed * 0.005) * 3
      const targetProgress = Math.min(baseProgress + variation, 100)
      
      setProgress(prev => prev + (targetProgress - prev) * 0.1)
      
      if (elapsed < minDuration) {
        requestAnimationFrame(update)
      } else {
        // Snap to 100%
        setProgress(100)
        
        // Hold at 100% briefly then exit
        setTimeout(() => {
          setIsExiting(true)
        }, 400)
        
        // Complete after exit animation
        setTimeout(() => {
          setIsComplete(true)
          onComplete()
        }, 1600)
      }
    }
    
    requestAnimationFrame(update)
  }, [onComplete])

  useEffect(() => {
    animateProgress()
  }, [animateProgress])

  if (isComplete) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[10000] flex items-center justify-center bg-black transition-transform duration-[1200ms]",
        isExiting && "-translate-y-full"
      )}
      style={{
        transitionTimingFunction: "cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      <div className={cn(
        "text-center transition-all duration-400",
        isExiting && "opacity-0 scale-105"
      )}>
        {/* Wordmark */}
        <div 
          className={cn(
            "flex justify-center mb-10 transition-all duration-400",
            isExiting && "opacity-0 scale-105"
          )}
        >
          <img src="/logo.png" alt="VITspotCheck" className="h-24 sm:h-32 md:h-40 lg:h-52 object-contain drop-shadow-[0_0_20px_rgba(168,216,234,0.3)]" />
        </div>
        
        {/* Counter */}
        <div 
          className={cn(
            "text-2xl font-light text-primary mb-4 transition-opacity duration-300",
            isExiting && "opacity-0"
          )}
        >
          <span className="tabular-nums">{Math.floor(progress)}</span>
          <span className="opacity-70">%</span>
        </div>
        
        {/* Progress bar */}
        <div 
          className={cn(
            "w-72 h-0.5 bg-primary/20 mx-auto overflow-hidden transition-opacity duration-300",
            isExiting && "opacity-0"
          )}
        >
          <div 
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading text */}
        <p className={cn(
          "mt-6 text-sm text-white/40 tracking-widest uppercase transition-opacity duration-300",
          isExiting && "opacity-0"
        )}>
          Campus Intelligence Loading
        </p>
      </div>
    </div>
  )
}

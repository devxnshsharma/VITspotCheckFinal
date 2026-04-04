"use client"

import { useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface PreloaderProps {
  onComplete: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    let animationFrameId: number
    let timeoutId1: NodeJS.Timeout
    let timeoutId2: NodeJS.Timeout

    // Preserve the original start time across strict-mode remounts
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }
    const startTime = startTimeRef.current
    const minDuration = 2500 // Minimum 2.5 seconds
    
    // Easing function for smooth organic progress (easeOutQuad)
    const easeOutQuad = (t: number) => t * (2 - t)

    function update() {
      const elapsed = Date.now() - startTime
      const rawProgress = Math.min(elapsed / minDuration, 1)
      
      // Apply easing to make it extremely smooth and never jump backward
      const smoothedProgress = easeOutQuad(rawProgress) * 100
      
      setProgress(smoothedProgress)
      
      if (elapsed < minDuration) {
        animationFrameId = requestAnimationFrame(update)
      } else {
        // Snap to 100%
        setProgress(100)
        
        // Hold at 100% briefly then exit
        timeoutId1 = setTimeout(() => {
          setIsExiting(true)
        }, 400)
        
        // Complete after exit animation
        timeoutId2 = setTimeout(() => {
          setIsComplete(true)
          onComplete()
        }, 1600)
      }
    }
    
    animationFrameId = requestAnimationFrame(update)

    // Cleanup handles strict mode double-invocations perfectly
    return () => {
      cancelAnimationFrame(animationFrameId)
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
    }
  }, [onComplete])

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
            className="h-full bg-primary"
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

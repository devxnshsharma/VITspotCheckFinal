"use client"

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Issue 8 — Karma Toast with Merge Queue
 * Only one karma toast is visible at a time. Subsequent awards within the
 * 3-second window are merged into the active toast instead of stacking.
 * The ✕ button always dismisses immediately.
 */
export function KarmaToast() {
  const lastUpdate = useAuthStore(s => s.lastKarmaUpdate);
  const [activeToast, setActiveToast] = useState<{
    id: number;
    points: number;
    reason: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProcessedRef = useRef<number>(0);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveToast(null);
  }, []);

  useEffect(() => {
    if (!lastUpdate || lastUpdate.timestamp === lastProcessedRef.current) return;
    lastProcessedRef.current = lastUpdate.timestamp;

    setActiveToast(prev => {
      if (prev) {
        // Merge: add points to existing toast instead of stacking
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(dismissToast, 3000);
        return {
          ...prev,
          points: prev.points + lastUpdate.delta,
          reason: lastUpdate.reason, // Show latest reason
        };
      }

      // New toast
      timerRef.current = setTimeout(dismissToast, 3000);
      return {
        id: lastUpdate.timestamp,
        points: lastUpdate.delta,
        reason: lastUpdate.reason,
      };
    });
  }, [lastUpdate, dismissToast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-24 right-8 z-[9000] pointer-events-none flex flex-col gap-3 items-end">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            key="karma-toast"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="pointer-events-auto shadow-2xl overflow-hidden relative karma-toast"
            style={{
              background: 'rgba(6, 6, 12, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${activeToast.points >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(251,113,133,0.3)'}`,
              borderRadius: '24px',
              padding: '16px 24px',
              minWidth: '280px',
              maxWidth: '360px',
            }}
            aria-live="polite"
          >
            {/* Animated background glow */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at center, ${activeToast.points >= 0 ? '#10B981' : '#FB7185'}, transparent 70%)`
              }}
            />
            
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">⚡</span>
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-[0.3em] mb-1 font-black" style={{ color: '#6B7280' }}>
                    Protocol Yield
                  </span>
                  <span className="block text-xs text-white/80 truncate font-black uppercase italic tracking-widest">
                    {activeToast.reason}
                  </span>
                </div>
              </div>
              <motion.div 
                className="font-mono text-2xl font-black shrink-0 italic"
                style={{ color: activeToast.points >= 0 ? '#FBBF24' : '#FB7185' }}
                key={activeToast.points} // Re-animate on merge
                initial={{ scale: 0.5 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                ✦ {activeToast.points >= 0 ? '+' : ''}{activeToast.points}
              </motion.div>
              {/* Dismiss button — always works */}
              <button 
                onClick={dismissToast} 
                aria-label="Dismiss"
                className="text-white/40 hover:text-white transition-colors text-sm ml-1"
              >
                ✕
              </button>
            </div>
            
            {/* Progress line shrink */}
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5"
              style={{ background: activeToast.points >= 0 ? '#10B981' : '#FB7185' }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

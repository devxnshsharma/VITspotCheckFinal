"use client"

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';

interface Toast {
  id: number;
  delta: number;
  reason: string;
}

export function KarmaToast() {
  const lastUpdate = useAuthStore(s => s.lastKarmaUpdate);
  const [activeToasts, setActiveToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (lastUpdate) {
      const newToast = {
        id: lastUpdate.timestamp,
        delta: lastUpdate.delta,
        reason: lastUpdate.reason
      };
      
      setActiveToasts(prev => [...prev, newToast]);
      
      // Auto-remove after 4 seconds
      const timer = setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="fixed bottom-24 right-8 z-[100] pointer-events-none flex flex-col gap-3 items-end">
      <AnimatePresence>
        {activeToasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="pointer-events-auto shadow-2xl overflow-hidden relative"
            style={{
              background: 'rgba(6, 6, 12, 0.95)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${toast.delta >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(251,113,133,0.3)'}`,
              borderRadius: '24px',
              padding: '16px 24px',
              minWidth: '280px',
              maxWidth: '360px'
            }}
          >
            {/* Animated background glow */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at center, ${toast.delta >= 0 ? '#10B981' : '#FB7185'}, transparent 70%)`
              }}
            />
            
            <div className="relative z-10 flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-[0.3em] mb-2 font-black" style={{ color: '#6B7280' }}>
                  Protocol Yield
                </span>
                <span className="block text-xs text-white/80 truncate font-black uppercase italic tracking-widest">
                  {toast.reason}
                </span>
              </div>
              <motion.div 
                className="font-mono text-2xl font-black shrink-0 italic"
                style={{ color: toast.delta >= 0 ? '#FBBF24' : '#FB7185' }}
                initial={{ scale: 0.5 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                ✦ {toast.delta >= 0 ? '+' : ''}{toast.delta}
              </motion.div>
            </div>
            
            {/* Progress line shrink */}
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5"
              style={{ background: toast.delta >= 0 ? '#10B981' : '#FB7185' }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

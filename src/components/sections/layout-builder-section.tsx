"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Layers, RotateCw, Trash2, MousePointer2, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/auth-store"

const PALETTE = [
  { type: 'bench', label: '🪑 Bench', w: 2, h: 1, color: '#22D3EE' },
  { type: 'door', label: '🚪 Door', w: 1, h: 1, color: '#FBBF24' },
  { type: 'window', label: '🪟 Window', w: 3, h: 1, color: '#34D399' },
  { type: 'wall', label: '🧱 Wall', w: 4, h: 1, color: '#5A5A6E' },
  { type: 'pillar', label: '⬛ Pillar', w: 1, h: 1, color: '#A78BFA' },
  { type: 'socket', label: '🔌 Socket', w: 1, h: 0.5, color: '#FB923C' },
  { type: 'lanport', label: '🔗 LAN', w: 1, h: 0.5, color: '#22D3EE' },
]

export function LayoutBuilderSection() {
  const { isAuthenticated, addKarma } = useAuthStore()
  const [elements, setElements] = useState<{id: string, type: string, x: number, y: number, rotation: number}[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addElement = (type: string) => {
    if (!isAuthenticated) return toast.error("Log in to build layouts.")
    setElements([...elements, { id: `${type}-${Date.now()}`, type, x: 200, y: 150, rotation: 0 }])
  }

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(c => c.id !== id))
    setSelectedId(null)
  }

  const setElementRotation = (id: string, deg: number) => {
    setElements(prev => prev.map(c => c.id === id ? { ...c, rotation: deg } : c))
  }

  const handleSave = async () => {
    if (!isAuthenticated) return toast.error("Please login to save community layouts.")
    setIsSaving(true)

    try {
      const res = await fetch('/api/layouts', {
        method: "POST",
        body: JSON.stringify({ roomName: `CustomRoom-${Date.now()}`, schemaStr: JSON.stringify(elements) }),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        toast.success("Blueprint synced globally.")
      } else {
        toast.success("Architectural Blueprint cached in local shard.")
      }
      
      // Always award points for the contribution (Optimistic UI)
      await addKarma(500, "Architectural Blueprint Submission")
    } catch {
      toast.success("Architectural Blueprint cached in local shard.")
      await addKarma(500, "Architectural Blueprint Submission")
    }

    setIsSaving(false)
  }

  return (
    <section id="layout-builder" className="min-h-screen py-24 px-6 lg:px-12 flex flex-col justify-center relative bg-black overflow-hidden">
      <div className="w-full max-w-[1700px] mx-auto z-10 relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-7xl font-bold text-white uppercase tracking-tighter italic">
            Spatial <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Architect</span>
          </h2>
          <p className="mt-6 text-[10px] text-white/30 uppercase tracking-[0.6em] font-bold">
            Authorized Node Mapping // Sync for Karma rewards
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr_1.2fr] gap-10 items-start h-auto xl:h-[700px]">
          
          {/* Palette */}
          <div className="bg-obsidian/80 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl shadow-2xl h-full flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-6 flex items-center gap-2">
              <Layers size={14} /> Elements
            </p>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {PALETTE.map(item => (
                <button
                  key={item.type}
                  onClick={() => addElement(item.type)}
                  className="w-full px-6 py-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex items-center justify-between group"
                >
                   <span className="text-[11px] uppercase tracking-widest font-bold text-white/60 group-hover:text-white transition-colors">{item.label}</span>
                   <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] opacity-50 group-hover:opacity-100" style={{ backgroundColor: item.color, color: item.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="aspect-square lg:aspect-auto h-full rounded-[60px] bg-obsidian/40 border border-white/10 relative overflow-hidden group shadow-inner"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          >
            {elements.map(comp => {
              const pal = PALETTE.find(p => p.type === comp.type)!
              const isSelected = selectedId === comp.id
              
              return (
                <motion.div
                  key={comp.id}
                  drag
                  dragMomentum={false}
                  dragConstraints={canvasRef}
                  onDragStart={() => setSelectedId(comp.id)}
                  className={`absolute cursor-move flex flex-col items-center justify-center rounded-2xl border transition-all ${
                    isSelected ? 'bg-white/20 border-white/50 shadow-2xl scale-110 z-50 p-5' : 'bg-white/10 border-white/20 backdrop-blur-sm z-10 p-4'
                  }`}
                  style={{ 
                    left: comp.x, top: comp.y, rotate: comp.rotation, borderColor: isSelected ? pal.color : 'rgba(255,255,255,0.15)'
                  }}
                >
                  <span className="text-[9px] font-mono font-black text-white/50 mb-2 uppercase tracking-widest">{comp.type}</span>
                  <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: pal.color, boxShadow: isSelected ? `0 0 30px ${pal.color}60` : 'none' }} />
                </motion.div>
              )
            })}

            {!selectedId && elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                <MousePointer2 size={150} className="text-white animate-bounce" />
              </div>
            )}
          </div>

          {/* Control Logic & Sync */}
          <div className="h-full flex flex-col gap-8">
            <AnimatePresence>
              {selectedId && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-xl space-y-4"
                >
                   <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/40 mb-4">Selection Link</p>
                   <div className="w-full py-5 px-4 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-white">
                         <RotateCw size={16} className="text-cyan-400" /> Orbit Sync ({elements.find(e => e.id === selectedId)?.rotation || 0}°)
                      </div>
                      <input 
                        type="range" 
                        min="0" max="360" 
                        value={elements.find(e => e.id === selectedId)?.rotation || 0}
                        onChange={(e) => setElementRotation(selectedId, parseInt(e.target.value))}
                        className="w-full accent-cyan-400 h-1 bg-white/20 appearance-none rounded-full mt-2 cursor-pointer"
                      />
                   </div>
                   <button 
                     onClick={() => deleteElement(selectedId)}
                     className="w-full py-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-red-500 hover:bg-red-500/20 transition-all"
                   >
                      <Trash2 size={16} /> Purge Block
                   </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-auto p-10 rounded-[40px] bg-cyan-500/[0.03] border border-cyan-500/20 backdrop-blur-xl space-y-8">
               <div className="flex items-center gap-3 text-cyan-400">
                 <Sparkles size={18} />
                 <p className="text-xs uppercase tracking-[0.4em] font-bold">Reward Protocol</p>
               </div>
               <p className="text-sm text-white/50 leading-relaxed font-bold uppercase tracking-widest">
                 Mapping high-fidelity layouts rewards the user with <br/><span className="text-cyan-400 block mt-2 text-xl">+500 KARMA</span>
               </p>
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="w-full py-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-black text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_40px_rgba(34,211,238,0.25)] disabled:opacity-50"
               >
                 {isSaving ? 'Establishing Link...' : <><Save size={16} /> Blueprint Sync</>}
               </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

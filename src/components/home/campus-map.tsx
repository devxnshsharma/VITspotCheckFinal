"use client"

import { motion } from "framer-motion"
import { useState, useMemo, useEffect } from "react"
import { Layers } from "lucide-react"
import { useRoomStore } from "@/lib/store"
import { BUILDINGS, ROOMS } from "@/lib/mock-data"
import type { Room } from "@/lib/store"
import { useNavigate, useLocation, useParams } from "react-router-dom"

const STATUS_COLORS: Record<string, string> = {
  empty: "#34D399",
  occupied: "#FB923C",
  unverified: "#FBBF24",
  conflict: "#FB7185",
}

const BUILDING_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  PRP: { x: 20, y: 20, w: 160, h: 160 },
  SJT: { x: 210, y: 35, w: 120, h: 130 },
  AB1: { x: 360, y: 30, w: 140, h: 140 },
  AB2: { x: 530, y: 55, w: 110, h: 90 },
  GDN: { x: 530, y: 175, w: 110, h: 90 },
  SMV: { x: 80, y: 240, w: 110, h: 90 },
  MB:  { x: 240, y: 250, w: 100, h: 80 },
}

const CONNECTING_PATHS = [
  "M 180 100 L 210 100",
  "M 330 100 L 360 100",
  "M 500 100 L 530 100",
  "M 585 145 L 585 175",
  "M 100 180 L 100 240",
  "M 190 285 L 240 290",
]

function BuildingShape({ building, roomData }: {
  building: typeof BUILDINGS[0]
  roomData: { emptyCount: number; total: number }
}) {
  const { emptyCount, total } = roomData
  const emptyRatio = total > 0 ? emptyCount / total : 0

  const strokeColor = emptyRatio > 0.5 ? "#34D399" : emptyRatio > 0.3 ? "#FBBF24" : "#FB7185"
  const fillColor = `${strokeColor}10`

  return (
    <>
      <rect x={0} y={0} width={1} height={1} fill={fillColor} stroke={strokeColor} strokeWidth={0.012} rx={0.05} opacity={0.9} />
      <rect x={0.03} y={0.03} width={0.94} height={0.94} fill="none" stroke={strokeColor} strokeWidth={0.003} rx={0.04} opacity={0.2} />
      <text x={0.5} y={0.35} fill={strokeColor} fontSize={0.14} fontWeight="700" textAnchor="middle" fontFamily="var(--font-inter), sans-serif">
        {building.shortName}
      </text>
      <text x={0.5} y={0.55} fill="#9B9BB0" fontSize={0.075} fontFamily="monospace" textAnchor="middle">
        {emptyCount}/{total} empty
      </text>
      <text x={0.5} y={0.72} fill="#555568" fontSize={0.055} fontFamily="monospace" textAnchor="middle">
        {building.floors.length} floors
      </text>
    </>
  )
}

export function CampusMap() {
  const router = useNavigate()
  const { selectedBuilding, selectBuilding } = useRoomStore()
  const [viewMode, setViewMode] = useState<"campus" | "floor">("campus")
  const [selectedFloor, setSelectedFloor] = useState(0)
  // Defer room data to client to avoid hydration mismatch (ROOMS uses Math.random)
  const [clientRooms, setClientRooms] = useState<Room[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setClientRooms(ROOMS)
    setIsMounted(true)
  }, [])

  const activeBuilding = BUILDINGS.find(b => b.id === selectedBuilding) || BUILDINGS[0]
  const blockRooms = useMemo(() => clientRooms.filter(r => r.block === (selectedBuilding || BUILDINGS[0].id)), [selectedBuilding, clientRooms])
  const floorRooms = useMemo(() => blockRooms.filter(r => r.floor === selectedFloor), [blockRooms, selectedFloor])

  // Pre-compute room data per building on client
  const buildingRoomData = useMemo(() => {
    const data: Record<string, { emptyCount: number; total: number }> = {}
    for (const b of BUILDINGS) {
      const rooms = clientRooms.filter(r => r.block === b.id)
      data[b.id] = { emptyCount: rooms.filter(r => r.status === "empty").length, total: rooms.length }
    }
    return data
  }, [clientRooms])

  // Don't render anything with random data until client-mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <div className="h-full relative flex items-center justify-center" style={{ background: "#0A0A0A", minHeight: 400 }}>
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/5 border border-white/10" />
          <p className="text-xs text-white/30 uppercase tracking-widest font-bold">Loading Campus Map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative" style={{ background: "#0A0A0A", minHeight: 400 }}>
      {/* View mode toggle */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <button
          onClick={() => setViewMode("campus")}
          className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border transition-all ${
            viewMode === "campus"
              ? "bg-white text-black border-white"
              : "text-white/40 border-white/10 hover:border-white/30 hover:text-white"
          }`}
        >
          Campus
        </button>
        <button
          onClick={() => setViewMode("floor")}
          className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border transition-all ${
            viewMode === "floor"
              ? "bg-white text-black border-white"
              : "text-white/40 border-white/10 hover:border-white/30 hover:text-white"
          }`}
        >
          Floor View
        </button>
      </div>

      {viewMode === "campus" ? (
        <svg viewBox="0 0 800 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Dot grid */}
          <defs>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.5" fill="rgba(255,255,255,0.03)" />
            </pattern>
          </defs>
          <rect width="800" height="380" fill="url(#dot-grid)" />

          {/* Connecting paths */}
          {CONNECTING_PATHS.map((d, i) => (
            <path key={i} d={d} stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="4 4">
              <animate attributeName="stroke-dashoffset" from="8" to="0" dur="2s" repeatCount="indefinite" />
            </path>
          ))}

          {/* Buildings */}
          {isMounted && BUILDINGS.map((building, idx) => {
            const pos = BUILDING_POSITIONS[building.id]
            if (!pos) return null
            return (
              <g
                key={building.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => {
                  selectBuilding(building.id)
                  setViewMode("floor")
                  setSelectedFloor(building.floors[0] || 0)
                }}
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${pos.x},${pos.y}; ${pos.x},${pos.y - 5}; ${pos.x + 1},${pos.y - 3}; ${pos.x},${pos.y}`}
                  dur={`${6 + idx * 0.8}s`}
                  repeatCount="indefinite"
                />
                <g transform={`scale(${pos.w}, ${pos.h})`}>
                  <BuildingShape
                    building={building}
                    roomData={buildingRoomData[building.id] || { emptyCount: 0, total: 0 }}
                  />
                </g>
              </g>
            )
          })}

          {/* Legend */}
          <g transform="translate(620, 315)">
            {[
              { color: "#34D399", label: "Available" },
              { color: "#FBBF24", label: "Limited" },
              { color: "#FB7185", label: "Full" },
            ].map((item, i) => (
              <g key={i} transform={`translate(${i * 58}, 0)`}>
                <circle cx={4} cy={4} r={3} fill={item.color} opacity={0.3} />
                <text x={12} y={7} fill="#555568" fontSize="7" fontFamily="sans-serif">{item.label}</text>
              </g>
            ))}
          </g>
        </svg>
      ) : (
        /* Floor View */
        <div className="p-5 pt-16 h-full overflow-auto">
          {/* Floor selector */}
          <div className="flex items-center gap-3 mb-6">
            <Layers size={20} className="text-indigo-400" />
            <span className="text-sm font-bold text-white uppercase tracking-tight italic">
              {activeBuilding.name}
            </span>
            <span className="text-white/20 text-xs">—</span>
            <div className="flex gap-2">
              {activeBuilding.floors.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-full border transition-all ${
                    selectedFloor === f
                      ? "bg-white text-black border-white"
                      : "text-white/40 border-white/10 hover:border-white/30"
                  }`}
                >
                  F{f}
                </button>
              ))}
            </div>
          </div>

          {/* Room grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {floorRooms.map((room, idx) => (
              <motion.div
                key={room.id}
                onClick={() => router(`/room/${room.id}`)}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] cursor-pointer backdrop-blur-sm hover:bg-white/[0.06] transition-all"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                style={{ borderLeft: `3px solid ${STATUS_COLORS[room.status]}` }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-base font-bold" style={{ color: STATUS_COLORS[room.status] }}>
                    {room.name}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: STATUS_COLORS[room.status],
                      boxShadow: `0 0 8px ${STATUS_COLORS[room.status]}50`,
                      animation: room.status === "empty" ? "pulse 2s ease-in-out infinite" : undefined,
                    }}
                  />
                </div>
                <span
                  className="text-xs capitalize inline-block mb-3 px-2 py-0.5 rounded-full"
                  style={{
                    color: STATUS_COLORS[room.status],
                    background: `${STATUS_COLORS[room.status]}10`,
                    border: `1px solid ${STATUS_COLORS[room.status]}25`,
                  }}
                >
                  {room.status}
                </span>
                <div className="flex items-center gap-3 mb-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-xs text-white/35">
                    {room.type === "lab" ? "🔬 Lab" : "📖 Theory"}
                  </span>
                  <span className="text-xs text-white/35">{room.capacity} seats</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs font-mono text-cyan-400">📶 {room.utilities.wifi}%</span>
                  <span className="text-xs font-mono text-amber-400">🔌 {room.utilities.sockets}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

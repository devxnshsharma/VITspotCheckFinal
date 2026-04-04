import type { Room, Building, User, FeedEvent, Booking, RoomStatus } from "./store"

export interface SpeedtestResult {
  id: string;
  roomId: string;
  userId: string;
  benchPosition: string;
  isp: string;
  download: number;
  upload: number;
  latency: number;
  timestamp: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  position: string;
  condition: 'working' | 'broken' | 'unknown';
  type: string;
}

export interface KarmaEvent {
  id: string;
  delta: number;
  reason: string;
  timestamp: string;
}

// Buildings data
export const BUILDINGS: Building[] = [
  { id: "AB1", name: "Academic Block 1", shortName: "AB1", totalRooms: 45, emptyRooms: 12, floors: [0, 1, 2, 3] },
  { id: "AB2", name: "Academic Block 2", shortName: "AB2", totalRooms: 45, emptyRooms: 23, floors: [0, 1, 2, 3] },
  { id: "PRP", name: "PRP Block", shortName: "PRP", totalRooms: 32, emptyRooms: 8, floors: [0, 1, 2] },
  { id: "SJT", name: "SJT Block", shortName: "SJT", totalRooms: 40, emptyRooms: 15, floors: [0, 1, 2, 3, 4] },
  { id: "MB", name: "Main Building", shortName: "MB", totalRooms: 28, emptyRooms: 5, floors: [0, 1, 2] },
  { id: "GDN", name: "GDN Block", shortName: "GDN", totalRooms: 35, emptyRooms: 19, floors: [0, 1, 2, 3] },
  { id: "SMV", name: "SMV Block", shortName: "SMV", totalRooms: 30, emptyRooms: 11, floors: [0, 1, 2] },
]

// Generate rooms for a building
function generateRooms(building: Building): Room[] {
  const rooms: Room[] = []
  const statuses: RoomStatus[] = ["empty", "occupied", "unverified", "conflict"]
  const types: ("classroom" | "lab")[] = ["classroom", "lab"]

  building.floors.forEach((floor) => {
    const roomsPerFloor = Math.floor(building.totalRooms / building.floors.length)
    
    for (let i = 1; i <= roomsPerFloor; i++) {
      const roomNumber = `${floor}${String(i).padStart(2, "0")}`
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const isLab = Math.random() < 0.2 // 20% chance of being a lab
      
      rooms.push({
        id: `${building.id}-${roomNumber}`,
        name: `${building.shortName}-${roomNumber}`,
        block: building.id,
        floor,
        capacity: isLab ? 60 : Math.floor(Math.random() * 30) + 30,
        status,
        type: isLab ? "lab" : "classroom",
        lastVerified: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        lastVerifiedBy: `user_${Math.floor(Math.random() * 100)}`,
        utilities: {
          wifi: Math.floor(Math.random() * 50),
          sockets: Math.floor(Math.random() * 30) + 70,
          ac: Math.floor(Math.random() * 20) + 80,
          quietness: Math.floor(Math.random() * 40) + 60,
          lighting: Math.floor(Math.random() * 20) + 80,
        },
        network: {
          download: Math.floor(Math.random() * 50),
          upload: Math.floor(Math.random() * 20) + 10,
          ping: Math.floor(Math.random() * 30) + 10,
        },
      })
    }
  })

  return rooms
}

// Ensure PRP-203 exists explicitly if missing
const ROOMS_RAW: Room[] = BUILDINGS.flatMap(generateRooms)
if (!ROOMS_RAW.find(r => r.id === 'PRP-203')) {
    ROOMS_RAW.push({
        id: 'PRP-203',
        name: 'PRP-203',
        block: 'PRP',
        floor: 2,
        capacity: 45,
        status: 'empty',
        type: 'classroom',
        lastVerified: new Date().toISOString(),
        lastVerifiedBy: 'system_core',
        utilities: { wifi: 88, sockets: 92, ac: 85, quietness: 78, lighting: 95 },
        network: { download: 42, upload: 18, ping: 12 }
    });
}
export const ROOMS: Room[] = ROOMS_RAW;

// Current user
export const CURRENT_USER: User = {
  id: "user_1",
  name: "Arjun Kumar",
  avatar: undefined,
  karma: 1250,
  trustTier: "trusted",
  verificationsCount: 156,
  joinedAt: "2024-08-15T10:30:00Z",
}

// Generate feed events
export function generateFeedEvents(count: number = 20): FeedEvent[] {
  const actions = [
    { type: "verification" as const, templates: ["verified room empty", "marked room occupied", "confirmed availability"] },
    { type: "speedtest" as const, templates: ["ran speedtest"] },
    { type: "booking" as const, templates: ["booked space", "cancelled booking"] },
    { type: "status_change" as const, templates: ["reported conflict", "updated status"] },
  ]
  
  const names = ["Priya S.", "Rahul M.", "Sneha K.", "Vikram R.", "Ananya T.", "Karthik N.", "Divya P.", "Arun V."]
  
  return Array.from({ length: count }, (_, i) => {
    const actionGroup = actions[Math.floor(Math.random() * actions.length)]
    const action = actionGroup.templates[Math.floor(Math.random() * actionGroup.templates.length)]
    const room = ROOMS[Math.floor(Math.random() * ROOMS.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    
    return {
      id: `event_${i}`,
      type: actionGroup.type,
      userId: `user_${Math.floor(Math.random() * 100)}`,
      userName: name,
      roomId: room.id,
      roomName: room.name,
      action,
      karma: actionGroup.type === "verification" ? 5 : actionGroup.type === "speedtest" ? 3 : 0,
      timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      data: actionGroup.type === "speedtest" ? {
        download: Math.floor(Math.random() * 50) + 30,
        upload: Math.floor(Math.random() * 20) + 10,
      } : undefined,
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const FEED_EVENTS = generateFeedEvents(20)

// Sample bookings
export const BOOKINGS: Booking[] = [
  {
    id: "booking_1",
    roomId: "AB1-201",
    userId: "user_1",
    date: "2026-04-05",
    startTime: "14:00",
    endTime: "16:00",
    status: "confirmed",
    purpose: "Project Discussion",
  },
  {
    id: "booking_2",
    roomId: "SJT-305",
    userId: "user_1",
    date: "2026-04-06",
    startTime: "10:00",
    endTime: "12:00",
    status: "pending",
    purpose: "Study Group",
  },
  {
    id: "booking_3",
    roomId: "PRP-102",
    userId: "user_1",
    date: "2026-04-03",
    startTime: "09:00",
    endTime: "11:00",
    status: "completed",
    purpose: "Team Meeting",
  },
]

// Live stats
export const LIVE_STATS = {
  totalEmpty: BUILDINGS.reduce((acc, b) => acc + b.emptyRooms, 0),
  totalRooms: BUILDINGS.reduce((acc, b) => acc + b.totalRooms, 0),
  activeUsers: 234,
  lastUpdate: "2s ago",
  networkAvg: 87,
  activeBookings: 12,
}

// Time slots for booking
export const TIME_SLOTS = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" },
  { start: "14:00", end: "15:00" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
]

// FFCS comparison slots
export const FFCS_SLOTS = [
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2",
  "F1", "F2", "G1", "G2", "TA1", "TA2", "TB1", "TB2", "TC1", "TC2",
]

// Leaderboard data
export const LEADERBOARD: User[] = [
  { id: "user_top1", name: "Aditya R.", karma: 4520, trustTier: "elite", verificationsCount: 892, joinedAt: "2024-01-10" },
  { id: "user_top2", name: "Meera S.", karma: 3890, trustTier: "elite", verificationsCount: 756, joinedAt: "2024-02-15" },
  { id: "user_top3", name: "Rohan K.", karma: 3245, trustTier: "trusted", verificationsCount: 623, joinedAt: "2024-03-20" },
  { id: "user_top4", name: "Priya N.", karma: 2980, trustTier: "trusted", verificationsCount: 567, joinedAt: "2024-04-05" },
  { id: "user_top5", name: "Vikash M.", karma: 2650, trustTier: "trusted", verificationsCount: 498, joinedAt: "2024-05-12" },
  { id: "user_1", name: "Arjun Kumar", karma: 1250, trustTier: "trusted", verificationsCount: 156, joinedAt: "2024-08-15" },
]

// Seat heatmap data for speedtest
export function generateSeatHeatmap(rows: number = 6, cols: number = 8) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      download: Math.floor(Math.random() * 60) + 20,
      upload: Math.floor(Math.random() * 25) + 5,
      ping: Math.floor(Math.random() * 40) + 10,
      isp: ["JIO", "Airtel", "VIT WiFi"][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }))
  )
}

export function generateSpeedtestHistory(roomId: string): SpeedtestResult[] {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `st-${roomId}-${i}`,
    roomId,
    userId: `24BCE${Math.floor(Math.random() * 9000 + 1000)}`,
    benchPosition: `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 8 + 1)}`,
    isp: ["Jio", "Airtel", "VIT WiFi"][Math.floor(Math.random() * 3)],
    download: Math.floor(Math.random() * 95 + 5),
    upload: Math.floor(Math.random() * 48 + 2),
    latency: Math.floor(Math.random() * 75 + 5),
    timestamp: new Date(Date.now() - Math.random() * 4320 * 60000).toISOString(),
  }));
}

export function generateEquipment(): EquipmentItem[] {
  const types = ['PC', 'Monitor', 'Oscilloscope', 'Function Generator', 'Multimeter', 'Soldering Station', 'Arduino Kit', 'Raspberry Pi'];
  return Array.from({ length: 24 }, (_, i) => ({
    id: `eq-${i}`,
    name: `${types[Math.floor(Math.random() * types.length)]} ${i + 1}`,
    position: `Row ${Math.ceil((i + 1) / 6)}, Pos ${((i) % 6) + 1}`,
    condition: (['working', 'working', 'working', 'broken', 'unknown'] as const)[Math.floor(Math.random() * 5)],
    type: types[Math.floor(Math.random() * types.length)],
  }));
}

export function generateBenchHeatmap(isp: string) {
  const rows = 6;
  const cols = 8;
  const benches: { row: number; col: number; label: string; speed: number; readings: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const base = isp === 'VIT WiFi' ? 40 : isp === 'Jio' ? 35 : isp === 'Airtel' ? 30 : 15;
      const posBonus = (c / cols) * 25;
      const speed = Math.max(3, base + posBonus + (Math.random() * 30 - 15));
      benches.push({
        row: r,
        col: c,
        label: `${String.fromCharCode(65 + r)}-${c + 1}`,
        speed: Math.round(speed),
        readings: Math.floor(Math.random() * 14 + 2),
      });
    }
  }
  return benches;
}

export function generateKarmaEvents(): KarmaEvent[] {
  return [
    { id: 'k1', delta: 15, reason: 'Speedtest submitted for SJT-402', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'k2', delta: 10, reason: 'Room status report validated', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: 'k3', delta: 5, reason: 'Room status report submitted', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: 'k4', delta: -25, reason: 'Report contested and found incorrect', timestamp: new Date(Date.now() - 120 * 60000).toISOString() },
    { id: 'k5', delta: 50, reason: '5th speedtest — heatmap unlocked for TT-301!', timestamp: new Date(Date.now() - 180 * 60000).toISOString() },
  ];
}

export const TRUST_TIERS_CONFIG = {
  OBSERVER: { range: '0–99', color: '#6B7280', label: 'OBSERVER', weight: 0.5 },
  SPOTTER: { range: '100–499', color: '#00FF94', label: 'SPOTTER', weight: 1.0 },
  NAVIGATOR: { range: '500–1499', color: '#00E5FF', label: 'NAVIGATOR', weight: 1.5 },
  ARCHITECT: { range: '1500–2999', color: '#B14FFF', label: 'ARCHITECT', weight: 2.0 },
  ORACLE: { range: '3000+', color: '#FFB830', label: 'ORACLE', weight: 2.5 },
};

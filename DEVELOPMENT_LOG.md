# 🗓️ Development Log: VITspotCheck

This log documents the end-to-end development journey of **VITspotCheck**, a campus intelligence platform. It tracks progress from initial concept to the final production-ready application.

---

## 🚀 Phase 1: Foundation & Design (Week 1)
**Goal:** Establish the project identity and core UI architecture.

*   **Day 1-2:** **Project Initiation**
    *   Defined project scope: Real-time room tracking, booking, and network mapping.
    *   Set up **Vite 8 + React 19** environment.
    *   Initialized **Tailwind CSS 4** and configured design tokens (Cyberpunk palette: Void Black, Neon Green, Electric Purple).
*   **Day 4-5:** **UI Architecture**
    *   Implemented global glassmorphism surfaces (`backdrop-blur-24`).
    *   Set up **Shadcn/UI** and custom layout components.
    *   Integrated **Lucide Icons** and **Outfit** typography.

## 🗺️ Phase 2: Interactive Mapping (Week 2)
**Goal:** Build the visual core of the application.

*   **Day 1-3:** **SVG Map Engine**
    *   Developed custom SVG maps for SJT, TT, PRP, SMV, and MB blocks.
    *   Implemented interactive "Room Pulse" logic using **Framer Motion**.
    *   Built the floor-navigation sidebar.
*   **Day 4-7:** **State Management**
    *   Integrated **Zustand** for global state (tracking current floor, block, and selected room).
    *   Created the "Room Detail" slide-over panel.

## ⚙️ Phase 3: Backend & Data (Week 3)
**Goal:** Create the intelligence layer and persistence.

*   **Day 1-2:** **Server Setup**
    *   Initialized **Node.js Express** server with TypeScript (`tsx`).
    *   Set up **Prisma 6** with an **SQLite** (`dev.db`) local database.
*   **Day 3-5:** **Schema Design**
    *   Defined core models: `User`, `Room`, `Booking`, `KarmaEvent`, and `Speedtest`.
    *   Implemented `authMiddleware` for Firebase ID token verification.
*   **Day 6-7:** **API Foundations**
    *   Built `/api/users` and `/api/rooms` status endpoints.
    *   Integrated **Firebase Auth** restrictively to `@vitstudent.ac.in`.

## ⚡ Phase 4: Feature Integration (Week 4)
**Goal:** Implement complex logic and gamification.

*   **Day 1-3:** **The Karma Engine**
    *   Built the `awardKarma` utility (single path for all points).
    *   Implemented Trust Tiers: Observer, Spotter, Navigator, Architect, Oracle.
    *   Created the **Karma Toast** notification system.
*   **Day 4-5:** **Booking & Conflict Logic**
    *   Developed the room reservation form with **Zod validation**.
    *   Implemented atomic conflict checks in the backend to prevent double-bookings.
*   **Day 6-7:** **Network Intelligence**
    *   Integrated **Cloudflare Speedtest** API.
    *   Built the "WiFi Hotspot" heatmap visualization.

## 🛠️ Phase 5: QA & Integration Fixes (Week 5)
**Goal:** Resolve critical bugs and improve data persistence (See `BugFixSpec_1.md`).

*   **Issue 1-3 Fixed:** Resolved "First-login Karma" grant delay and fixed the "Book Space" persistence bug.
*   **Issue 4 Fixed:** Implemented **Session Persistence**. The app now remembers your last block/floor via the `user_sessions` table.
*   **Issue 6-7 Fixed:** Replaced static leaderboard data with live database queries and built the **Admin Karma Log** for moderation.
*   **Issue 8 Fixed:** Optimized the Karma Popup to prevent spam through a managed toast queue.

## 🏁 Phase 6: Final Polish & Deployment (Week 6)
**Goal:** Optimization, responsiveness, and documentation.

*   **Day 1-3:** **Mobile Responsiveness**
    *   Implemented a drawer-based navigation for mobile views.
*   **Day 4-5:** **Performance Optimization**
    *   Optimized SVG map files for <100ms load times.
*   **Day 6-7:** **Final Documentation**
    *   Updated `README.md` with full setup instructions.
    *   Completed the **Final Action Checklist**.

---

### 📝 Project Stats
- **Total Components:** 45+
- **Database Tables:** 7
- **Project Roles:** Lead Architect, Frontend Dev, UI/UX Designer, Project Manager.
- **Form Validations:** 4 (Booking, Reporting, Speedtest, Profile).

"Built for students, by students. Driven by data, powered by the VIT community."

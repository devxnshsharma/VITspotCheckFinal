# VITspotCheck

**Campus Intelligence Platform** *Real-time. Crowdsourced. Trust-weighted. FFCS-aware.*

[](https://reactjs.org/)
[](https://www.typescriptlang.org/)
[](https://tailwindcss.com/)
[](https://nestjs.com/)
[](https://postgresql.org/)
[](https://redis.io/)



-----

## 🌌 The Vision

**VITspotCheck is not a timetable viewer. It is not a booking system. It is a living intelligence layer on top of VIT's physical campus.**

Built for the 25,000+ students at Vellore Institute of Technology (VIT), this platform eliminates the friction of wandering blocks like SJT or TT searching for open, well-connected study rooms. It combines crowdsourced room availability, network quality mapping, classroom condition reporting, and a self-hosted lab booking portal—all backed by a trust-weighted karma engine and real-time Socket.IO synchronization.

## ⚡ Core Capabilities

  * **Real-Time Campus Map:** Interactive, floor-navigable SVG maps of all major blocks (SJT, TT, PRP, SMV, MB). Rooms pulse with live states: 🟢 Empty, 🔴 Occupied, 🟡 Unverified, or ⚠️ Conflict.
  * **Crowdsourced Status Engine:** Live reporting with Redis-backed TTL (1hr for theory, 2hr for labs). Reports are weighted by user Karma.
  * **Network Hotspot Heatmaps:** Integrated Ookla/fast.com speedtests capture Mbps and latency per bench. WebGL-powered heatmaps show exactly where to sit for the best WiFi.
  * **FFCS Classroom Intelligence:** Overlays the official daily schedule. A "Time-Travel" slider projects future availability based on FFCS cycles and existing bookings.
  * **Trust & Karma System:** A gamified trust engine (Observer to Oracle tiers). Accurate reports earn Karma (+✦); contested reports lose it.
  * **VERI Conflict Resolution:** An automated terminal-style chatbot (Verification Intelligence) arbitrates conflicting room reports in real-time.
  * **Self-Hosted Booking Portal:** Ad-hoc room and lab booking for clubs and class reps, protected against double-bookings and synced instantly to the global map.
  * **Utility Radar & Lab Health:** Pentagon D3.js charts displaying WiFi, socket availability, AC, noise levels, and broken equipment reports.

-----

## 🎨 The Design Mandate: *Dark Campus Cyberpunk*

Any contributor to this repository must adhere strictly to the design system. VITspotCheck feels like a living command center—NASA flight operations merged with a Tokyo transit map.

  * **Palette:** Void black (`#0A0A0F`) base. Neon green (`#00FF94`) for primary actions. Electric purple (`#B14FFF`) for accents. Cyan (`#00E5FF`) for data. Amber & Hot Pink for warnings. **No whites. No pastels. No Material Design blues.**
  * **Typography:** `Outfit` for geometric, futuristic headings. `JetBrains Mono` for data, speed numbers, and coordinates.
  * **Surfaces:** Glassmorphism everywhere. Semi-transparent panels (`backdrop-blur: 24px`), 1px borders at 20% opacity, and neon box shadows. No flat opaque cards.
  * **Motion:** Everything is alive. WebSocket-driven micro-animations, pulsing live indicators, physics-based map panning, and GPU-accelerated page transitions.

-----

## 🛠️ Architecture & Tech Stack

### Frontend (PWA)

  * **Framework:** React 18, Vite, TypeScript
  * **Styling:** Tailwind CSS + custom CSS variables, highly customized `shadcn/ui`
  * **State & Data:** Zustand (global state), Socket.IO Client (real-time)
  * **Visuals:** Leaflet.js/Mapbox GL JS (Mapping), D3.js + WebGL Canvas (Heatmaps), Framer Motion (Animations)

### Backend (API Cluster)

  * **Framework:** Node.js 20 LTS, NestJS
  * **Database:** PostgreSQL 15 with Prisma ORM
  * **Caching & Real-time:** Redis 7 (TTL decay, Socket.IO pub/sub fan-out)
  * **Auth:** Passport.js + Google OAuth 2.0 (Restricted to `@vitstudent.ac.in`)
  * **Tasks:** `node-cron` for data freshness and stale record tagging

### Infrastructure

  * **Hosting:** Vercel (Frontend), Railway/Render (Backend cluster)
  * **Storage:** Cloudflare Pages R2 (SVG map tiles), Cloudinary (Equipment photos)
  * **CI/CD:** GitHub Actions (Linting, type-checks, Vitest unit tests, Playwright E2E)

-----

## 🚀 Getting Started (Local Development)

### Prerequisites

  * Node.js 20 LTS
  * pnpm (`npm install -g pnpm`)
  * Docker & docker-compose (for local Postgres & Redis)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-org/vitspotcheck.git
    cd vitspotcheck
    ```

2.  **Install dependencies (Monorepo setup):**

    ```bash
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Copy the example env files in both `apps/web` and `apps/api`.

    ```bash
    cp apps/api/.env.example apps/api/.env
    cp apps/web/.env.example apps/web/.env
    ```

    *Ensure you populate your `DATABASE_URL`, `REDIS_URL`, and `GOOGLE_OAUTH` keys.*

4.  **Spin up local databases:**

    ```bash
    docker-compose up -d
    ```

5.  **Run Prisma Migrations & Seed:**

    ```bash
    cd apps/api
    pnpm prisma migrate dev
    pnpm run seed # Seeds SJT and TT block rooms
    ```

6.  **Start the Development Servers:**

    ```bash
    # From the root directory
    pnpm run dev
    ```

      * Frontend will be available at `http://localhost:5173`
      * Backend API will be available at `http://localhost:3000/api`
      * Swagger Docs will be available at `http://localhost:3000/api/docs`

-----

## 🔒 Security & Data Privacy

  * **Domain Restriction:** Authentication is strictly limited to active VIT students (`@vitstudent.ac.in`).
  * **Location Privacy:** Precise GPS locations are **never** stored. Only the selected classroom ID is logged during report submission.
  * **Data Freshness:** Network speed data decays. Data older than one FFCS cycle (approx. 150 days) is visually flagged as stale, prompting re-verification to ensure current semester accuracy.

-----

## 👥 Authors & Maintainers

  * **Devansh Sharma** (24BCE0717) - Architect & Lead Developer
  * **Devarsh Patel** (24BCT0267) - Architect & Lead Developer

*For internal VIT developer onboarding, refer to the Kanban board and the E2E Edge Case Matrix located in the `/docs` folder.*

-----


## *"You dream it. We ship it. All in days, not quarters."*
**© 2026 VITspotCheck. All rights reserved.**

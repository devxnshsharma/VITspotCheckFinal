import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: ['warn', 'error'],
});
const PORT = 3001;

console.log('--- BACKEND SERVER INITIALIZING ---');

app.use(cors());
app.use(express.json());

// Test connection on startup
prisma.$connect()
  .then(() => console.log('Successfully connected to database.'))
  .catch((err) => console.error('Prisma connection error:', err));

// ─── Shared Utility: awardKarma ─────────────────────────────────────────────
// Issue 7 & 8: Single write path for all karma changes to prevent log drift
async function awardKarma(userId: string, delta: number, reason: string, refId?: string) {
  await prisma.karmaEvent.create({
    data: {
      userId,
      type: delta >= 0 ? 'gain' : 'loss',
      points: delta,
      description: reason,
      refId: refId || null,
    }
  });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { karma: { increment: delta } }
  });

  // Update trust tier
  let newTier = 'OBSERVER';
  if (updated.karma >= 3000) newTier = 'ORACLE';
  else if (updated.karma >= 1500) newTier = 'ARCHITECT';
  else if (updated.karma >= 500) newTier = 'NAVIGATOR';
  else if (updated.karma >= 100) newTier = 'SPOTTER';

  if (newTier !== updated.trustTier) {
    await prisma.user.update({
      where: { id: userId },
      data: { trustTier: newTier }
    });
  }

  return { newKarma: updated.karma + delta, tier: newTier };
}

// ─── Issue 1: Users endpoint — sync user, detect first login ──────────────
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, image } = req.body;
    let isNew = false;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      isNew = true;
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          karma: 100, // Default karma
          trustTier: 'SPOTTER',
        }
      });

      // Award welcome bonus karma (logged via awardKarma)
      await awardKarma(user.id, 100, 'welcome_bonus');
    }

    // Check if welcome was already shown
    const needsWelcome = isNew || !user.welcomeShown;

    // Mark welcome as shown
    if (needsWelcome && !user.welcomeShown) {
      await prisma.user.update({
        where: { id: user.id },
        data: { welcomeShown: true }
      });
    }

    // Re-fetch to get latest karma
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } });

    res.json({
      ...freshUser,
      isNew: needsWelcome,
    });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// ─── Issue 2 & 3: Bookings POST — with conflict check + karma award ───────
app.post('/api/bookings', async (req, res) => {
  try {
    const { email, roomName, startTime, endTime, reason } = req.body;

    if (!email || !roomName) {
      return res.status(400).json({ error: 'Email and room name required' });
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        }
      });
    }

    // Check for time conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        roomName,
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Room already booked for this time slot' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason: reason || 'Study / Meeting',
        status: 'confirmed',
      }
    });

    // Issue 2: Award karma for booking (+10)
    await awardKarma(user.id, 10, `Booking created: ${roomName}`, booking.id);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ─── Issue 3: Bookings GET — user's bookings ─────────────────────────────
app.get('/api/bookings', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      // Return all bookings if no email (admin use)
      const bookings = await prisma.booking.findMany({
        orderBy: { startTime: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      });
      return res.json(bookings);
    }

    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ─── Issue 3: Cancel booking ──────────────────────────────────────────────
app.patch('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only allow cancellation if start time is > 30 min from now
    const thirtyMinsFromNow = new Date(Date.now() + 30 * 60 * 1000);
    if (booking.startTime <= thirtyMinsFromNow) {
      return res.status(400).json({ error: 'Cannot cancel within 30 minutes of start time' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ─── Issue 5: Next upcoming booking ───────────────────────────────────────
app.get('/api/bookings/next', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.json(null);

    const next = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        startTime: { gt: new Date() },
        status: 'confirmed',
      },
      orderBy: { startTime: 'asc' },
    });

    res.json(next);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch next booking' });
  }
});

// ─── Issue 4: User Session GET/PUT — persist preferences ──────────────────
app.get('/api/user/session', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email: String(email) } });
    if (!user) return res.json({});

    const session = await prisma.userSession.findUnique({ where: { userId: user.id } });
    res.json(session || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.put('/api/user/session', async (req, res) => {
  try {
    const { email, lastBlock, preferredIsp, preferredFloor } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const session = await prisma.userSession.upsert({
      where: { userId: user.id },
      update: {
        lastBlock: lastBlock ?? undefined,
        preferredIsp: preferredIsp ?? undefined,
        preferredFloor: preferredFloor ?? undefined,
        lastActive: new Date(),
      },
      create: {
        userId: user.id,
        lastBlock,
        preferredIsp,
        preferredFloor,
      },
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// ─── Issue 6: Leaderboard — top 20 by karma ───────────────────────────────
app.get('/api/leaderboard', async (_req, res) => {
  try {
    const top = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        karma: true,
        trustTier: true,
        joinedAt: true,
        _count: { select: { karmaEvents: true } }
      },
      orderBy: { karma: 'desc' },
      take: 20,
    });

    const formatted = top.map(u => ({
      id: u.id,
      name: u.name,
      karma: u.karma,
      trustTier: u.trustTier,
      verificationsCount: u._count.karmaEvents,
      joinedAt: u.joinedAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ─── Issue 6: Live Feed — real karma events ───────────────────────────────
app.get('/api/feed', async (_req, res) => {
  try {
    const events = await prisma.karmaEvent.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    const formatted = events.map(e => {
      let action = 'performed an action';
      let roomName = '';
      let type = 'karma';

      if (e.description.includes('Secured Domain:') || e.description.includes('Booking created:')) {
        type = 'booking';
        action = 'secured space';
        roomName = e.description.split(':').pop()?.trim() || '';
      } else if (e.description.includes('welcome_bonus')) {
        type = 'karma';
        action = 'joined VITspotCheck';
        roomName = 'Network';
      } else if (e.description.includes('Speedtest') || e.description.includes('Telemetry')) {
        type = 'speedtest';
        action = 'benchmarked network';
        roomName = e.description.split(':').pop()?.trim() || 'Global';
      } else if (e.description.includes('System') || e.description.includes('Sync')) {
        type = 'verification';
        action = e.description;
        roomName = '';
      } else {
        action = e.description;
      }

      return {
        id: e.id,
        type,
        userId: e.userId,
        userName: e.user.name,
        roomId: roomName,
        roomName,
        action,
        karma: e.points,
        timestamp: e.createdAt.toISOString(),
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// ─── Issue 6: Users list (leaderboard fallback) ───────────────────────────
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { karma: 'desc' },
      take: 50,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── Issue 1: Karma POST — single path via awardKarma ────────────────────
app.post('/api/karma', async (req, res) => {
  try {
    const { email, delta, reason, refId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          karma: 100,
          trustTier: 'SPOTTER',
        }
      });
    }

    const result = await awardKarma(user.id, delta, reason, refId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Karma error:', error);
    res.status(500).json({ error: 'Failed to sync karma' });
  }
});

// ─── Issue 7: Admin Karma Log — cross-checkable log ───────────────────────
app.get('/api/admin/karma-log', async (req, res) => {
  try {
    const { user_id, reason, page = '0' } = req.query;
    const pageNum = parseInt(String(page));
    const pageSize = 50;

    const where: any = {};
    if (user_id) where.userId = String(user_id);
    if (reason) where.description = { contains: String(reason) };

    const [logs, total] = await Promise.all([
      prisma.karmaEvent.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, karma: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: pageNum * pageSize,
      }),
      prisma.karmaEvent.count({ where }),
    ]);

    res.json({ logs, total, page: pageNum, pageSize });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch karma log' });
  }
});

// ─── Issue 7: Admin Recalculate Karma — recompute from log ────────────────
app.post('/api/admin/recalculate-karma', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Sum all karma events for this user
    const result = await prisma.karmaEvent.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const correctKarma = (result._sum.points || 0) + 100; // +100 base karma

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { karma: correctKarma },
    });

    // Update tier
    let newTier = 'OBSERVER';
    if (correctKarma >= 3000) newTier = 'ORACLE';
    else if (correctKarma >= 1500) newTier = 'ARCHITECT';
    else if (correctKarma >= 500) newTier = 'NAVIGATOR';
    else if (correctKarma >= 100) newTier = 'SPOTTER';

    await prisma.user.update({
      where: { id: userId },
      data: { trustTier: newTier },
    });

    res.json({ userId, previousKarma: updated.karma, correctedKarma: correctKarma, tier: newTier });
  } catch (error) {
    res.status(500).json({ error: 'Failed to recalculate karma' });
  }
});

// ─── Admin Summary Endpoint ───────────────────────────────────────────────
app.get('/api/admin/summary', async (_req, res) => {
  try {
    const [totalBookings, totalUsers, totalKarmaEvents, totalSpeedtests, totalLayouts] = await Promise.all([
      prisma.booking.count({ where: { endTime: { gt: new Date() } } }),
      prisma.user.count(),
      prisma.karmaEvent.count(),
      prisma.speedtest.count(),
      prisma.layoutDesign.count(),
    ]);

    res.json({
      stats: {
        totalBookings,
        totalUsers,
        totalKarmaEvents,
        totalSpeedtests,
        totalLayouts,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server API running on http://localhost:${PORT}`);
});

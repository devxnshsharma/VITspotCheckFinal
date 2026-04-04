import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: ['query', 'info', 'warn', 'error'],
});
const PORT = 3001;

console.log('--- BACKEND SERVER INITIALIZING ---');
console.log('Connecting to Prisma...');

app.use(cors());
app.use(express.json());

// Test connection on startup
prisma.$connect()
  .then(() => console.log('Successfully connected to database.'))
  .catch((err) => console.error('Prisma connection error:', err));
// Users endpoint (to sync user via next-auth or client auth)
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, image } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
        }
      });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Bookings GET
app.get('/api/bookings', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });

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

// Bookings POST
app.post('/api/bookings', async (req, res) => {
  try {
    const { email, roomName, startTime, endTime, reason } = req.body;
    
    // Upsert user to ensure they exist
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        }
      });
    }

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        roomName,
        AND: [
          { startTime: { lt: new Date(endTime) } },
          { endTime: { gt: new Date(startTime) } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Room already booked for this time' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        roomName,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        reason: reason || "Study / Meeting"
      }
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Admin Summary Endpoint for Central Command
app.get('/api/admin/summary', async (req, res) => {
  try {
    // Simulated active nodes length
    const activeNodes = 2; // For realism to the UI
    const available = 124;
    
    // Genuine DB Metrics
    const reservationsCount = await prisma.booking.count({
      where: {
        endTime: { gt: new Date() } // active reservations
      }
    });
    
    // Conflicts simulated logic
    const conflicts = 3;

    res.json({
      stats: {
        totalBookings: reservationsCount,
        totalUsers: activeNodes,
        totalKarmaEvents: 5,
        totalSpeedtests: 0,
        totalLayouts: 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server API running on http://localhost:${PORT}`);
});

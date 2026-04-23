import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db';
import { ensureDemoUser } from './services/demoUserService';

import authRoutes from './routes/auth';
import recipeRoutes from './routes/recipes';
import pantryRoutes from './routes/pantry';
import matchingRoutes from './routes/matching';
import aiRoutes from './routes/ai';
import plannerRoutes from './routes/planner';
import communityRoutes from './routes/community';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/match', matchingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/community', communityRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

io.on('connection', (socket) => {
  socket.on('join-user', (userId: string) => socket.join(`user-${userId}`));
  socket.on('pantry-updated', (userId: string) => io.to(`user-${userId}`).emit('pantry:sync'));
  socket.on('disconnect', () => {});
});

export { io };

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await ensureDemoUser();
    httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

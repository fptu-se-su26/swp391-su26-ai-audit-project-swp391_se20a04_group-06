import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';

import { testConnection } from './db';
import { initSocket }     from './socket';
import { startCronJobs }  from './cron';

import authRoutes, { userRouter } from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import imageRoutes   from './routes/image.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes   from './routes/admin.routes';
import followRoutes  from './routes/follow.routes';
import reviewRoutes  from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import favoriteRoutes from './routes/favorite.routes';
import reportRoutes  from './routes/report.routes';

const app    = express();
const server = http.createServer(app);

/* ─── Security ────────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  contentSecurityPolicy: false, // configured separately if needed
}));

/* ─── Middleware ────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

/* ─── Health check ─────────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

/* ─── Routes ────────────────────────────────────────────────── */
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRouter);
app.use('/api/products',      productRoutes);
app.use('/api',               imageRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/follows',       followRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites',     favoriteRoutes);
app.use('/api/reports',       reportRoutes);

/* ─── 404 handler ───────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy endpoint này' }));

/* ─── Global error handler ──────────────────────────────────── */
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  return res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
});

/* ─── Start ─────────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000');

async function bootstrap() {
  await testConnection();
  initSocket(server);
  startCronJobs();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`🔒 Helmet security headers: BẬT`);
    console.log(`📡 Socket.IO sẵn sàng`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'seafood_db'}\n`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Khởi động thất bại:', err);
  process.exit(1);
});

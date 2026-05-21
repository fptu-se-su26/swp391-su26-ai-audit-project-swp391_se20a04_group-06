import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';

import { testConnection } from './db';
import { initSocket }     from './socket';
import { startCronJobs }  from './cron';

import authRoutes    from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import imageRoutes   from './routes/image.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes   from './routes/admin.routes';
import followRoutes  from './routes/follow.routes';
import reviewRoutes  from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';

const app    = express();
const server = http.createServer(app);

/* ─── Middleware ────────────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─── Health check ─────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

/* ─── Routes ────────────────────────────────────────────── */
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api',          imageRoutes);    // POST /api/products/:id/images & DELETE /api/images/:id
app.use('/api/messages', messageRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/follows',  followRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/notifications', notificationRoutes);

/* ─── 404 handler ───────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy endpoint này' }));

/* ─── Global error handler ──────────────────────────────── */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
});

/* ─── Start ─────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000');

async function bootstrap() {
  await testConnection();
  initSocket(server);
  startCronJobs();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`📡 Socket.IO sẵn sàng`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'seafood_db'}\n`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Khởi động thất bại:', err);
  process.exit(1);
});

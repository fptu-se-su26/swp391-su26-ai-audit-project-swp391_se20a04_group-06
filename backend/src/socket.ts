import 'dotenv/config';
import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { pool } from './db';
import { ResultSetHeader } from 'mysql2';

interface AuthPayload { userId: number; role: string }

let ioInstance: IOServer;

export function initSocket(server: HttpServer) {
  const io = new IOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  /* ── Xác thực JWT khi kết nối ── */
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Chưa đăng nhập'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId } = (socket as any).user as AuthPayload;
    console.log(`🔌 Socket connected: userId=${userId}`);

    /* Buyer / Seller tham gia room của product để nhận tin real-time */
    socket.on('join_room', (productId: number) => {
      socket.join(`product_${productId}`);
    });

    socket.on('leave_room', (productId: number) => {
      socket.leave(`product_${productId}`);
    });

    /* ── Gửi tin nhắn ── */
    socket.on(
      'send_message',
      async (data: { productId: number; receiverId: number; content: string }) => {
        const { productId, receiverId, content } = data;
        if (!productId || !receiverId || !content?.trim()) return;

        try {
          const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES (?, ?, ?, ?)',
            [productId, userId, receiverId, content.trim()],
          );

          const message = {
            id:         result.insertId,
            productId,
            senderId:   userId,
            receiverId,
            content:    content.trim(),
            sentAt:     new Date().toISOString(),
            isRead:     false,
          };

          /* Phát tin đến toàn bộ người trong room */
          io.to(`product_${productId}`).emit('new_message', message);

          /* Phát notification riêng đến receiver (nếu không trong room) */
          io.to(`user_${receiverId}`).emit('notification', {
            type:      'new_message',
            productId,
            senderId:  userId,
            preview:   content.trim().slice(0, 40),
          });
        } catch (err) {
          console.error('Socket send_message error:', err);
          socket.emit('error', { message: 'Gửi tin thất bại' });
        }
      },
    );

    /* User join room cá nhân để nhận notification */
    socket.join(`user_${userId}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: userId=${userId}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO() {
  if (!ioInstance) throw new Error('Socket.io chưa được khởi tạo');
  return ioInstance;
}

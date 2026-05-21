"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
require("dotenv/config");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("./db");
let ioInstance;
function initSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });
    /* ── Xác thực JWT khi kết nối ── */
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('Chưa đăng nhập'));
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = payload;
            next();
        }
        catch {
            next(new Error('Token không hợp lệ'));
        }
    });
    io.on('connection', (socket) => {
        const { userId } = socket.user;
        console.log(`🔌 Socket connected: userId=${userId}`);
        /* Buyer / Seller tham gia room của product để nhận tin real-time */
        socket.on('join_room', (productId) => {
            socket.join(`product_${productId}`);
        });
        socket.on('leave_room', (productId) => {
            socket.leave(`product_${productId}`);
        });
        /* ── Gửi tin nhắn ── */
        socket.on('send_message', async (data) => {
            const { productId, receiverId, content } = data;
            if (!productId || !receiverId || !content?.trim())
                return;
            try {
                const [result] = await db_1.pool.query('INSERT INTO Message (ProductID, SenderID, ReceiverID, Content) VALUES (?, ?, ?, ?)', [productId, userId, receiverId, content.trim()]);
                const message = {
                    id: result.insertId,
                    productId,
                    senderId: userId,
                    receiverId,
                    content: content.trim(),
                    sentAt: new Date().toISOString(),
                    isRead: false,
                };
                /* Phát tin đến toàn bộ người trong room */
                io.to(`product_${productId}`).emit('new_message', message);
                /* Phát notification riêng đến receiver (nếu không trong room) */
                io.to(`user_${receiverId}`).emit('notification', {
                    type: 'new_message',
                    productId,
                    senderId: userId,
                    preview: content.trim().slice(0, 40),
                });
            }
            catch (err) {
                console.error('Socket send_message error:', err);
                socket.emit('error', { message: 'Gửi tin thất bại' });
            }
        });
        /* User join room cá nhân để nhận notification */
        socket.join(`user_${userId}`);
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: userId=${userId}`);
        });
    });
    ioInstance = io;
    return io;
}
function getIO() {
    if (!ioInstance)
        throw new Error('Socket.io chưa được khởi tạo');
    return ioInstance;
}

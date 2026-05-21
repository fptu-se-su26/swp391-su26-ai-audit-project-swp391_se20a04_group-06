"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const db_1 = require("./db");
const socket_1 = require("./socket");
const cron_1 = require("./cron");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const image_routes_1 = __importDefault(require("./routes/image.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const follow_routes_1 = __importDefault(require("./routes/follow.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
/* ─── Middleware ────────────────────────────────────────── */
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
/* ─── Health check ─────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));
/* ─── Routes ────────────────────────────────────────────── */
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api', image_routes_1.default); // POST /api/products/:id/images & DELETE /api/images/:id
app.use('/api/messages', message_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/follows', follow_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
/* ─── 404 handler ───────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ message: 'Không tìm thấy endpoint này' }));
/* ─── Global error handler ──────────────────────────────── */
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
});
/* ─── Start ─────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000');
async function bootstrap() {
    await (0, db_1.testConnection)();
    (0, socket_1.initSocket)(server);
    (0, cron_1.startCronJobs)();
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

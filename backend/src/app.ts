import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
<<<<<<< HEAD
=======
import helmet from 'helmet';
>>>>>>> origin/main

import { testConnection } from './db';
import { initSocket }     from './socket';
import { startCronJobs }  from './cron';

<<<<<<< HEAD
import authRoutes    from './routes/auth.routes';
=======
import authRoutes, { userRouter } from './routes/auth.routes';
>>>>>>> origin/main
import productRoutes from './routes/product.routes';
import imageRoutes   from './routes/image.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes   from './routes/admin.routes';
import followRoutes  from './routes/follow.routes';
import reviewRoutes  from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
<<<<<<< HEAD
=======
import favoriteRoutes from './routes/favorite.routes';
import reportRoutes  from './routes/report.routes';
>>>>>>> origin/main

const app    = express();
const server = http.createServer(app);

<<<<<<< HEAD
/* ─── Middleware ────────────────────────────────────────── */
=======
/* ─── Security ────────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  contentSecurityPolicy: false, // configured separately if needed
}));

/* ─── Middleware ────────────────────────────────────────────── */
>>>>>>> origin/main
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ message: err.message || 'Lỗi máy chủ' });
});

<<<<<<< HEAD
/* ─── Start ─────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000');

<<<<<<< Updated upstream
=======
// ── Rate Limiters ─────────────────────────────────────────────────────────

// 1. Auth routes: giữ chặt chống brute-force mật khẩu hoặc spam OTP
const authLimiter = rateLimit({
  // Thời gian chặn là 15 phút
  windowMs: 15 * 60 * 1000,
  // Giới hạn tối đa 20 yêu cầu trong vòng 15 phút từ cùng một IP
  max: 20,
  // Phản hồi lỗi tùy chỉnh hiển thị cho người dùng khi vượt quá hạn mức
  message: {
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
  // Kích hoạt các header chuẩn thông báo giới hạn tần suất
  standardHeaders: true,
  // Vô hiệu hóa các header kiểu cũ X-RateLimit-*
  legacyHeaders: false,
});

// 2. Polling endpoints: nhẹ nhàng riêng, không tính vào quota chung
const pollingLimiter = rateLimit({
  // Thời gian đo lường là 1 phút (60 giây)
  windowMs: 60 * 1000,
  // Giới hạn tối đa 120 yêu cầu mỗi phút
  max: 120,
  // Thông điệp báo lỗi khi polling quá nhanh
  message: { message: "Polling quá nhanh." },
  // Cấu hình headers chuẩn
  standardHeaders: true,
  // Tắt headers cũ
  legacyHeaders: false,
});

// 3. Admin routes: tăng hẳn vì chỉ có 1 Admin dùng để tải nhiều dữ liệu trang Dashboard cùng lúc
const adminLimiter = rateLimit({
  // Khoảng thời gian đo lường là 1 phút
  windowMs: 60 * 1000,
  // Giới hạn tối đa 300 yêu cầu mỗi phút
  max: 3000,
  // Báo lỗi admin yêu cầu quá nhiều
  message: { message: "Quá nhiều yêu cầu admin." },
  // Cấu hình headers chuẩn
  standardHeaders: true,
  // Tắt headers cũ
  legacyHeaders: false,
});

// 4. Global: Giới hạn toàn cục phù hợp với đặc thù tải ứng dụng SPA của người dùng thường
const globalLimiter = rateLimit({
  // Khoảng thời gian đo lường là 1 phút
  windowMs: 60 * 1000,
  // Cho phép tối đa 1500 yêu cầu mỗi phút từ một IP
  max: 15000,
  // Phản hồi lỗi hệ thống quá tải
  message: {
    message: "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng chậm lại.",
  },
  // Cấu hình headers chuẩn
  standardHeaders: true,
  // Tắt headers cũ
  legacyHeaders: false,
  // Hàm bỏ qua kiểm tra giới hạn tần suất đối với yêu cầu kiểm tra sức khỏe hệ thống /health
  skip: (req) => req.path === "/health",
});

// ── Gắn limiters theo thứ tự (specific trước, global sau) ────────────────

// Gắn bộ giới hạn polling cho tuyến đường lấy số tin nhắn chưa đọc
app.use("/api/messages/unread-count", pollingLimiter);
// Gắn bộ giới hạn polling cho tuyến đường lấy danh sách thông báo
app.use("/api/notifications", pollingLimiter);

// Gắn bộ giới hạn admin cho toàn bộ các tuyến đường quản trị viên
app.use("/api/admin", adminLimiter);

// Gắn bộ giới hạn toàn cục cho toàn bộ các tuyến đường API đầu vào (phải đặt sau các bộ giới hạn cụ thể)
app.use("/api", globalLimiter);

// Middleware tạo token CSRF tự động gửi về cho client thông qua cookie
app.use(generateCsrfToken);

// Middleware kiểm tra bảo mật CSRF cho toàn bộ tuyến đường API loại trừ danh sách công khai và các phương thức GET
app.use("/api", (req, res, next) => {
  // Danh sách các đường dẫn công khai bỏ qua kiểm tra mã thông báo bảo mật CSRF
  const publicPaths = [
    "/health",
    "/auth/logout",
    "/auth/refresh",
    "/auth/google",
    "/payment/webhook",
    "/chatbot",
  ];

  // Làm sạch dấu gạch chéo cuối chuỗi đường dẫn yêu cầu
  const cleanPath = req.path.replace(/\/$/, "");
  // Kiểm tra xem đường dẫn hiện tại có khớp với bất kỳ đường dẫn công khai nào trong mảng hay không
  const isPublic = publicPaths.some((p) => p.replace(/\/$/, "") === cleanPath);

  // Nếu là đường dẫn công khai, bỏ qua kiểm tra CSRF và chuyển tiếp luồng
  if (isPublic) return next();
  // Nếu phương thức HTTP là GET (chỉ đọc dữ liệu, không ghi dữ liệu), bỏ qua kiểm tra CSRF
  if (req.method === "GET") return next();

  // Thực hiện middleware validateCsrf kiểm tra token gửi lên khớp với cookie
  validateCsrf(req, res, next);
});

// Tuyến đường kiểm tra sức khỏe hệ thống, trả về thời điểm máy chủ hoạt động bình thường
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date() }),
);

// Khai báo định tuyến xác thực tài khoản đăng nhập/đăng ký
app.use("/api/auth", authRoutes);
// Khai báo định tuyến tương tác người dùng
app.use("/api/users", userRouter);
// Khai báo định tuyến sản phẩm hải sản mẻ hàng
app.use("/api/products", productRoutes);
// Khai báo định tuyến thông tin hoạt động ngư dân
app.use("/api/fishermen", fishermanRoutes);
// Khai báo định tuyến tải lên hình ảnh
app.use("/api", imageRoutes);
// Khai báo định tuyến chat tin nhắn
app.use("/api/messages", messageRoutes);
// Khai báo định tuyến dashboard quản trị
app.use("/api/admin", adminRoutes);
// Khai báo định tuyến theo dõi tài khoản
app.use("/api/follows", followRoutes);
// Khai báo định tuyến đánh giá sao nhận xét
app.use("/api/reviews", reviewRoutes);
// Khai báo định tuyến thông báo đẩy
app.use("/api/notifications", notificationRoutes);
// Khai báo định tuyến danh sách sản phẩm yêu thích
app.use("/api/favorites", favoriteRoutes);
// Khai báo định tuyến gửi báo cáo vi phạm
app.use("/api/reports", reportRoutes);
// Khai báo định tuyến nhận webhook thanh toán Sepay
app.use("/api/payment", paymentRoutes);
// Khai báo định tuyến hỗ trợ chatbot AI
app.use("/api/chatbot", chatbotRoutes);
// Khai báo định tuyến viết và xem công thức nấu ăn
app.use("/api/recipes", recipeRoutes);
// Khai báo định tuyến bài đăng diễn đàn chia sẻ
app.use("/api/posts", postRoutes);
// Khai báo định tuyến viết nhật ký đi biển
app.use("/api/boat-logs", boatLogRoutes);

// Bắt các yêu cầu truy cập sai địa chỉ API và trả về lỗi 404
app.use((_req, res) =>
  res.status(404).json({ message: "Không tìm thấy endpoint này" }),
);

// Sử dụng middleware errorHandler xử lý ngoại lệ tập trung ở cuối cùng ứng dụng
app.use(errorHandler);

// Lắng nghe sự kiện lỗi nghiêm trọng uncaughtException chưa được bắt ở toàn luồng Node.js
process.on("uncaughtException", (err) => {
  // Ghi nhận lỗi critical kèm theo vết ngăn xếp lỗi stack trace
  logger.error(`[CRITICAL] uncaughtException: ${err.message}`, {
    stack: err.stack,
  });
  // Dừng tiến trình ngay lập tức với mã thoát 1 để hệ thống container tự động khởi động lại
  process.exit(1);
});

// Lắng nghe sự kiện Promise bị reject mà không có khối catch bắt lỗi (unhandledRejection)
process.on("unhandledRejection", (reason, promise) => {
  // Ghi log lỗi critical để thông báo giám sát hệ thống
  logger.error(
    `[CRITICAL] unhandledRejection at: ${promise}, reason: ${reason}`,
  );
});

// Chuyển đổi PORT từ chuỗi sang số nguyên, mặc định là 5000
const PORT = parseInt(process.env.PORT || "5000");
// Khai báo biến serverInstance lưu phiên chạy máy chủ HTTP
let serverInstance: any;

// Hàm bootstrap thực hiện khởi chạy các tiến trình nền và lắng nghe máy chủ hoạt động
>>>>>>> Stashed changes
=======
/* ─── Start ─────────────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || '5000');

>>>>>>> origin/main
async function bootstrap() {
  await testConnection();
  initSocket(server);
  startCronJobs();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server chạy tại http://localhost:${PORT}`);
<<<<<<< HEAD
=======
    console.log(`🔒 Helmet security headers: BẬT`);
>>>>>>> origin/main
    console.log(`📡 Socket.IO sẵn sàng`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || 'seafood_db'}\n`);
  });
}

bootstrap().catch(err => {
  console.error('❌ Khởi động thất bại:', err);
  process.exit(1);
});

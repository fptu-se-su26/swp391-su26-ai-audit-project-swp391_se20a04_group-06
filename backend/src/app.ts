import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit"; // ✅ Đã tích hợp

import { testConnection } from "./db";
import { initSocket } from "./socket";
import { startCronJobs } from "./cron";
import { generateCsrfToken, validateCsrf } from "./middlewares/csrf";

import authRoutes, { userRouter } from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import imageRoutes from "./routes/image.routes";
import messageRoutes from "./routes/message.routes";
import adminRoutes from "./routes/admin.routes";
import followRoutes from "./routes/follow.routes";
import reviewRoutes from "./routes/review.routes";
import notificationRoutes from "./routes/notification.routes";
import favoriteRoutes from "./routes/favorite.routes";
import reportRoutes from "./routes/report.routes";

const app = express();
const server = http.createServer(app);

/* ─── Rate Limiter (Bảo vệ tài nguyên & Chống Brute-force) ──── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn tối đa 100 requests mỗi IP trong 15 phút
  message: {
    message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true, // Trả về thông tin hạn mức trong header RateLimit-*
  legacyHeaders: false, // Tắt header X-RateLimit-* cũ
});

// Áp dụng giới hạn tần suất cho tất cả các endpoint /api
app.use("/api", apiLimiter);

/* ─── Security Header (Helmet) ───────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

/* ─── Middleware ────────────────────────────────────────────── */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // Cho phép gửi nhận cookie an toàn
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser()); // Để đọc Cookie-based JWT và CSRF

// Logger Middleware có cấu trúc cơ bản thay vì dùng console.log đơn lẻ
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [INFO] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// CSRF: Khởi tạo/tạo token mới cho tất cả request
app.use(generateCsrfToken);

// Áp dụng validate CSRF loại trừ các public path tĩnh
app.use("/api", (req, res, next) => {
  const publicPaths = ["/api/auth/login", "/api/auth/register", "/api/health"];

  // Loại bỏ ký tự gạch chéo dư thừa ở cuối trước khi so sánh đường dẫn
  const cleanPath = req.path.replace(/\/$/, "");
  const isPublic = publicPaths.some((p) => p.replace(/\/$/, "") === cleanPath);

  if (isPublic) return next();
  if (req.method === "GET") return next();

  validateCsrf(req, res, next);
});

/* ─── Health check ─────────────────────────────────────────── */
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date() }),
);

/* ─── Routes ────────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRouter);
app.use("/api/products", productRoutes);
app.use("/api", imageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reports", reportRoutes);

/* ─── 404 handler ───────────────────────────────────────────── */
app.use((_req, res) =>
  res.status(404).json({ message: "Không tìm thấy endpoint này" }),
);

/* ─── Global error handler (Xử lý lỗi tập trung) ─────────────── */
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [ERROR] ${req.method} ${req.url} - Error: ${err.message}`,
    );
    if (err.stack) {
      console.error(err.stack);
    }
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
  },
);

/* ─── Xử lý uncaughtException / unhandledRejection ────────── */
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] uncaughtException:", err);
  // Thực hiện thoát tiến trình an toàn để PM2/Docker tự khởi động lại
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "[CRITICAL] unhandledRejection tại:",
    promise,
    "Lý do:",
    reason,
  );
});

/* ─── Khởi chạy Server ────────────────────────────────────────── */
const PORT = parseInt(process.env.PORT || "5000");

async function bootstrap() {
  await testConnection();
  initSocket(server);
  startCronJobs();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`🔒 Helmet + CSRF + Cookie-based JWT đã bật`);
    console.log(`📡 Socket.IO sẵn sàng (dùng cookie)`);
    console.log(`🗄️  Database: ${process.env.DB_NAME || "seafood_db"}\n`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Khởi động thất bại:", err);
  process.exit(1);
});

import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { connectRedis, redis } from "./config/redis";
import { logger } from "./utils/logger";

import { testConnection } from "./db";
import { initSocket, closeSocketRedisClients } from "./socket";
import { startCronJobs } from "./cron";
import { generateCsrfToken, validateCsrf } from "./middlewares/csrf";
import { setupSwagger } from "./config/swagger";
import { errorHandler } from "./middlewares/errorHandler";
import { OnUserPremiumUpgraded } from "./modules/iam/application/event-handlers/OnUserPremiumUpgraded";

import authRoutes, { userRouter } from "./routes/auth.routes";
import otpRoutes from "./routes/otp.routes";
import productRoutes from "./routes/product.routes";
import fishermanRoutes from "./routes/fisherman.routes";
import imageRoutes from "./routes/image.routes";
import messageRoutes from "./routes/message.routes";
import adminRoutes from "./routes/admin.routes";
import followRoutes from "./routes/follow.routes";
import reviewRoutes from "./routes/review.routes";
import notificationRoutes from "./routes/notification.routes";
import favoriteRoutes from "./routes/favorite.routes";
import reportRoutes from "./routes/report.routes";
import paymentRoutes from "./routes/payment.routes";
import chatbotRoutes from "./routes/chatbot.routes";
import recipeRoutes from "./routes/recipe.routes";
import postRoutes from "./routes/post.routes";
import boatLogRoutes from "./routes/boatLog.routes";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `HTTP Request: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`
    );
  });
  next();
});

// Khởi tạo tài liệu API Swagger
setupSwagger(app);

// ── Rate Limiters ─────────────────────────────────────────────────────────

// 1. Auth routes: giữ chặt chống brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20,
  message: {
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Polling endpoints: nhẹ nhàng riêng, không tính vào quota chung
const pollingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 2 req/s là đủ cho polling 30s interval
  message: { message: "Polling quá nhanh." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Admin routes: tăng hẳn vì chỉ 1 admin dùng, load nhiều data cùng lúc
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { message: "Quá nhiều yêu cầu admin." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Global: tăng lên cho phù hợp thực tế SPA (nhiều request đồng thời khi load page)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1500, // ~5 req/s là hợp lý cho user thường
  message: {
    message: "Hệ thống đang xử lý quá nhiều yêu cầu. Vui lòng chậm lại.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Bỏ qua các request đã authenticated nếu cần (optional)
  skip: (req) => req.path === "/health",
});

// ── Gắn limiters theo thứ tự (specific trước, global sau) ────────────────
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

app.use("/api/messages/unread-count", pollingLimiter); // polling 30s
app.use("/api/notifications", pollingLimiter); // polling nếu có

app.use("/api/admin", adminLimiter);

app.use("/api", globalLimiter); // ← phải đặt SAU các limiter cụ thể

app.use(generateCsrfToken);

app.use("/api", (req, res, next) => {
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/health",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/verify-otp",
    "/auth/reset-password",
    "/auth/refresh",
    "/auth/google",
    "/payment/webhook",
    "/chatbot",
  ];

  const cleanPath = req.path.replace(/\/$/, "");
  const isPublic = publicPaths.some((p) => p.replace(/\/$/, "") === cleanPath);

  if (isPublic) return next();
  if (req.method === "GET") return next();

  validateCsrf(req, res, next);
});

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/users", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/fishermen", fishermanRoutes);
app.use("/api", imageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/boat-logs", boatLogRoutes);

app.use((_req, res) =>
  res.status(404).json({ message: "Không tìm thấy endpoint này" }),
);

app.use(errorHandler);

process.on("uncaughtException", (err) => {
  logger.error(`[CRITICAL] uncaughtException: ${err.message}`, {
    stack: err.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `[CRITICAL] unhandledRejection at: ${promise}, reason: ${reason}`,
  );
});

const PORT = parseInt(process.env.PORT || "5000");
let serverInstance: any;

async function bootstrap() {
  // [FIX SECURITY 2] Validate required ENVs
  const requiredEnvs = ["MONGO_URI", "JWT_SECRET", "OTP_SECRET"];
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
  if (missingEnvs.length > 0) {
    logger.error(
      `[CRITICAL] Thiếu các biến môi trường bắt buộc khi khởi động: ${missingEnvs.join(", ")}`,
    );
    process.exit(1);
  }

  if (process.env.SENTRY_DSN) {
    logger.info(`📡 [Monitoring] Sentry integration configured via SENTRY_DSN`);
  }

  // Đăng ký Event Handlers miền của DDD
  OnUserPremiumUpgraded.register();

  await testConnection();
  await connectRedis();

  initSocket(server);
  startCronJobs();

  serverInstance = server.listen(PORT, () => {
    logger.info(`\n🚀 Server is running on http://localhost:${PORT}`);
    logger.info(`🔒 Helmet + CSRF + Cookie-based JWT Enabled`);
    logger.info(`📡 Socket.IO server is ready (cookie-based handshake)`);
    logger.info(`🗄️  Active Database: MongoDB (NoSQL)\n`);
  });
}

async function gracefulShutdown(signal: string) {
  logger.warn(`Received ${signal}. Starting Graceful Shutdown...`);

  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info("HTTP Server stopped accepting new connections.");
      try {
        await closeSocketRedisClients();
        await redis.quit();
        logger.info("Redis connection closed cleanly.");
        await mongoose.connection.close();
        logger.info("Mongoose connection closed cleanly.");
        logger.info("Graceful shutdown completed successfully. Exiting.");
        process.exit(0);
      } catch (err: any) {
        logger.error(`Error during graceful shutdown: ${err.message}`);
        process.exit(1);
      }
    });
  }

  setTimeout(() => {
    logger.error("Forceful shutdown triggered after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

bootstrap().catch((err) => {
  logger.error(`[CRITICAL] Bootstrap failed: ${err.message}`, {
    stack: err.stack,
  });
  process.exit(1);
});

export { app, server };

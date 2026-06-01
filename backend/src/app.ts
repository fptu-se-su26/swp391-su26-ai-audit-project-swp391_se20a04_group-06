import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose"; // 🌟 Import Mongoose
import { connectRedis, redis } from "./config/redis";
import { logger } from "./utils/logger";

import { testConnection } from "./db";
import { initSocket } from "./socket";
import { startCronJobs } from "./cron";
import { generateCsrfToken, validateCsrf } from "./middlewares/csrf";

import authRoutes, { userRouter } from "./routes/auth.routes";
import otpRoutes from "./routes/otp.routes";
import productRoutes from "./routes/product.routes";
import imageRoutes from "./routes/image.routes";
import messageRoutes from "./routes/message.routes";
import adminRoutes from "./routes/admin.routes";
import followRoutes from "./routes/follow.routes";
import reviewRoutes from "./routes/review.routes";
import notificationRoutes from "./routes/notification.routes";
import favoriteRoutes from "./routes/favorite.routes";
import reportRoutes from "./routes/report.routes";
import paymentRoutes from "./routes/payment.routes";

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(
  helmet({
    // Cho phép các popup như Google Sign-In truyền tin (postMessage) về trang web
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

app.use((req, _res, next) => {
  logger.info(`HTTP Request: ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

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
app.use("/api", imageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment", paymentRoutes);

app.use((_req, res) =>
  res.status(404).json({ message: "Không tìm thấy endpoint này" }),
);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`Exception on ${req.method} ${req.url}: ${err.message}`, {
      stack: err.stack,
    });
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
  },
);

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
  await testConnection(); // Gọi Mongoose Connection mới
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

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  logger.warn(`Received ${signal}. Starting Graceful Shutdown...`);

  if (serverInstance) {
    serverInstance.close(async () => {
      logger.info("HTTP Server stopped accepting new connections.");
      try {
        await redis.quit();
        logger.info("Redis connection closed cleanly.");

        // 🌟 Giải phóng kết nối cơ sở dữ liệu MongoDB an toàn
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

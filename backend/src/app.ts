// Nạp các cấu hình biến môi trường từ file .env
import "dotenv/config";
// Import thư viện express để xây dựng ứng dụng Web Server API
import express from "express";
// Import middleware cors để cho phép chia sẻ tài nguyên nguồn gốc chéo
import cors from "cors";
// Import thư viện http có sẵn của Node.js để khởi tạo máy chủ http tích hợp Socket.IO
import http from "http";
// Import middleware helmet để bảo mật các HTTP headers chống tấn công XSS, Clickjacking...
import helmet from "helmet";
// Import middleware cookie-parser để giải tích dữ liệu cookies từ yêu cầu của client
import cookieParser from "cookie-parser";
// Import thư viện mongoose để tương tác với cơ sở dữ liệu MongoDB
import mongoose from "mongoose";
// Import middleware express-rate-limit để giới hạn tần suất yêu cầu chống tấn công DoS/Brute-force
import rateLimit from "express-rate-limit";
// Import hàm kết nối Redis và đối tượng redis để quản lý cache và các phiên làm việc
import { connectRedis, redis } from "./config/redis";
// Import logger phục vụ ghi log hệ thống
import { logger } from "./utils/logger";

// Import hàm testConnection để kiểm tra kết nối tới MongoDB
import { testConnection } from "./db";
// Import các hàm cấu hình Socket.IO thời gian thực
import { initSocket, closeSocketRedisClients } from "./socket";
// Import hàm startCronJobs để chạy các tiến trình tự động lập lịch (cron jobs)
import { startCronJobs } from "./cron";
// Import các middleware tạo mới và xác thực token CSRF chống tấn công giả mạo yêu cầu
import { generateCsrfToken, validateCsrf } from "./middlewares/csrf";
// Import hàm cài đặt Swagger hiển thị tài liệu hướng dẫn API
import { setupSwagger } from "./config/swagger";
// Import middleware xử lý lỗi tập trung errorHandler
import { errorHandler } from "./middlewares/errorHandler";
// Import Event Handler xử lý sự kiện nâng cấp tài khoản Premium của DDD
import { OnUserPremiumUpgraded } from "./modules/iam/application/event-handlers/OnUserPremiumUpgraded";

// Import định tuyến xác thực tài khoản và người dùng
import authRoutes, { userRouter } from "./routes/auth.routes";
// Import định tuyến sản phẩm mẻ hàng
import productRoutes from "./routes/product.routes";
// Import định tuyến thông tin ngư dân
import fishermanRoutes from "./routes/fisherman.routes";
// Import định tuyến tải lên hình ảnh
import imageRoutes from "./routes/image.routes";
// Import định tuyến tin nhắn chat
import messageRoutes from "./routes/message.routes";
// Import định tuyến quản trị viên Admin
import adminRoutes from "./routes/admin.routes";
// Import định tuyến theo dõi/hủy theo dõi ngư dân
import followRoutes from "./routes/follow.routes";
// Import định tuyến nhận xét đánh giá
import reviewRoutes from "./routes/review.routes";
// Import định tuyến thông báo hệ thống
import notificationRoutes from "./routes/notification.routes";
// Import định tuyến sản phẩm yêu thích
import favoriteRoutes from "./routes/favorite.routes";
// Import định tuyến báo cáo vi phạm
import reportRoutes from "./routes/report.routes";
// Import định tuyến thanh toán giao dịch webhook
import paymentRoutes from "./routes/payment.routes";
// Import định tuyến chatbot AI hỗ trợ
import chatbotRoutes from "./routes/chatbot.routes";
// Import định tuyến công thức nấu món ăn biển
import recipeRoutes from "./routes/recipe.routes";
// Import định tuyến bài đăng diễn đàn chia sẻ
import postRoutes from "./routes/post.routes";
// Import định tuyến viết nhật ký đi biển cabin logs
import boatLogRoutes from "./routes/boatLog.routes";

// Khởi tạo đối tượng ứng dụng express
const app = express();
// Tạo máy chủ HTTP server từ đối tượng ứng dụng Express
const server = http.createServer(app);

// Thiết lập Express tin cậy proxy cấp 1 để lấy địa chỉ IP chính xác của client sau proxy ngược
app.set("trust proxy", 1);

// Áp dụng middleware helmet để bảo mật các HTTP headers đầu ra
app.use(
  helmet({
    // Cho phép mở các cửa sổ popup chéo nguồn gốc để hỗ trợ đăng nhập Google OAuth
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    // Cho phép truy cập tài nguyên chéo nguồn gốc
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Tạm thời vô hiệu hóa CSP để tránh xung đột với tài liệu Swagger UI
    contentSecurityPolicy: false,
  }),
);

// Áp dụng middleware CORS cho phép liên kết tài nguyên với trang web của khách hàng
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",   // Vite dev server (frontend)
  "http://127.0.0.1:5173",
  "http://localhost:3000",   // Giữ lại cho trường hợp test trực tiếp qua backend port
  "http://127.0.0.1:3000"
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
// Áp dụng middleware giải tích dữ liệu JSON trong phần thân yêu cầu với giới hạn tối đa 2MB
app.use(express.json({ limit: "2mb" }));
// Áp dụng middleware giải tích dữ liệu urlencoded với giới hạn tối đa 2MB
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
// Áp dụng middleware cookieParser để giải mã cookies đi kèm trong yêu cầu
app.use(cookieParser());

// Middleware tự định nghĩa để ghi nhận log mọi yêu cầu HTTP đến hệ thống kèm thời gian xử lý
app.use((req, res, next) => {
  // Lấy mốc thời gian bắt đầu nhận yêu cầu
  const start = Date.now();
  // Lắng nghe sự kiện finish khi phản hồi HTTP được gửi đi hoàn tất
  res.on("finish", () => {
    // Tính toán thời gian xử lý yêu cầu tính bằng miligiây
    const duration = Date.now() - start;
    // Ghi thông tin chi tiết của yêu cầu HTTP ra log
    logger.info(
      `HTTP Request: ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${req.ip}`
    );
  });
  // Chuyển tiếp luồng xử lý tới middleware kế tiếp
  next();
});

// Khởi tạo tài liệu API Swagger tích hợp vào Express
setupSwagger(app);

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
async function bootstrap() {
  // Xác minh bắt buộc có các biến môi trường cấu hình nhạy cảm quan trọng
  const requiredEnvs = ["MONGO_URI", "JWT_SECRET", "OTP_SECRET"];
  // Lọc ra các biến môi trường bắt buộc chưa được khai báo
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
  // Nếu phát hiện thiếu bất kỳ biến cấu hình bắt buộc nào
  if (missingEnvs.length > 0) {
    // Ghi lỗi nghiêm trọng và tắt chương trình ngay lập tức để tránh hoạt động thiếu bảo mật
    logger.error(
      `[CRITICAL] Thiếu các biến môi trường bắt buộc khi khởi động: ${missingEnvs.join(", ")}`,
    );
    process.exit(1);
  }

  // Thông báo cấu hình theo dõi giám sát lỗi qua Sentry nếu có cấu hình
  if (process.env.SENTRY_DSN) {
    logger.info(`📡 [Monitoring] Sentry integration configured via SENTRY_DSN`);
  }

  // Đăng ký Event Handlers miền của DDD
  OnUserPremiumUpgraded.register();

  // Chờ thực hiện kiểm tra kết nối cơ sở dữ liệu MongoDB
  await testConnection();
  // Chờ thực hiện kết nối tới Redis
  await connectRedis();

  // Khởi tạo máy chủ Socket.IO thời gian thực gắn liền vào HTTP server
  initSocket(server);
  // Khởi động các công việc cron lập lịch định kỳ tự động chạy nền
  startCronJobs();

  // Bắt đầu lắng nghe cổng PORT và gán thực thể server vào serverInstance
  serverInstance = server.listen(PORT, () => {
    // Ghi nhận log khởi chạy thành công chi tiết
    logger.info(`\n🚀 Server is running on http://localhost:${PORT}`);
    logger.info(`🔒 Helmet + CSRF + Cookie-based JWT Enabled`);
    logger.info(`📡 Socket.IO server is ready (cookie-based handshake)`);
    logger.info(`🗄️  Active Database: MongoDB (NoSQL)\n`);
  });
}

// Hàm xử lý dừng hệ thống một cách an toàn (Graceful Shutdown) tránh mất mát dữ liệu đang xử lý dở
async function gracefulShutdown(signal: string) {
  // Ghi log cảnh báo máy chủ bắt đầu tiến trình dừng
  logger.warn(`Received ${signal}. Starting Graceful Shutdown...`);

  // Nếu thực thể máy chủ đang hoạt động
  if (serverInstance) {
    // Ra lệnh đóng kết nối HTTP không chấp nhận yêu cầu mới
    serverInstance.close(async () => {
      // Ghi log máy chủ đã dừng nhận kết nối HTTP thành công
      logger.info("HTTP Server stopped accepting new connections.");
      try {
        // Đóng các kết nối client của Socket.IO đang sử dụng Redis adapter
        await closeSocketRedisClients();
        // Đóng kết nối an toàn với máy chủ Redis cache
        await redis.quit();
        logger.info("Redis connection closed cleanly.");
        // Đóng kết nối với cơ sở dữ liệu MongoDB qua Mongoose
        await mongoose.connection.close();
        logger.info("Mongoose connection closed cleanly.");
        logger.info("Graceful shutdown completed successfully. Exiting.");
        // Thoát tiến trình thành công với mã 0
        process.exit(0);
      } catch (err: any) {
        // Ghi nhận log lỗi nếu quá trình graceful shutdown bị lỗi nửa chừng
        logger.error(`Error during graceful shutdown: ${err.message}`);
        process.exit(1);
      }
    });
  }

  // Đặt thời gian chờ quá hạn tối đa 10 giây để cưỡng chế đóng tiến trình nếu graceful shutdown bị treo
  setTimeout(() => {
    // Ghi lỗi buộc dừng
    logger.error("Forceful shutdown triggered after timeout.");
    process.exit(1);
  }, 10000);
}

// Lắng nghe tín hiệu SIGTERM (yêu cầu tắt tiến trình từ Docker/Kubernetes)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
// Lắng nghe tín hiệu SIGINT (yêu cầu tắt tiến trình khi nhấn Ctrl+C ở terminal)
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Gọi hàm khởi chạy bootstrap và bắt lỗi nếu quá trình khởi động bị lỗi nghiêm trọng
bootstrap().catch((err) => {
  // Ghi log lỗi bootstrap thất bại
  logger.error(`[CRITICAL] Bootstrap failed: ${err.message}`, {
    stack: err.stack,
  });
  process.exit(1);
});

// Xuất ra app và server để phục vụ cho viết kiểm thử tích hợp (integration tests)
export { app, server };

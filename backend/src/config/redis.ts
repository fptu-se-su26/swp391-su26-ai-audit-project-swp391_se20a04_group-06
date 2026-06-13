// Import thư viện ioredis và kiểu dữ liệu RedisOptions để quản lý bộ nhớ đệm cache Redis
import Redis, { RedisOptions } from "ioredis";
// Import logger dùng chung để ghi lại vết tiến trình kết nối và lỗi mạng
import { logger } from "../utils/logger";

// Cấu hình các thông số kết nối Redis sử dụng kiểu dữ liệu chuẩn của ioredis
const redisConfig: RedisOptions = {
  // Địa chỉ máy chủ Redis (Host) đọc từ biến môi trường .env, mặc định là "localhost"
  host: process.env.REDIS_HOST || "localhost",
  // Cổng kết nối (Port) của máy chủ Redis đọc từ .env, mặc định chuyển kiểu số là 6379
  port: parseInt(process.env.REDIS_PORT || "6379"),
  // Hoãn kết nối tự động (lazyConnect): Giúp ứng dụng không tự động chạy kết nối ngay khi file này được import, giúp khởi động có kiểm soát hơn
  lazyConnect: true,
  // Chiến thuật tự động kết nối lại khi Redis mất kết nối đột ngột (retryStrategy)
  retryStrategy: (times: number) => {
    // Nếu số lần thử kết nối lại vượt quá 5 lần liên tiếp mà vẫn không thành công
    if (times > 5) {
      // Ghi nhận lỗi hệ thống nghiêm trọng và ngừng kết nối lại
      logger.error("[Redis] Không thể kết nối sau 5 lần thử. Thoát.");
      return null; // Trả về null để ra lệnh cho thư viện ioredis ngừng thử kết nối lại, tránh lặp vô hạn gây đơ CPU
    }
    // Thời gian chờ giữa các lần thử lại tăng dần (số lần * 200 mili-giây), nhưng tối đa không quá 2 giây (2000ms)
    return Math.min(times * 200, 2000);
  },
};

// Nếu file cấu hình hệ thống .env có đặt mật khẩu đăng nhập cho Redis
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD; // Bổ sung mật khẩu vào cấu hình kết nối
}

// Khởi tạo thực thể khách (Client) kết nối Redis dùng chung toàn bộ ứng dụng
export const redis = new Redis(redisConfig);

// Lắng nghe sự kiện kết nối thành công "connect" của Redis để ghi log thông báo hoạt động ổn định
redis.on("connect", () => logger.info("✅ Redis connected"));
// Lắng nghe sự kiện phát sinh lỗi "error" từ Redis và ghi nhận thông điệp lỗi chi tiết
redis.on("error", (err) => logger.error(`[Redis Error] ${err.message}`));

// Hàm kết nối thủ công đồng bộ dùng để gọi tập trung ở file khởi chạy server (app.ts)
export async function connectRedis() {
  await redis.connect(); // Kích hoạt kết nối thực tế tới máy chủ Redis
}

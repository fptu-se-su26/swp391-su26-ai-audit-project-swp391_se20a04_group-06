import Redis, { RedisOptions } from "ioredis";
import { logger } from "../utils/logger";

// Sử dụng kiểu RedisOptions chính thức từ thư viện ioredis
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  lazyConnect: true,
  // Khai báo rõ ràng kiểu dữ liệu của tham số times là number
  retryStrategy: (times: number) => {
    if (times > 5) {
      logger.error("[Redis] Không thể kết nối sau 5 lần thử. Thoát.");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

export const redis = new Redis(redisConfig);

redis.on("connect", () => logger.info("✅ Redis connected"));
redis.on("error", (err) => logger.error(`[Redis Error] ${err.message}`));

export async function connectRedis() {
  await redis.connect();
}

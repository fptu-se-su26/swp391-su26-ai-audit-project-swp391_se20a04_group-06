import Redis from "ioredis";

// BUG FIX: Không truyền password key nếu không có giá trị.
// Trước đây: password: process.env.REDIS_PASSWORD || undefined
// ioredis vẫn gửi AUTH command khi password = undefined → Redis 7 trả "invalid username"
// vì Redis 7 dùng ACL, AUTH command cần đúng format: AUTH default ""
const redisConfig: ConstructorParameters<typeof Redis>[0] = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 5) {
      console.error("[Redis] Không thể kết nối sau 5 lần thử. Thoát.");
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

// Chỉ thêm password nếu thực sự có giá trị
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

export const redis = new Redis(redisConfig);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("[Redis Error]", err.message));

export async function connectRedis() {
  await redis.connect();
}

import { otpService } from "./otp.service";
import { redis } from "../config/redis";
import crypto from "crypto";

process.env.OTP_SECRET = "fallback_default_secret_key_secure";

// Giả lập logger để chặn tiến trình DailyRotateFile mở luồng ghi file ngầm
jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Giả lập hoàn toàn thư viện nodemailer để chặn kết nối SMTP thực tế ra ngoài
jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    verify: jest.fn((callback) => {
      if (callback) callback(null);
    }),
    sendMail: jest.fn().mockResolvedValue({ messageId: "mock-email-id" }),
  }),
}));

// Giả lập hoàn toàn mô-đun redis để tránh ghi dữ liệu thật
jest.mock("../config/redis", () => {
  const mRedis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    pipeline: jest.fn().mockReturnValue({
      del: jest.fn(),
      exec: jest.fn(),
    }),
  };
  return { redis: mRedis };
});

function generateTestHash(otp: string): string {
  const secret =
    process.env.OTP_SECRET ||
    process.env.JWT_SECRET ||
    "fallback_default_secret_key_secure";
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

describe("Unit Test: Nghiệp vụ xác thực OTP (otp.service.ts)", () => {
  const email = "ngu-dan-test@haisan.vn";
  const validOtp = "123456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Nên ném lỗi 400 nếu mã OTP không tồn tại trong Redis hoặc đã hết hạn", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);

    await expect(otpService.verifyOtp(email, validOtp)).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.",
      }),
    );
  });

  it("Nên ném lỗi 429 nếu phát hiện số lần thử xác thực sai vượt quá 5 lần", async () => {
    (redis.get as jest.Mock).mockResolvedValue("any_hashed_otp");
    (redis.incr as jest.Mock).mockResolvedValue(6);

    await expect(otpService.verifyOtp(email, "wrong_otp")).rejects.toThrow(
      expect.objectContaining({
        status: 429,
        message: "Bạn đã nhập sai OTP quá 5 lần. Vui lòng yêu cầu mã mới.",
      }),
    );
  });

  it("Nên ném lỗi 400 kèm thông tin số lần thử còn lại khi nhập sai mã OTP", async () => {
    const storedHash = generateTestHash(validOtp);
    (redis.get as jest.Mock).mockResolvedValue(storedHash);

    (redis.incr as jest.Mock).mockResolvedValue(2);

    await expect(otpService.verifyOtp(email, "000000")).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "Mã OTP không đúng. Còn 3 lần thử.",
      }),
    );
  });

  it("Nên dọn dẹp bộ nhớ đệm và trả về resetToken khi nhập chính xác mã OTP", async () => {
    const storedHash = generateTestHash(validOtp);
    (redis.get as jest.Mock).mockResolvedValue(storedHash);
    (redis.incr as jest.Mock).mockResolvedValue(1);

    const resetToken = await otpService.verifyOtp(email, validOtp);

    expect(resetToken).toHaveLength(64);

    expect(redis.pipeline).toHaveBeenCalled();
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining("otp:reset_token:"),
      email,
      "EX",
      600,
    );
  });
});

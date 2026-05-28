import crypto from "crypto";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

const OTP_TTL_SEC = 5 * 60; // OTP hết hạn sau 5 phút
const ATTEMPT_TTL_SEC = 15 * 60; // Cửa sổ rate-limit gửi: 15 phút
const MAX_SEND_ATTEMPTS = 3; // Tối đa 3 lần gửi / 15 phút
const MAX_VERIFY_ATTEMPTS = 5; // Tối đa 5 lần verify sai / phiên OTP
const RESET_TOKEN_TTL = 10 * 60; // Reset token hết hạn sau 10 phút

const KEY_OTP = (phone: string) => `otp:hash:${phone}`;
const KEY_ATTEMPTS = (phone: string) => `otp:attempts:${phone}`;
const KEY_VERIFY_FAILS = (phone: string) => `otp:verify_fails:${phone}`;
const KEY_RESET = (token: string) => `otp:reset_token:${token}`;

const ESMS_API_URL =
  "https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/";

async function sendSmsByEsms(phone: string, message: string): Promise<void> {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const smsType = process.env.ESMS_SMS_TYPE ?? "4";
  const brandname = process.env.ESMS_BRANDNAME ?? "";

  if (!apiKey || !secretKey) {
    throw new Error(
      "[OTP] Thiếu biến môi trường ESMS. Kiểm tra ESMS_API_KEY, ESMS_SECRET_KEY trong .env",
    );
  }

  const to = phone.startsWith("0") ? "84" + phone.slice(1) : phone;

  const payload: Record<string, string> = {
    ApiKey: apiKey,
    SecretKey: secretKey,
    Phone: to,
    Content: message,
    SmsType: smsType,
  };

  if (smsType === "2" && brandname) {
    payload.Brandname = brandname;
  }

  const res = await fetch(ESMS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`[OTP] ESMS HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    CodeResult?: string;
    ErrorMessage?: string;
  };

  if (data.CodeResult !== "100") {
    throw new Error(
      `[OTP] ESMS gửi thất bại: ${data.ErrorMessage ?? data.CodeResult}`,
    );
  }
}

function hashOtp(otp: string): string {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET as string)
    .update(otp)
    .digest("hex");
}

function makeError(message: string, status: number): Error {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

export const otpService = {
  async sendOtp(phone: string): Promise<void> {
    const otp = crypto.randomInt(100_000, 999_999).toString();
    const hashed = hashOtp(otp);

    const pipe = redis.pipeline();
    pipe.set(KEY_OTP(phone), hashed, "EX", OTP_TTL_SEC);
    pipe.incr(KEY_ATTEMPTS(phone));
    pipe.expire(KEY_ATTEMPTS(phone), ATTEMPT_TTL_SEC);
    pipe.del(KEY_VERIFY_FAILS(phone));
    await pipe.exec();

    // 🌟 Phát hiện thiếu cấu hình API thực tế để kích hoạt MOCK SMS MODE
    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;
    const isMockSms =
      !apiKey ||
      !secretKey ||
      apiKey.includes("<lấy tại") ||
      apiKey === "your_api_key_here";

    const smsContent = `[HảiSản.vn] Mã xác nhận đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Vui lòng không cung cấp mã này cho bất kỳ ai.`;

    if (isMockSms) {
      logger.info(
        `📱 [MOCK SMS DEVELOPMENT MODE] Gửi OTP tới SĐT: ${phone} -> MÃ OTP: ${otp}`,
      );
    } else {
      try {
        await sendSmsByEsms(phone, smsContent);
        logger.info(`[SMS] OTP sent successfully via ESMS to ${phone}`);
      } catch (err: any) {
        logger.error(
          `[SMS] ESMS Delivery failed: ${err.message}. Falling back to logging OTP.`,
        );
        logger.info(`📱 [SMS FALLBACK] Mã OTP cho SĐT ${phone}: ${otp}`);
      }
    }
  },

  async verifyOtp(phone: string, otp: string): Promise<string> {
    const fails = await redis.get(KEY_VERIFY_FAILS(phone));
    if (fails && parseInt(fails) >= MAX_VERIFY_ATTEMPTS) {
      throw makeError(
        `Bạn đã nhập sai OTP quá ${MAX_VERIFY_ATTEMPTS} lần. Vui lòng yêu cầu mã mới.`,
        429,
      );
    }

    const stored = await redis.get(KEY_OTP(phone));
    if (!stored) {
      throw makeError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.", 400);
    }

    if (hashOtp(otp) !== stored) {
      const otpTtl = await redis.ttl(KEY_OTP(phone));
      const pipe = redis.pipeline();
      pipe.incr(KEY_VERIFY_FAILS(phone));
      pipe.expire(KEY_VERIFY_FAILS(phone), otpTtl > 0 ? otpTtl : OTP_TTL_SEC);
      await pipe.exec();

      const remaining = MAX_VERIFY_ATTEMPTS - parseInt(fails ?? "0") - 1;
      throw makeError(
        remaining > 0
          ? `Mã OTP không đúng. Còn ${remaining} lần thử.`
          : `Mã OTP không đúng. Vui lòng yêu cầu mã mới.`,
        400,
      );
    }

    const pipe = redis.pipeline();
    pipe.del(KEY_OTP(phone));
    pipe.del(KEY_VERIFY_FAILS(phone));
    await pipe.exec();

    const resetToken = crypto.randomBytes(32).toString("hex");
    await redis.set(KEY_RESET(resetToken), phone, "EX", RESET_TOKEN_TTL);

    return resetToken;
  },

  async getPhoneByResetToken(resetToken: string): Promise<string> {
    const phone = await redis.get(KEY_RESET(resetToken));
    if (!phone) {
      throw makeError(
        "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu.",
        400,
      );
    }
    return phone;
  },

  async consumeResetToken(resetToken: string): Promise<void> {
    await redis.del(KEY_RESET(resetToken));
  },

  async getOtpTtl(phone: string): Promise<number> {
    const ttl = await redis.ttl(KEY_OTP(phone));
    return ttl > 0 ? ttl : 0;
  },
};

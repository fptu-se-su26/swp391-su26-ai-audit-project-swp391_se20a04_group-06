import crypto from "crypto";
import { redis } from "../config/redis";
import { logger } from "../utils/logger";

const OTP_TTL_SEC = 5 * 60; // OTP hết hạn sau 5 phút
const ATTEMPT_TTL_SEC = 15 * 60; // Cửa sổ rate-limit gửi: 15 phút
const MAX_SEND_ATTEMPTS = 3; // Tối đa 3 lần gửi / 15 phút
const MAX_VERIFY_ATTEMPTS = 5; // Tối đa 5 lần verify sai / phiên OTP
const RESET_TOKEN_TTL = 10 * 60; // Reset token hết hạn sau 10 phút

import nodemailer from "nodemailer";

const KEY_OTP = (email: string) => `otp:hash:${email.toLowerCase().trim()}`;
const KEY_ATTEMPTS = (email: string) =>
  `otp:attempts:${email.toLowerCase().trim()}`;
const KEY_VERIFY_FAILS = (email: string) =>
  `otp:verify_fails:${email.toLowerCase().trim()}`;
const KEY_RESET = (token: string) => `otp:reset_token:${token}`;

async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (
    !user ||
    !pass ||
    user.includes("your_email") ||
    pass.includes("your_password")
  ) {
    throw new Error("MockMode");
  }

  // Tạo 1 lần, tái sử dụng
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Thêm verify khi khởi động để phát hiện sai config sớm
  transporter.verify((err) => {
    if (err) logger.error(`[Email] SMTP config lỗi: ${err.message}`);
    else logger.info("[Email] SMTP Gmail sẵn sàng");
  });

  const mailOptions = {
    from: `"HảiSản.vn" <${user}>`,
    to: email,
    subject: "[HảiSản.vn] Mã xác minh đặt lại mật khẩu",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #0284c7; text-align: center;">Xác Minh Đặt Lại Mật Khẩu</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HảiSản.vn liên kết với email này.</p>
        <p>Mã xác nhận (OTP) của bạn là:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; border-radius: 6px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Mã này có hiệu lực trong vòng 5 phút. Để bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Hệ thống tự động từ HảiSản.vn</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

function hashOtp(otp: string): string {
  const secret = (process.env.OTP_SECRET || process.env.JWT_SECRET) as string;
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

function makeError(message: string, status: number): Error {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

export const otpService = {
  async sendOtp(email: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const currentAttempts = await redis.get(KEY_ATTEMPTS(cleanEmail));
    if (currentAttempts && parseInt(currentAttempts, 10) >= MAX_SEND_ATTEMPTS) {
      throw makeError(
        `Bạn đã yêu cầu OTP quá ${MAX_SEND_ATTEMPTS} lần. Vui lòng thử lại sau 15 phút.`,
        429,
      );
    }

    const otp = crypto.randomInt(100_000, 999_999).toString();
    const hashed = hashOtp(otp);

    // Ghi Redis: lưu OTP hash, tăng attempt counter, xóa verify fails cũ
    const pipe = redis.pipeline();
    pipe.set(KEY_OTP(cleanEmail), hashed, "EX", OTP_TTL_SEC);
    pipe.incr(KEY_ATTEMPTS(cleanEmail));
    pipe.expire(KEY_ATTEMPTS(cleanEmail), ATTEMPT_TTL_SEC);
    pipe.del(KEY_VERIFY_FAILS(cleanEmail));
    await pipe.exec();

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const isMockEmail =
      !user ||
      !pass ||
      user.includes("your_email") ||
      user === "" ||
      pass === "";

    if (isMockEmail) {
      logger.info(
        `✉️ [MOCK EMAIL DEVELOPMENT MODE] Gửi OTP tới Email: ${cleanEmail} -> MÃ OTP: ${otp}`,
      );
    } else {
      try {
        await sendOtpEmail(cleanEmail, otp);
        logger.info(`[Email] OTP sent successfully to ${cleanEmail}`);
      } catch (err: any) {
        logger.error(
          `[Email] Delivery failed: ${err.message}. Falling back to logging OTP.`,
        );
        logger.info(
          `✉️ [EMAIL FALLBACK] Mã OTP cho Email ${cleanEmail}: ${otp}`,
        );
      }
    }
  },

  async verifyOtp(email: string, otp: string): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();
    const fails = await redis.get(KEY_VERIFY_FAILS(cleanEmail));
    if (fails && parseInt(fails, 10) >= MAX_VERIFY_ATTEMPTS) {
      throw makeError(
        `Bạn đã nhập sai OTP quá ${MAX_VERIFY_ATTEMPTS} lần. Vui lòng yêu cầu mã mới.`,
        429,
      );
    }

    const stored = await redis.get(KEY_OTP(cleanEmail));
    if (!stored) {
      throw makeError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.", 400);
    }

    if (hashOtp(otp) !== stored) {
      const otpTtl = await redis.ttl(KEY_OTP(cleanEmail));
      const pipe = redis.pipeline();
      pipe.incr(KEY_VERIFY_FAILS(cleanEmail));
      pipe.expire(
        KEY_VERIFY_FAILS(cleanEmail),
        otpTtl > 0 ? otpTtl : OTP_TTL_SEC,
      );
      await pipe.exec();

      const remaining = MAX_VERIFY_ATTEMPTS - parseInt(fails ?? "0") - 1;
      throw makeError(
        remaining > 0
          ? `Mã OTP không đúng. Còn ${remaining} lần thử.`
          : `Mã OTP không đúng. Vui lòng yêu cầu mã mới.`,
        400,
      );
    }

    // OTP hợp lệ: xóa OTP và failure counter
    const pipe = redis.pipeline();
    pipe.del(KEY_OTP(cleanEmail));
    pipe.del(KEY_VERIFY_FAILS(cleanEmail));
    await pipe.exec();

    const resetToken = crypto.randomBytes(32).toString("hex");
    await redis.set(KEY_RESET(resetToken), cleanEmail, "EX", RESET_TOKEN_TTL);

    return resetToken;
  },

  async getEmailByResetToken(resetToken: string): Promise<string> {
    const email = await redis.get(KEY_RESET(resetToken));
    if (!email) {
      throw makeError(
        "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu.",
        400,
      );
    }
    return email;
  },

  async consumeResetToken(resetToken: string): Promise<void> {
    await redis.del(KEY_RESET(resetToken));
  },

  async getOtpTtl(email: string): Promise<number> {
    const cleanEmail = email.toLowerCase().trim();
    const ttl = await redis.ttl(KEY_OTP(cleanEmail));
    return ttl > 0 ? ttl : 0;
  },
};

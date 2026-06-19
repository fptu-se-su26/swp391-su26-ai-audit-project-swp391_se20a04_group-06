"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const OTP_TTL_SEC = 5 * 60; // OTP hết hạn sau 5 phút
const ATTEMPT_TTL_SEC = 15 * 60; // Cửa sổ rate-limit gửi: 15 phút
const MAX_SEND_ATTEMPTS = 3; // Tối đa 3 lần gửi / 15 phút
const MAX_VERIFY_ATTEMPTS = 5; // Tối đa 5 lần verify sai / phiên OTP
const RESET_TOKEN_TTL = 10 * 60; // Reset token hết hạn sau 10 phút
const nodemailer_1 = __importDefault(require("nodemailer"));
const KEY_OTP = (email) => `otp:hash:${email.toLowerCase().trim()}`;
const KEY_ATTEMPTS = (email) => `otp:attempts:${email.toLowerCase().trim()}`;
const KEY_VERIFY_FAILS = (email) => `otp:verify_fails:${email.toLowerCase().trim()}`;
const KEY_RESET = (token) => `otp:reset_token:${token}`;
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// 🌟 GIẢI PHÁP 2: Chỉ chạy xác minh cấu hình 1 lần duy nhất khi khởi động máy chủ
if (process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    !process.env.EMAIL_USER.includes("your_email")) {
    transporter.verify((err) => {
        if (err)
            logger_1.logger.error(`[Email] SMTP configuration error: ${err.message}`);
        else
            logger_1.logger.info("✅ [Email] SMTP Gmail connection is ready");
    });
}
async function sendOtpEmail(email, otp) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (!user ||
        !pass ||
        user.includes("your_email") ||
        pass.includes("your_password")) {
        throw new Error("MockMode");
    }
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
    // Sử dụng trực tiếp bộ gom kết nối đã khởi tạo
    await transporter.sendMail(mailOptions);
}
// KHẮC PHỤC LỖI TRUNG BÌNH: Ngăn chặn dùng mật khóa brute-force tĩnh nếu rỗng cấu hình bảo mật
function hashOtp(otp) {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("[Security Critical] Không tìm thấy cấu hình OTP_SECRET hoặc JWT_SECRET. Từ chối băm OTP.");
    }
    return crypto_1.default.createHmac("sha256", secret).update(otp).digest("hex");
}
function makeError(message, status) {
    const err = new Error(message);
    err.status = status;
    return err;
}
exports.otpService = {
    async sendOtp(email) {
        const cleanEmail = email.toLowerCase().trim();
        const currentAttempts = await redis_1.redis.get(KEY_ATTEMPTS(cleanEmail));
        if (currentAttempts && parseInt(currentAttempts, 10) >= MAX_SEND_ATTEMPTS) {
            throw makeError(`Bạn đã yêu cầu OTP quá ${MAX_SEND_ATTEMPTS} lần. Vui lòng thử lại sau 15 phút.`, 429);
        }
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        const hashed = hashOtp(otp);
        // Ghi Redis: lưu OTP hash, tăng attempt counter, xóa verify fails cũ
        const pipe = redis_1.redis.pipeline();
        pipe.set(KEY_OTP(cleanEmail), hashed, "EX", OTP_TTL_SEC);
        pipe.incr(KEY_ATTEMPTS(cleanEmail));
        pipe.expire(KEY_ATTEMPTS(cleanEmail), ATTEMPT_TTL_SEC);
        pipe.del(KEY_VERIFY_FAILS(cleanEmail));
        await pipe.exec();
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        const isMockEmail = !user ||
            !pass ||
            user.includes("your_email") ||
            user === "" ||
            pass === "";
        if (isMockEmail) {
            logger_1.logger.info(`✉️ [MOCK EMAIL DEVELOPMENT MODE] Gửi OTP tới Email: ${cleanEmail} -> MÃ OTP: ${otp}`);
        }
        else {
            try {
                await sendOtpEmail(cleanEmail, otp);
                logger_1.logger.info(`[Email] OTP sent successfully to ${cleanEmail}`);
            }
            catch (err) {
                logger_1.logger.error(`[Email] Delivery failed: ${err.message}. Falling back to logging OTP.`);
                logger_1.logger.info(`✉️ [EMAIL FALLBACK] Mã OTP cho Email ${cleanEmail}: ${otp}`);
            }
        }
    },
    async verifyOtp(email, otp) {
        const cleanEmail = email.toLowerCase().trim();
        const cleanOtp = String(otp).trim(); // Ép kiểu string để tránh lỗi crash tại hàm hashOtp
        // 1. Kiểm tra OTP có tồn tại không trước khi làm bất cứ việc gì khác
        const stored = await redis_1.redis.get(KEY_OTP(cleanEmail));
        if (!stored) {
            throw makeError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.", 400);
        }
        // 2. Tăng số lần thử một cách ATOMIC ngay lập tức để chống tấn công Race Condition
        const fails = await redis_1.redis.incr(KEY_VERIFY_FAILS(cleanEmail));
        // Nếu đây là lần thử sai/xác thực đầu tiên, set TTL cho key này khớp với thời gian còn lại của OTP
        if (fails === 1) {
            const otpTtl = await redis_1.redis.ttl(KEY_OTP(cleanEmail));
            await redis_1.redis.expire(KEY_VERIFY_FAILS(cleanEmail), otpTtl > 0 ? otpTtl : OTP_TTL_SEC);
        }
        // 3. Nếu số lần thử đã vượt quá giới hạn, chặn ngay lập tức
        if (fails > MAX_VERIFY_ATTEMPTS) {
            throw makeError(`Bạn đã nhập sai OTP quá ${MAX_VERIFY_ATTEMPTS} lần. Vui lòng yêu cầu mã mới.`, 429);
        }
        // 4. Kiểm tra tính chính xác của OTP
        if (hashOtp(cleanOtp) !== stored) {
            const remaining = MAX_VERIFY_ATTEMPTS - fails;
            throw makeError(remaining > 0
                ? `Mã OTP không đúng. Còn ${remaining} lần thử.`
                : `Mã OTP không đúng. Vui lòng yêu cầu mã mới.`, 400);
        }
        // 5. Xác thực thành công: dọn dẹp các key liên quan trong Redis
        const pipe = redis_1.redis.pipeline();
        pipe.del(KEY_OTP(cleanEmail));
        pipe.del(KEY_VERIFY_FAILS(cleanEmail));
        await pipe.exec();
        // Tạo token đặt lại mật khẩu tạm thời
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        await redis_1.redis.set(KEY_RESET(resetToken), cleanEmail, "EX", RESET_TOKEN_TTL);
        return resetToken;
    },
    async getEmailByResetToken(resetToken) {
        const email = await redis_1.redis.get(KEY_RESET(resetToken));
        if (!email) {
            throw makeError("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu.", 400);
        }
        return email;
    },
    async consumeResetToken(resetToken) {
        await redis_1.redis.del(KEY_RESET(resetToken));
    },
    async getOtpTtl(email) {
        const cleanEmail = email.toLowerCase().trim();
        const ttl = await redis_1.redis.ttl(KEY_OTP(cleanEmail));
        return ttl > 0 ? ttl : 0;
    },
};

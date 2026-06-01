import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { otpService } from "../services/otp.service";
import { sendServerError } from "../helpers/response.helper";
import { User } from "../models/User";
import { logger } from "../utils/logger";
import { redis } from "../config/redis";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/auth/forgot-password ──────────────────────────
// Body: { email }
// 1. Kiểm tra email có tồn tại trong DB không
// 2. Gửi OTP
// Trong tệp: backend/src/controllers/otp.controller.ts

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Email không hợp lệ." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail, isActive: true });

    // 🌟 GIẢI PHÁP: Đồng nhất hoàn toàn JSON phản hồi (Message & TTL) để chống dò quét tài khoản
    if (!user) {
      return res.json({
        message: "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
        ttl: 300, // Trả về TTL giả lập để Frontend hoạt động đồng nhất
      });
    }

    await otpService.sendOtp(cleanEmail);

    return res.json({
      message: "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
      ttl: 300,
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

// ─── POST /api/auth/verify-otp ────────────────────────────────
// Body: { email, otp }
// Xác minh OTP → trả reset_token để dùng trong bước tiếp theo
export async function verifyOtp(req: Request, res: Response) {
  const { email, otp } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Email không hợp lệ." });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Mã OTP phải là 6 chữ số." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const resetToken = await otpService.verifyOtp(cleanEmail, otp);
    return res.json({
      message: "Xác minh thành công.",
      resetToken,
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

// ─── POST /api/auth/reset-password ───────────────────────────
// Body: { resetToken, newPassword }
// Đổi mật khẩu bằng reset_token đã được cấp sau khi verify OTP
// Trong tệp: backend/src/controllers/otp.controller.ts

export async function resetPassword(req: Request, res: Response) {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || typeof resetToken !== "string") {
    return res.status(400).json({ message: "Token không hợp lệ." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
  }

  try {
    // 1. Lấy email từ token (ném lỗi nếu hết hạn)
    const email = await otpService.getEmailByResetToken(resetToken);

    // 🌟 GIẢI PHÁP: Truy vấn tài khoản từ cơ sở dữ liệu trước để lấy thông tin userId
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản người dùng." });
    }

    // 2. Hash mật khẩu mới với salt round 12 bảo mật
    const hash = await bcrypt.hash(newPassword, 12);

    // 3. Cập nhật mật khẩu mới vào cơ sở dữ liệu
    user.passwordHash = hash;
    await user.save();

    // 🌟 GIẢI PHÁP BẢO MẬT: Thu hồi toàn bộ Refresh Token của User này trong Redis để buộc đăng xuất các thiết bị khác
    const keys = await redis.keys(`auth:refresh:${user._id}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 4. Xoá token đặt lại mật khẩu tạm thời để không dùng lại được nữa
    await otpService.consumeResetToken(resetToken);

    logger.info(`Password reset successfully and all active sessions revoked for UserID=${user._id}`);

    return res.json({
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

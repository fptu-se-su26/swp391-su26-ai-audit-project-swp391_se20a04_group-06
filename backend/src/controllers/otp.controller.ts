import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { otpService } from "../services/otp.service";
import { sendServerError } from "../helpers/response.helper";
import { User } from "../models/User";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/auth/forgot-password ──────────────────────────
// Body: { email }
// 1. Kiểm tra email có tồn tại trong DB không
// 2. Gửi OTP
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ message: "Email không hợp lệ." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Kiểm tra email tồn tại — nhưng luôn trả cùng 1 message để tránh user enumeration
    const user = await User.findOne({ email: cleanEmail, isActive: true });

    if (!user) {
      // Trả 200 thay vì 404 để tránh lộ thông tin tài khoản
      return res.json({
        message: "Nếu email tồn tại, OTP sẽ được gửi trong vài giây.",
      });
    }

    await otpService.sendOtp(cleanEmail);

    return res.json({
      message: "Mã OTP đã được gửi đến hòm thư email của bạn.",
      ttl: 300, // 5 phút (giây) — để frontend đếm ngược
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
export async function resetPassword(req: Request, res: Response) {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || typeof resetToken !== "string") {
    return res.status(400).json({ message: "Token không hợp lệ." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải ít nhất 6 ký tự." });
  }

  try {
    // Lấy email từ token (ném lỗi nếu hết hạn)
    const email = await otpService.getEmailByResetToken(resetToken);

    // Hash mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 12);

    // Cập nhật DB
    await User.updateOne({ email }, { $set: { passwordHash: hash } });

    // Xoá token để không dùng lại được
    await otpService.consumeResetToken(resetToken);

    return res.json({
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

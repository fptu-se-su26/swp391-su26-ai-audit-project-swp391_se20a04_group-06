import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { otpService } from "../services/otp.service";
import { sendServerError } from "../helpers/response.helper";
import { User } from "../models/User";

const PHONE_REGEX = /^0\d{9}$/;

// ─── POST /api/auth/forgot-password ──────────────────────────
// Body: { phone }
// 1. Kiểm tra SĐT có tồn tại trong DB không
// 2. Gửi OTP
export async function forgotPassword(req: Request, res: Response) {
  const { phone } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    return res
      .status(400)
      .json({ message: "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)." });
  }

  try {
    // Kiểm tra SĐT tồn tại — nhưng luôn trả cùng 1 message để tránh user enumeration
    const user = await User.findOne({ phone, isActive: true });

    if (!user) {
      // Trả 200 thay vì 404 để tránh lộ thông tin tài khoản
      return res.json({
        message: "Nếu số điện thoại tồn tại, OTP sẽ được gửi trong vài giây.",
      });
    }

    await otpService.sendOtp(phone);

    return res.json({
      message: "Mã OTP đã được gửi đến số điện thoại của bạn.",
      ttl: 300, // 5 phút (giây) — để frontend đếm ngược
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

// ─── POST /api/auth/verify-otp ────────────────────────────────
// Body: { phone, otp }
// Xác minh OTP → trả reset_token để dùng trong bước tiếp theo
export async function verifyOtp(req: Request, res: Response) {
  const { phone, otp } = req.body;

  if (!phone || !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Mã OTP phải là 6 chữ số." });
  }

  try {
    const resetToken = await otpService.verifyOtp(phone, otp);
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
    // Lấy phone từ token (ném lỗi nếu hết hạn)
    const phone = await otpService.getPhoneByResetToken(resetToken);

    // Hash mật khẩu mới
    const hash = await bcrypt.hash(newPassword, 12);

    // Cập nhật DB
    await User.updateOne({ phone }, { $set: { passwordHash: hash } });

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

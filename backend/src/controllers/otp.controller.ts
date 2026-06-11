import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { otpService } from "../services/otp.service";
import { userRepository } from "../repositories/user.repository";
import { sendServerError } from "../helpers/response.helper";
import { logger } from "../utils/logger";
import { redis } from "../config/redis";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Email không hợp lệ." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const exists = await userRepository.exists({
      email: cleanEmail,
      isActive: true,
    });

    if (!exists) {
      return res.json({
        message:
          "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
        ttl: 300,
      });
    }

    await otpService.sendOtp(cleanEmail);

    return res.json({
      message:
        "Nếu địa chỉ email tồn tại, mã xác minh OTP sẽ được gửi đến hòm thư của bạn.",
      ttl: 300,
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

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
    const email = await otpService.getEmailByResetToken(resetToken);
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản người dùng." });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user.userId, hash);

    let cursor = "0";
    const keys: string[] = [];
    do {
      const reply = await redis.scan(
        cursor,
        "MATCH",
        `auth:refresh:${user.userId}:*`,
        "COUNT",
        100,
      );
      cursor = reply[0];
      keys.push(...reply[1]);
    } while (cursor !== "0");

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await otpService.consumeResetToken(resetToken);

    logger.info(
      `Password reset successfully and all active sessions revoked safely for UserID=${user.userId}`,
    );

    return res.json({
      message:
        "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

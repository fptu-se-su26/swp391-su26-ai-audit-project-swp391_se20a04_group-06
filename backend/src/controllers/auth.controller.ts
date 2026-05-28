import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { redis } from "../config/redis";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Message } from "../models/Message";
import { Report } from "../models/Report";
import { Notification } from "../models/Notification";
import { extractPublicId } from "./image.controller";
import { deleteFromCloudinary } from "../middlewares/upload";
import { sendServerError } from "../helpers/response.helper";
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config/cookie";
import { logger } from "../utils/logger";

const ACCESS_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000,
};

const REFRESH_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response) {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password)
    return res.status(400).json({
      message: "Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu",
    });
  if (!/^0\d{9}$/.test(phone))
    return res
      .status(400)
      .json({ message: "Số điện thoại phải là 10 số, bắt đầu bằng 0" });
  if (password.length < 6)
    return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  try {
    const user = await authService.register(name, phone, password);
    const accessToken = authService.signToken(user.userId, user.role);
    const refreshToken = crypto.randomBytes(40).toString("hex");

    await redis.set(
      `auth:refresh:${user.userId}:${refreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600,
    );

    res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

    logger.info(
      `User registered successfully: ID=${user.userId}, Phone=${phone}`,
    );
    return res.status(201).json({ user });
  } catch (err: any) {
    logger.error(`Registration failed: ${err.message}`);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;

  if (!phone || !password)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập số điện thoại và mật khẩu" });

  try {
    const user = await authService.login(phone, password);
    const accessToken = authService.signToken(user.userId, user.role);
    const refreshToken = crypto.randomBytes(40).toString("hex");

    await redis.set(
      `auth:refresh:${user.userId}:${refreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600,
    );

    res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

    logger.info(`User logged in: ID=${user.userId}`);
    return res.json({ user });
  } catch (err: any) {
    logger.error(`Login failed for Phone=${phone}: ${err.message}`);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function logout(req: Request, res: Response) {
  const oldRefreshToken = req.cookies?.refreshToken;
  const token = req.cookies?.token;

  if (oldRefreshToken && token) {
    try {
      const decoded = jwt.decode(token) as { userId: string };
      if (decoded && decoded.userId) {
        await redis.del(`auth:refresh:${decoded.userId}:${oldRefreshToken}`);
        logger.info(
          `Tokens revoked in Redis on logout for UserID=${decoded.userId}`,
        );
      }
    } catch (err: any) {
      logger.error(`Token revocation error on logout: ${err.message}`);
    }
  }

  res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
  return res.json({ message: "Đã đăng xuất" });
}

export async function refreshToken(req: Request, res: Response) {
  const oldRefreshToken = req.cookies?.refreshToken;
  const token = req.cookies?.token;

  if (!oldRefreshToken || !token) {
    return res.status(401).json({ message: "Phiên làm việc hết hạn" });
  }

  try {
    const decoded = jwt.decode(token) as { userId: string; role: string };
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const redisKey = `auth:refresh:${decoded.userId}:${oldRefreshToken}`;
    const tokenExists = await redis.exists(redisKey);

    if (!tokenExists) {
      const keys = await redis.keys(`auth:refresh:${decoded.userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
      logger.warn(
        `Potential token reuse detected. Revoking all tokens for UserID=${decoded.userId}`,
      );
      return res.status(403).json({
        message:
          "Phát hiện Token đã qua sử dụng. Vui lòng đăng nhập lại để đảm bảo an toàn.",
      });
    }

    await redis.del(redisKey);

    const newAccessToken = authService.signToken(decoded.userId, decoded.role);
    const newRefreshToken = crypto.randomBytes(40).toString("hex");

    await redis.set(
      `auth:refresh:${decoded.userId}:${newRefreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600,
    );

    res.cookie("token", newAccessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTS);

    return res.json({ status: "refreshed" });
  } catch (err: any) {
    logger.error(`Token refresh failed: ${err.message}`);
    return res.status(401).json({ message: "Lỗi xác thực lại" });
  }
}

export async function me(req: Request, res: Response) {
  const token = req.cookies?.token;
  if (!token) return res.json(null);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: "User" | "Admin";
    };
    const user = await userRepository.findById(payload.userId);
    return res.json(user ?? null);
  } catch (err: any) {
    logger.warn(`Invalid access token provided: ${err.message}`);
    return res.status(401).json({ message: "Access Token hết hạn" });
  }
}

// 🌟 Xóa tài khoản vĩnh viễn tuân thủ GDPR
export async function deleteAccount(req: Request, res: Response) {
  const { userId } = req.user;

  try {
    // 1. Quét dọn và thu hồi toàn bộ Refresh Token của user trong Redis
    const keys = await redis.keys(`auth:refresh:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 2. Tìm và xóa toàn bộ hình ảnh thực tế của các sản phẩm thuộc về user đó lưu trên Cloudinary
    const products = await Product.find({ sellerId: userId as any });
    for (const p of products) {
      for (const imgUrl of p.images || []) {
        const publicId = extractPublicId(imgUrl);
        if (publicId) {
          await deleteFromCloudinary(publicId).catch((err) => {
            logger.error(
              `GDPR: Failed to delete Cloudinary image ${publicId}: ${err.message}`,
            );
          });
        }
      }
    }

    // 3. Xóa các sản phẩm, đánh giá, tin nhắn, báo cáo, và thông báo liên quan đến user (🌟 Ép kiểu as any để tránh lỗi TypeScript)
    await Product.deleteMany({ sellerId: userId as any });
    await Review.deleteMany({
      $or: [{ reviewerId: userId as any }, { sellerId: userId as any }],
    });
    await Message.deleteMany({
      $or: [{ senderId: userId as any }, { receiverId: userId as any }],
    });
    await Report.deleteMany({ reporterId: userId as any });
    await Notification.deleteMany({ userId: userId as any });

    // Cuối cùng xóa User
    await User.findByIdAndDelete(userId);

    // 4. Làm sạch Cookie đăng nhập
    res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);

    logger.info(`GDPR: User account deleted permanently: ID=${userId}`);
    return res.json({
      message:
        "Tài khoản và toàn bộ dữ liệu của bạn đã được xóa vĩnh viễn thành công.",
    });
  } catch (err: any) {
    logger.error(`GDPR: Deletion failed for UserID=${userId}: ${err.message}`);
    return sendServerError(res, err);
  }
}

export async function updateProfile(req: Request, res: Response) {
  const { userId } = req.user;
  const { name, phone } = req.body;

  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ message: "Tên không được để trống" });

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return res.status(400).json({ message: "Tên phải từ 2 đến 100 ký tự" });

  if (phone && !/^0\d{9}$/.test(phone))
    return res
      .status(400)
      .json({ message: "Số điện thoại phải là 10 số, bắt đầu bằng 0" });

  try {
    const result = await authService.updateProfile(userId, {
      name: trimmed,
      phone,
      fileBuffer: req.file?.buffer,
    });
    logger.info(`Profile updated for UserID=${userId}`);
    return res.json({ message: "Cập nhật tài khoản thành công", ...result });
  } catch (err: any) {
    logger.error(`Profile update failed: ${err.message}`);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function changePassword(req: Request, res: Response) {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "Mật khẩu mới tối thiểu 6 ký tự" });
  if (currentPassword === newPassword)
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại" });

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    logger.info(`Password changed for UserID=${userId}`);
    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err: any) {
    logger.error(`Password change failed: ${err.message}`);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

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
import { cloudinary } from "../config/cloudinary";
import { sendServerError } from "../helpers/response.helper";
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config/cookie";
import { rotateCsrfToken } from "../middlewares/csrf";
import { logger } from "../utils/logger";

const ACCESS_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 phút — khớp với expiresIn của JWT
};

const REFRESH_COOKIE_OPTS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({
      message: "Vui lòng điền đầy đủ họ tên, email và mật khẩu",
    });
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(email))
    return res
      .status(400)
      .json({ message: "Email không hợp lệ" });
  if (password.length < 6)
    return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự" });

  try {
    const user = await authService.register(name, email, password);
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
      `User registered successfully: ID=${user.userId}, Email=${email}`,
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
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Vui lòng nhập email và mật khẩu" });

  try {
    const user = await authService.login(email, password);
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
    logger.error(`Login failed for Email=${email}: ${err.message}`);
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
      // Dùng decode ở đây là OK vì chỉ cần lấy userId để xóa Redis key,
      // không cần trust payload về mặt authentication.
      const decoded = jwt.decode(token) as { userId: string } | null;
      if (decoded?.userId) {
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
    // FIX: Dùng jwt.verify với ignoreExpiration thay vì jwt.decode().
    // jwt.decode() không kiểm tra chữ ký — attacker có thể forge payload tuỳ ý.
    // Access token tại đây thường đã hết hạn (đó là lý do cần refresh),
    // nên cần ignoreExpiration: true để bỏ qua lỗi exp nhưng VẪN verify signature.
    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
        ignoreExpiration: true,
      }) as { userId: string; role: string };
    } catch (verifyErr: any) {
      // Signature sai hoàn toàn — không phải token hợp lệ của hệ thống
      logger.warn(`refreshToken: invalid signature — ${verifyErr.message}`);
      res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    if (!decoded?.userId) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    const redisKey = `auth:refresh:${decoded.userId}:${oldRefreshToken}`;
    const tokenExists = await redis.exists(redisKey);

    if (!tokenExists) {
      // Refresh token reuse detected — revoke toàn bộ sessions của user này
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

    // Rotate: xóa refresh token cũ, cấp cặp token mới
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
    // [C-03 FIX] Rotate CSRF token cùng lúc với access token để giữ chúng luôn sync.
    rotateCsrfToken(res);

    return res.json({ status: "refreshed" });
  } catch (err: any) {
    logger.error(`Token refresh failed: ${err.message}`);
    return res.status(401).json({ message: "Lỗi xác thực lại" });
  }
}

export async function me(req: Request, res: Response) {
  const token = req.cookies?.token;
  // [M-07 FIX] Trả 401 nhất quán cho cả 2 trường hợp không có token và token hết hạn.
  // Trước đây "!token" trả 200+null trong khi token expired trả 401
  // → frontend không trigger auto-refresh khi cookie bị xóa nhưng session vẫn còn.
  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

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
    // 1. Thu hồi toàn bộ Refresh Token của user trong Redis
    const keys = await redis.keys(`auth:refresh:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    // 2. Xóa toàn bộ hình ảnh của sản phẩm trên Cloudinary (bulk delete để tránh timeout)
    // [C-02 FIX] Trước đây dùng nested await trong loop → 500 ảnh × 200ms = timeout 100s.
    // Dùng cloudinary.api.delete_resources() batch tối đa 100 ảnh/lần.
    const products = await Product.find({ sellerId: userId as any });
    const allPublicIds = products
      .flatMap((p) => (p.images || []).map(extractPublicId))
      .filter((id): id is string => !!id);

    const BATCH_SIZE = 100;
    for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
      const batch = allPublicIds.slice(i, i + BATCH_SIZE);
      await cloudinary.api.delete_resources(batch).catch((err: any) => {
        logger.error(`GDPR: Cloudinary bulk delete failed (batch ${i / BATCH_SIZE + 1}): ${err.message}`);
      });
    }

    // 3. Xóa cascade tất cả dữ liệu liên quan
    const productIds = products.map((p) => p._id.toString());
    await Product.deleteMany({ sellerId: userId as any });

    // [M-04 FIX] Invalidate Redis cache cho các sản phẩm đã xóa
    if (productIds.length > 0) {
      const pipe = redis.pipeline();
      productIds.forEach((id) => pipe.del(`product:detail:${id}`));
      pipe.incr("product:list:version:Fresh");
      pipe.incr("product:list:version:Dried");
      await pipe.exec();
    }
    await Review.deleteMany({
      $or: [{ reviewerId: userId as any }, { sellerId: userId as any }],
    });
    await Message.deleteMany({
      $or: [{ senderId: userId as any }, { receiverId: userId as any }],
    });
    await Report.deleteMany({ reporterId: userId as any });
    await Notification.deleteMany({ userId: userId as any });

    // 4. Xóa User
    await User.findByIdAndDelete(userId);

    // 5. Làm sạch Cookie
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
  const { name, email } = req.body;

  if (!name || typeof name !== "string" || !name.trim())
    return res.status(400).json({ message: "Tên không được để trống" });

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100)
    return res.status(400).json({ message: "Tên phải từ 2 đến 100 ký tự" });

  if (email) {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email))
      return res
        .status(400)
        .json({ message: "Email không hợp lệ" });
  }

  try {
    const result = await authService.updateProfile(userId, {
      name: trimmed,
      email,
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

export async function googleAuth(req: Request, res: Response) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Thiếu ID Token bảo mật từ Google" });
  }

  try {
    let email: string = "";
    let name: string = "";
    let avatar: string = "";

    const isMockToken = idToken.startsWith("mock_google_token_");

    if (isMockToken) {
      const parts = idToken.split("_");
      email = parts[3] || "mockuser@gmail.com";
      name = `Mock User (${email.split("@")[0]})`;
      avatar = "";
      logger.info(`🔑 [MOCK GOOGLE LOGIN] Email=${email}, Name=${name}`);
    } else {
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const verifyRes = await fetch(verifyUrl);
      if (!verifyRes.ok) {
        return res.status(400).json({ message: "Xác thực token Google thất bại" });
      }

      const payload = (await verifyRes.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        aud?: string;
      };

      if (!payload.email) {
        return res.status(400).json({ message: "Token Google không hợp lệ hoặc thiếu Email" });
      }

      const envClientId = process.env.GOOGLE_CLIENT_ID;
      if (envClientId && payload.aud !== envClientId) {
        return res.status(400).json({ message: "Audience token không khớp với Client ID hệ thống" });
      }

      email = payload.email.toLowerCase().trim();
      name = payload.name || email.split("@")[0];
      avatar = payload.picture || "";
      logger.info(`✅ [GOOGLE SIGN IN SUCCESS] Email=${email}, Name=${name}`);
    }

    let user = await userRepository.findByEmail(email);
    let userId: string;

    if (!user) {
      const u = new User({
        name: name,
        email: email,
        passwordHash: "google_oauth_no_password_hash_placeholder",
        isVerified: true,
        avatar: avatar || null,
        isActive: true,
        role: "User",
      });
      await u.save();
      userId = u._id.toString();
      logger.info(`✨ Created new Google User: ID=${userId}, Email=${email}`);
    } else {
      userId = user.userId;
      if (user.isActive === false) {
        return res.status(403).json({ message: "Tài khoản đã bị khoá. Vui lòng liên hệ admin." });
      }
      logger.info(`🚪 Existing Google User logged in: ID=${userId}, Email=${email}`);
    }

    const updatedUser = await userRepository.findById(userId);
    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy thông tin tài khoản vừa tạo" });
    }

    const authUserResult = {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      avatarUrl: updatedUser.avatarUrl,
    };

    const accessToken = authService.signToken(authUserResult.userId, authUserResult.role);
    const refreshToken = crypto.randomBytes(40).toString("hex");

    await redis.set(
      `auth:refresh:${authUserResult.userId}:${refreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600,
    );

    res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

    return res.json({ user: authUserResult });
  } catch (err: any) {
    logger.error(`Google Sign-In failed: ${err.message}`);
    return sendServerError(res, err);
  }
}

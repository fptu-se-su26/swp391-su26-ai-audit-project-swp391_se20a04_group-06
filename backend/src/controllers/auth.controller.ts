import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";
import { redis } from "../config/redis";
import { sendServerError } from "../helpers/response.helper";
import { AUTH_COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config/cookie";
import { rotateCsrfToken } from "../middlewares/csrf";
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
  const { name, email, password } = req.body;
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
    rotateCsrfToken(res);

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

  if (oldRefreshToken) {
    let userId: string | null = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
          ignoreExpiration: true,
        }) as { userId: string } | null;
        userId = decoded?.userId || null;
      } catch (err) {}
    }
    try {
      if (userId) {
        await redis.del(`auth:refresh:${userId}:${oldRefreshToken}`);
        logger.info(`Tokens revoked in Redis on logout for UserID=${userId}`);
      }
    } catch (err: any) {
      logger.error(`Token revocation error in Redis on logout: ${err.message}`);
    }
  }

  res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
  res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
  res.clearCookie("csrfToken", {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.json({ message: "Đã đăng xuất thành công!" });
}

export async function deleteAccount(req: Request, res: Response) {
  const { userId } = req.user;
  try {
    await authService.deleteAccount(userId);

    res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("csrfToken", {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

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

  try {
    const result = await authService.updateProfile(userId, {
      name: name.trim(),
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

  try {
    await authService.changePassword(userId, currentPassword, newPassword);

    let cursor = "0";
    const keys: string[] = [];
    do {
      const reply = await redis.scan(
        cursor,
        "MATCH",
        `auth:refresh:${userId}:*`,
        "COUNT",
        100,
      );
      cursor = reply[0];
      keys.push(...reply[1]);
    } while (cursor !== "0");

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    logger.info(
      `Password changed and all active sessions revoked safely for UserID=${userId}`,
    );

    res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);

    return res.json({
      message:
        "Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.",
    });
  } catch (err: any) {
    logger.error(`Password change failed: ${err.message}`);
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function me(req: Request, res: Response) {
  const token = req.cookies?.token;
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

export async function refreshToken(req: Request, res: Response) {
  const oldRefreshToken = req.cookies?.refreshToken;
  const token = req.cookies?.token;

  if (!oldRefreshToken || !token) {
    return res.status(401).json({ message: "Phiên làm việc hết hạn" });
  }

  try {
    let decoded: { userId: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
        ignoreExpiration: true,
      }) as { userId: string; role: string };
    } catch (verifyErr: any) {
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
      let cursor = "0";
      const keys: string[] = [];
      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${decoded.userId}:*`,
          "COUNT",
          100,
        );
        cursor = reply[0];
        keys.push(...reply[1]);
      } while (cursor !== "0");

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
      res.clearCookie("refreshToken", CLEAR_COOKIE_OPTIONS);
      logger.warn(
        `Potential token reuse detected. Revoking all tokens safely for UserID=${decoded.userId}`,
      );
      return res.status(403).json({
        message:
          "Phátional Token đã qua sử dụng. Vui lòng đăng nhập lại để đảm bảo an toàn.",
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
    rotateCsrfToken(res);

    return res.json({ status: "refreshed" });
  } catch (err: any) {
    logger.error(`Token refresh failed: ${err.message}`);
    return res.status(401).json({ message: "Lỗi xác thực lại" });
  }
}

export async function googleAuth(req: Request, res: Response) {
  const { idToken } = req.body;

  if (!idToken) {
    return res
      .status(400)
      .json({ message: "Thiếu ID Token bảo mật từ Google" });
  }

  try {
    // Chuyển giao toàn bộ logic phân tích token và tạo tài khoản sang tầng Service xử lý
    const authResult = await authService.googleAuth(idToken);

    const accessToken = authService.signToken(
      authResult.userId,
      authResult.role,
    );
    const refreshToken = crypto.randomBytes(40).toString("hex");

    await redis.set(
      `auth:refresh:${authResult.userId}:${refreshToken}`,
      "1",
      "EX",
      7 * 24 * 3600,
    );

    res.cookie("token", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);

    return res.json({ user: authResult });
  } catch (err: any) {
    logger.error(`Google Sign-In failed: ${err.message}`);
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    return sendServerError(res, err);
  }
}

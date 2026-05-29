import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import { cloudinary } from "../config/cloudinary";
import { HttpError } from "../errors/HttpError";

/**
 * Auth Service — chứa toàn bộ business logic liên quan đến xác thực.
 */

export interface AuthUserResult {
  userId: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  avatarUrl: string | null;
  isPremium: boolean;
}

export const authService = {
  /** Đăng ký tài khoản mới */
  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthUserResult> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(cleanEmail);
    if (existing) throw new HttpError(409, "Email đã được đăng ký");

    const hash = await bcrypt.hash(password, 10);
    const userId = await userRepository.create(name.trim(), cleanEmail, hash);

    return {
      userId,
      name: name.trim(),
      email: cleanEmail,
      role: "User",
      isVerified: false,
      avatarUrl: null,
      isPremium: false,
    };
  },

  /** Đăng nhập — trả về thông tin user nếu hợp lệ */
  async login(email: string, password: string): Promise<AuthUserResult> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user)
      throw new HttpError(401, "Email hoặc mật khẩu không đúng");

    // [C-01 FIX & M-01 Standardize] Check isActive as boolean, use camelCase fields.
    if (user.isActive === false)
      throw new HttpError(403, "Tài khoản đã bị khoá. Vui lòng liên hệ admin.");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Email hoặc mật khẩu không đúng");

    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatarUrl: user.avatar,
      isPremium: !!user.isPremium,
    };
  },

  /** Cập nhật profile — trả về các field đã được cập nhật */
  async updateProfile(
    userId: string,
    data: { name: string; email?: string; fileBuffer?: Buffer },
  ): Promise<{ name: string; email?: string; avatarUrl?: string }> {
    const updates: { name?: string; email?: string; avatar?: string } = {
      name: data.name,
    };

    if (data.email !== undefined) {
      const cleanEmail = data.email.toLowerCase().trim();
      const taken = await userRepository.emailExistsForOther(
        cleanEmail,
        userId,
      );
      if (taken)
        throw new HttpError(409, "Email đã được người khác đăng ký");
      updates.email = cleanEmail;
    }

    if (data.fileBuffer) {
      updates.avatar = await uploadAvatarToCloudinary(data.fileBuffer);
    }

    await userRepository.updateProfile(userId, updates);

    return {
      name: data.name,
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.avatar !== undefined && { avatarUrl: updates.avatar }),
    };
  },

  /** Đổi mật khẩu sau khi xác minh mật khẩu hiện tại */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const hash = await userRepository.getPasswordHash(userId);
    if (!hash) throw new HttpError(404, "Không tìm thấy người dùng");

    const ok = await bcrypt.compare(currentPassword, hash);
    if (!ok) throw new HttpError(401, "Mật khẩu hiện tại không đúng");

    await userRepository.updatePassword(
      userId,
      await bcrypt.hash(newPassword, 10),
    );
  },

  /**
   * Ký JWT access token ngắn hạn (luôn là 15 phút).
   *
   * FIX: KHÔNG dùng JWT_EXPIRES_IN từ env — access token PHẢI ngắn để giảm cửa sổ
   * tấn công. Nếu attacker lấy được access token, thiệt hại chỉ kéo dài tối đa 15 phút.
   * Thời hạn dài hạn do refresh token (opaque, lưu Redis) đảm nhiệm.
   */
  signToken(userId: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret)
      throw new Error("JWT_SECRET chưa được cấu hình trong file .env");
    const options: SignOptions = {
      expiresIn: "15m",
    };
    return jwt.sign({ userId, role }, secret, options);
  },
};

/* ─── Private helpers ────────────────────────────────────────── */

async function uploadAvatarToCloudinary(buffer: Buffer): Promise<string> {
  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars" },
      (error, result) => (result ? resolve(result) : reject(error)),
    );
    stream.end(buffer);
  });
  return result.secure_url || result.url;
}

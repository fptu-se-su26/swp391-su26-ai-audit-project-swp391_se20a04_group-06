import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { cloudinary } from '../config/cloudinary';

/**
 * Auth Service — chứa toàn bộ business logic liên quan đến xác thực.
 */

export interface AuthUserResult {
  userId: string;
  name: string;
  phone: string;
  role: string;
  isVerified: boolean;
  avatarUrl: string | null;
}

/** HttpError — lỗi có kèm HTTP status để controller xử lý đúng mã */
class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const authService = {
  /** Đăng ký tài khoản mới */
  async register(name: string, phone: string, password: string): Promise<AuthUserResult> {
    const existing = await userRepository.findByPhone(phone);
    if (existing) throw new HttpError(409, 'Số điện thoại đã được đăng ký');

    const hash = await bcrypt.hash(password, 10);
    const userId = await userRepository.create(name.trim(), phone, hash);

    return { userId, name: name.trim(), phone, role: 'User', isVerified: false, avatarUrl: null };
  },

  /** Đăng nhập — trả về thông tin user nếu hợp lệ */
  async login(phone: string, password: string): Promise<AuthUserResult> {
    const user = await userRepository.findByPhone(phone);
    if (!user) throw new HttpError(401, 'Số điện thoại hoặc mật khẩu không đúng');
    if (!user.IsActive) throw new HttpError(403, 'Tài khoản đã bị khoá. Vui lòng liên hệ admin.');

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) throw new HttpError(401, 'Số điện thoại hoặc mật khẩu không đúng');

    return {
      userId: user.UserID,
      name: user.Name,
      phone: user.Phone,
      role: user.Role,
      isVerified: !!user.IsVerified,
      avatarUrl: user.Avatar,
    };
  },

  /** Cập nhật profile — trả về các field đã được cập nhật */
  async updateProfile(
    userId: string,
    data: { name: string; phone?: string; fileBuffer?: Buffer },
  ): Promise<{ name: string; phone?: string; avatarUrl?: string }> {
    const updates: { name?: string; phone?: string; avatar?: string } = {
      name: data.name,
    };

    if (data.phone !== undefined) {
      const taken = await userRepository.phoneExistsForOther(data.phone, userId);
      if (taken) throw new HttpError(409, 'Số điện thoại đã được người khác đăng ký');
      updates.phone = data.phone;
    }

    if (data.fileBuffer) {
      updates.avatar = await uploadAvatarToCloudinary(data.fileBuffer);
    }

    await userRepository.updateProfile(userId, updates);

    return {
      name: data.name,
      ...(updates.phone !== undefined && { phone: updates.phone }),
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
    if (!hash) throw new HttpError(404, 'Không tìm thấy người dùng');

    const ok = await bcrypt.compare(currentPassword, hash);
    if (!ok) throw new HttpError(401, 'Mật khẩu hiện tại không đúng');

    await userRepository.updatePassword(userId, await bcrypt.hash(newPassword, 10));
  },

  /**
   * Ký JWT token.
   */
  signToken(userId: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET chưa được cấu hình trong file .env');
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    };
    return jwt.sign({ userId, role }, secret, options);
  },
};

/* ─── Private helpers ────────────────────────────────────────── */

async function uploadAvatarToCloudinary(buffer: Buffer): Promise<string> {
  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'avatars' },
      (error, result) => (result ? resolve(result) : reject(error)),
    );
    stream.end(buffer);
  });
  return result.secure_url || result.url;
}

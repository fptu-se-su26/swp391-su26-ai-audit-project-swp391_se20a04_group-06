import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import { userRepository } from "../repositories/user.repository";
import { postRepository } from "../repositories/post.repository";
import { redis } from "../config/redis";
import { cloudinary } from "../config/cloudinary";
import { HttpError } from "../errors/HttpError";
import { deleteFromCloudinary } from "../middlewares/upload";
import { extractPublicId } from "../utils/cloudinary";
import { logger } from "../utils/logger";
import { boatLogRepository } from "../repositories/boatlog.repository";

import { User } from "../models/User";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Message } from "../models/Message";
import { Report } from "../models/Report";
import { Notification } from "../models/Notification";
import { Post } from "../models/Post";
import { Recipe } from "../models/Recipe";
import { BoatLog } from "../models/BoatLog";

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

  async login(email: string, password: string): Promise<AuthUserResult> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      await bcrypt.compare(
        "dummy_password",
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhy/",
      );
      throw new HttpError(401, "Email hoặc mật khẩu không đúng");
    }

    if (user.isActive === false) {
      throw new HttpError(403, "Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
    }

    if (user.passwordHash === "google_oauth_no_password_hash_placeholder") {
      throw new HttpError(
        400,
        "Tài khoản của bạn được thiết lập bằng Google. Vui lòng đăng nhập bằng Google.",
      );
    }

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

  async googleAuth(idToken: string): Promise<AuthUserResult> {
    let email = "";
    let name = "";
    let avatar = "";

    const isProduction = process.env.NODE_ENV === "production";
    const isMockAllowed =
      process.env.ALLOW_MOCK_AUTH === "true" && !isProduction;
    const isMockToken =
      isMockAllowed && idToken.startsWith("mock_google_token_");

    if (isMockToken) {
      const parts = idToken.split("_");
      email = parts[3] || "mockuser@gmail.com";
      name = `Mock User (${email.split("@")[0]})`;
      avatar = "";
      logger.info(`🔑 [MOCK GOOGLE LOGIN] Email=${email}, Name=${name}`);
    } else {
      if (idToken.startsWith("mock_google_token_")) {
        throw new HttpError(
          403,
          "Chế độ đăng nhập giả lập bị cấm hoàn toàn tại môi trường Production.",
        );
      }

      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const verifyRes = await fetch(verifyUrl);
      if (!verifyRes.ok) {
        throw new HttpError(400, "Xác thực token Google thất bại");
      }

      const payload = (await verifyRes.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        aud?: string;
        email_verified?: boolean | string;
      };

      if (
        payload.email_verified !== true &&
        payload.email_verified !== "true"
      ) {
        throw new HttpError(400, "Tài khoản Google này chưa được xác minh.");
      }

      if (!payload.email) {
        throw new HttpError(400, "Token Google không hợp lệ hoặc thiếu Email");
      }

      const envClientId = process.env.GOOGLE_CLIENT_ID;
      if (envClientId && payload.aud !== envClientId) {
        throw new HttpError(
          400,
          "Audience token không khớp với Client ID hệ thống",
        );
      }

      email = payload.email.toLowerCase().trim();
      name = payload.name || email.split("@")[0];
      avatar = payload.picture || "";
      logger.info(`✅ [GOOGLE SIGN IN SUCCESS] Email=${email}, Name=${name}`);
    }

    let user = await userRepository.findByEmail(email);
    let userId: string;

    if (!user) {
      userId = await userRepository.create(
        name,
        email,
        "google_oauth_no_password_hash_placeholder",
      );
      await userRepository.updateVerificationStatus(userId, true);
      logger.info(`✨ Created new Google User: ID=${userId}, Email=${email}`);
    } else {
      userId = user.userId;
      if (user.isActive === false) {
        throw new HttpError(
          403,
          "Tài khoản đã bị khoá. Vui lòng liên hệ admin.",
        );
      }

      if (
        isMockToken &&
        email.toLowerCase().includes("admin") &&
        user.role !== "Admin"
      ) {
        const rawUser = await userRepository.findRawById(userId);
        if (rawUser) {
          rawUser.role = "Admin";
          rawUser.isVerified = true;
          await rawUser.save();
        }
        logger.info(`✨ Auto-promoted existing user to Admin: Email=${email}`);
      }

      logger.info(
        `🚪 Existing Google User logged in: ID=${userId}, Email=${email}`,
      );
    }

    const updatedUser = await userRepository.findById(userId);
    if (!updatedUser) {
      throw new HttpError(404, "Không tìm thấy thông tin tài khoản");
    }

    return {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      avatarUrl: updatedUser.avatarUrl,
      isPremium: !!updatedUser.isPremium,
    };
  },

  async deleteAccount(userId: string): Promise<void> {
    const session = await mongoose.startSession();
    let dbOptions: any = {};

    let keysToDelete: string[] = [];
    let allPublicIds: string[] = [];
    let productIds: any[] = [];

    try {
      session.startTransaction();
      dbOptions = { session };
    } catch (err: any) {
      session.endSession();
      if (err.message && err.message.includes("replica set")) {
        logger.warn("MongoDB Standalone detected. Bỏ qua Transaction ACID.");
      } else {
        throw err; // Ném lỗi thực tế ra ngoài nếu là sự cố kết nối nghiêm trọng
      }
    }

    try {
      let cursor = "0";
      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${userId}:*`,
          "COUNT",
          100,
        );
        cursor = reply[0];
        keysToDelete.push(...reply[1]);
      } while (cursor !== "0");

      const products = await Product.find(
        { sellerId: userId },
        null,
        dbOptions,
      );
      allPublicIds = products
        .flatMap((p) => (p.images || []).map(extractPublicId))
        .filter((id): id is string => !!id);
      productIds = products.map((p) => p._id);

      await User.updateMany(
        {},
        { $pull: { following: userId as any } },
        dbOptions,
      );

      if (productIds.length > 0) {
        await User.updateMany(
          {},
          { $pull: { favorites: { $in: productIds } as any } },
          dbOptions,
        );
        await Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Notification.deleteMany(
          { productId: { $in: productIds } },
          dbOptions,
        );
      }

      await Product.deleteMany({ sellerId: userId }, dbOptions);

      await Review.deleteMany(
        { $or: [{ reviewerId: userId as any }, { sellerId: userId as any }] },
        dbOptions,
      );
      await Message.deleteMany(
        { $or: [{ senderId: userId as any }, { receiverId: userId as any }] },
        dbOptions,
      );
      await Report.deleteMany({ reporterId: userId }, dbOptions);
      await Notification.deleteMany({ userId: userId }, dbOptions);
      await Post.deleteMany({ userId: userId }, dbOptions);
      await Recipe.deleteMany({ authorId: userId }, dbOptions);
      await BoatLog.deleteMany({ userId: userId }, dbOptions);

      await Post.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
      await Recipe.updateMany(
        {},
        { $pull: { likes: userId as any } },
        dbOptions,
      );
      await Post.updateMany(
        {},
        { $pull: { comments: { userId: userId as any } } },
        dbOptions,
      );

      await User.findByIdAndDelete(userId, dbOptions);

      if (dbOptions.session) await session.commitTransaction();
      logger.info(
        `GDPR SUCCESS: DB Deletion successfully finalized for UserID=${userId}`,
      );
    } catch (err: any) {
      if (dbOptions.session) await session.abortTransaction();
      logger.error(
        `GDPR FAILED: DB Rollback initiated. Error for UserID=${userId}: ${err.message}`,
      );
      throw err;
    } finally {
      session.endSession();
    }

    if (keysToDelete.length > 0) {
      await redis
        .del(...keysToDelete)
        .catch((e) => logger.error(`Redis key deletion failed: ${e.message}`));
    }

    // Giải phóng triệt để hình ảnh trên Cloudinary
    if (allPublicIds.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < allPublicIds.length; i += BATCH_SIZE) {
        const batch = allPublicIds.slice(i, i + BATCH_SIZE);
        await cloudinary.api.delete_resources(batch).catch((err: any) => {
          logger.error(`GDPR: Cloudinary bulk delete failed: ${err.message}`);
        });
      }
    }

    if (productIds.length > 0) {
      const pipe = redis.pipeline();
      productIds.forEach((id) => pipe.del(`product:detail:${id.toString()}`));
      pipe.incr("product:list:version:Fresh");
      pipe.incr("product:list:version:Dried");
      await pipe
        .exec()
        .catch((e) => logger.error(`Redis cache clear failed: ${e.message}`));
    }
  },

  async updateProfile(
    userId: string,
    data: { name: string; email?: string; fileBuffer?: Buffer },
  ) {
    const updates: any = { name: data.name };

    if (data.email !== undefined) {
      const cleanEmail = data.email.toLowerCase().trim();
      const taken = await userRepository.emailExistsForOther(
        cleanEmail,
        userId,
      );
      if (taken) throw new HttpError(409, "Email đã được người khác đăng ký");
      updates.email = cleanEmail;
      const currentUser = await userRepository.findRawById(userId);
      if (currentUser && currentUser.role !== "Admin") {
        updates.isVerified = false;
      }
    }

    if (data.fileBuffer) {
      const currentUser = await userRepository.findRawById(userId);
      if (currentUser?.avatar) {
        const oldPublicId = extractPublicId(currentUser.avatar);
        if (oldPublicId) {
          deleteFromCloudinary(oldPublicId).catch((err) =>
            logger.error(
              `Failed to delete old avatar on Cloudinary: ${err.message}`,
            ),
          );
        }
      }
      updates.avatar = await uploadAvatarToCloudinary(data.fileBuffer);
    }

    await userRepository.updateProfile(userId, updates);

    try {
      const cascadeObj: any = { userName: updates.name };
      if (updates.avatar !== undefined) cascadeObj.userAvatar = updates.avatar;

      await postRepository.updateMany({ userId } as any, { $set: cascadeObj });

      const commentUpdate: any = {};
      commentUpdate["comments.$[elem].userName"] = updates.name;
      if (updates.avatar !== undefined)
        commentUpdate["comments.$[elem].userAvatar"] = updates.avatar;

      await postRepository.updateMany(
        { "comments.userId": userId } as any,
        { $set: commentUpdate },
        { arrayFilters: [{ "elem.userId": userId }] } as any,
      );

      await boatLogRepository.updateMany({ userId } as any, {
        $set: cascadeObj,
      });
    } catch (err: any) {
      logger.error(
        `Failed to cascade update profile details for UserID=${userId}: ${err.message}`,
      );
    }

    return {
      name: data.name,
      ...(updates.email !== undefined && { email: updates.email }),
      ...(updates.avatar !== undefined && { avatarUrl: updates.avatar }),
    };
  },

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

  signToken(userId: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET chưa được cấu hình");
    const options: SignOptions = { expiresIn: "15m" };
    return jwt.sign({ userId, role }, secret, options);
  },
};

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

import mongoose from "mongoose";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { redis } from "../../../../config/redis";
import { cloudinary } from "../../../../config/cloudinary";
import { logger } from "../../../../utils/logger";
import { extractPublicId } from "../../../../utils/cloudinary";

// Cần dùng các model cũ để dọn dẹp quan hệ đa bảng
import { User as MongooseUser } from "../../../../models/User";
import { Product } from "../../../../models/Product";
import { Review } from "../../../../models/Review";
import { Message } from "../../../../models/Message";
import { Report } from "../../../../models/Report";
import { Notification } from "../../../../models/Notification";
import { Post } from "../../../../models/Post";
import { Recipe } from "../../../../models/Recipe";
import { BoatLog } from "../../../../models/BoatLog";

export class DeleteAccountUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");

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
        throw err;
      }
    }

    try {
      // 1. Quét tìm các session token của người dùng trên Redis
      let cursor = "0";
      do {
        const reply = await redis.scan(
          cursor,
          "MATCH",
          `auth:refresh:${userId}:*`,
          "COUNT",
          100
        );
        cursor = reply[0];
        keysToDelete.push(...reply[1]);
      } while (cursor !== "0");

      // 2. Tìm danh sách sản phẩm ngư dân đăng bán
      const products = await Product.find({ sellerId: userId }, null, dbOptions);
      allPublicIds = products
        .flatMap((p) => (p.images || []).map(extractPublicId))
        .filter((id): id is string => !!id);
      productIds = products.map((p) => p._id);

      // 3. Xoá quan hệ follow người bán
      await MongooseUser.updateMany(
        {},
        { $pull: { following: userId as any } },
        dbOptions
      );

      if (productIds.length > 0) {
        await MongooseUser.updateMany(
          {},
          { $pull: { favorites: { $in: productIds } as any } },
          dbOptions
        );
        await Review.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Message.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Report.deleteMany({ productId: { $in: productIds } }, dbOptions);
        await Notification.deleteMany({ productId: { $in: productIds } }, dbOptions);
      }

      await Product.deleteMany({ sellerId: userId }, dbOptions);

      await Review.deleteMany(
        { $or: [{ reviewerId: userId as any }, { sellerId: userId as any }] },
        dbOptions
      );
      await Message.deleteMany(
        { $or: [{ senderId: userId as any }, { receiverId: userId as any }] },
        dbOptions
      );
      await Report.deleteMany({ reporterId: userId }, dbOptions);
      await Notification.deleteMany({ userId: userId }, dbOptions);
      await Post.deleteMany({ userId: userId }, dbOptions);
      await Recipe.deleteMany({ authorId: userId }, dbOptions);
      await BoatLog.deleteMany({ userId: userId }, dbOptions);

      await Post.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
      await Recipe.updateMany({}, { $pull: { likes: userId as any } }, dbOptions);
      await Post.updateMany(
        {},
        { $pull: { comments: { userId: userId as any } } },
        dbOptions
      );

      // 4. Xóa thông tin User Aggregate Root
      await this.userRepository.delete(user);

      if (dbOptions.session) await session.commitTransaction();
      logger.info(`GDPR SUCCESS: DB Deletion successfully finalized for UserID=${userId}`);
    } catch (err: any) {
      if (dbOptions.session) await session.abortTransaction();
      logger.error(`GDPR FAILED: DB Rollback initiated. Error for UserID=${userId}: ${err.message}`);
      throw err;
    } finally {
      session.endSession();
    }

    // 5. Dọn dẹp tài nguyên Redis & Cloudinary
    if (keysToDelete.length > 0) {
      await redis
        .del(...keysToDelete)
        .catch((e) => logger.error(`Redis key deletion failed: ${e.message}`));
    }

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
  }
}

import { getIO } from "../socket";
import { userRepository } from "../repositories/user.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { broadcastLogRepository } from "../repositories/broadcastlog.repository";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import { User } from "../models/User";

export async function broadcastToUsers(params: {
  adminId: string;
  content: string;
  targetRole: "all" | "Seller" | "Buyer";
}): Promise<{ sentCount: number; broadcast: object }> {
  const { adminId, content, targetRole } = params;

  const query: Record<string, unknown> =
    targetRole === "all" ? { role: { $ne: "Admin" } } : { role: targetRole };

  // [FIX PERFORMANCE 3] Sử dụng Lean Queries để tránh RAM Leak
  const recipients = await User.find(query).select("_id").lean();
  const sentCount = recipients.length;

  if (sentCount > 0) {
    const docs = recipients.map((u) => ({
      userId: u._id,
      type: "broadcast",
      content,
      isRead: false,
    }));

    const inserted = await notificationRepository.insertMany(docs);

    const idByUser = new Map<string, string>(
      inserted.map((n, i) => [
        recipients[i]._id.toString(),
        (n._id as mongoose.Types.ObjectId).toString(),
      ]),
    );

    const io = getIO();
    for (const u of recipients) {
      const uid = u._id.toString();
      io.to(`user_${uid}`).emit("notification", {
        id: idByUser.get(uid),
        type: "broadcast",
        preview: content,
      });
    }
  }

  const log = await broadcastLogRepository.create({
    adminId,
    content,
    targetRole,
    sentCount,
  });

  return {
    sentCount,
    broadcast: {
      id: log._id.toString(),
      content: log.content,
      targetRole: log.targetRole,
      sentCount: log.sentCount,
      createdAt: log.createdAt,
    },
  };
}

export async function notifyFollowersNewProduct(
  sellerId: string,
  sellerName: string,
  productId: string,
  productName: string,
): Promise<void> {
  try {
    // [FIX PERFORMANCE 3]
    const followers = await User.find({
      following: new mongoose.Types.ObjectId(sellerId),
    })
      .select("_id")
      .lean();

    if (followers.length === 0) return;

    const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
    const io = getIO();

    const docs = followers.map((f) => ({
      userId: f._id,
      type: "new_product",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
    }));

    const inserted = await notificationRepository.insertMany(docs);

    const idByFollower = new Map<string, string>(
      inserted.map((n, i) => [
        followers[i]._id.toString(),
        (n._id as mongoose.Types.ObjectId).toString(),
      ]),
    );

    for (const f of followers) {
      const fId = f._id.toString();
      io.to(`user_${fId}`).emit("notification", {
        id: idByFollower.get(fId),
        type: "new_product",
        productId,
        sellerId,
        preview: previewText,
      });
    }
  } catch (err: any) {
    logger.error("Lỗi khi lưu/phát thông báo sản phẩm mới:", {
      message: err.message,
    });
  }
}

export async function notifySellerNewReview(params: {
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  productId: string;
  productName: string;
  reviewId: string;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const {
    sellerId,
    reviewerName,
    productName,
    productId,
    reviewId,
    rating,
    comment,
  } = params;

  const previewText =
    `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
    `"${comment ? comment.slice(0, 40) : "Không có nhận xét"}"`;

  try {
    const notif = await notificationRepository.create({
      userId: new mongoose.Types.ObjectId(sellerId) as any,
      type: "new_review",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId) as any,
      reviewId: new mongoose.Types.ObjectId(reviewId) as any,
    });

    getIO().to(`user_${sellerId}`).emit("notification", {
      id: notif._id.toString(),
      type: "new_review",
      productId,
      sellerId,
      reviewId,
      preview: previewText,
    });
  } catch (err: any) {
    logger.error("Lỗi khi lưu và phát thông báo đánh giá:", {
      message: err.message,
    });
  }
}

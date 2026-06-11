import { getIO } from "../socket";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import mongoose from "mongoose";
import { BroadcastLog } from "../models/BroadcastLog";

// ─── Thông báo sản phẩm mới → toàn bộ follower ────────────────────────────
/**
 * Thêm vào cuối notification.service.ts (cùng file với notifyFollowersNewProduct / notifySellerNewReview).
 * Nhớ thêm import BroadcastLog ở đầu file:
 *   import { BroadcastLog } from '../models/BroadcastLog';
 */

/** Gửi thông báo broadcast từ admin đến nhóm người dùng được chỉ định */
export async function broadcastToUsers(params: {
  adminId: string;
  content: string;
  targetRole: "all" | "Seller" | "Buyer";
}): Promise<{ sentCount: number; broadcast: object }> {
  const { adminId, content, targetRole } = params;

  // Xây query: luôn loại trừ Admin; nếu targetRole cụ thể thì lọc thêm role
  const query: Record<string, unknown> =
    targetRole === "all" ? { role: { $ne: "Admin" } } : { role: targetRole };

  const recipients = await User.find(query).select("_id");
  const sentCount = recipients.length;

  if (sentCount > 0) {
    // Tạo Notification docs trong một lần ghi duy nhất
    const docs = recipients.map((u) => ({
      userId: u._id,
      type: "broadcast",
      content,
      isRead: false,
    }));

    const inserted = await Notification.insertMany(docs);

    // Map userId → notifId để emit id thật (tránh tmp_ trên client)
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

  // Lưu bản ghi lịch sử broadcast
  const log = await BroadcastLog.create({
    adminId: new mongoose.Types.ObjectId(adminId),
    content,
    targetRole,
    sentCount,
  });

  return {
    sentCount,
    broadcast: {
      id: (log._id as mongoose.Types.ObjectId).toString(),
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
    const followers = await User.find({
      following: new mongoose.Types.ObjectId(sellerId),
    }).select("_id");

    if (followers.length === 0) return;

    const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
    const io = getIO();

    // Lưu tất cả vào DB một lần (insertMany hiệu quả hơn save() lặp)
    const docs = followers.map((f) => ({
      userId: f._id,
      type: "new_product",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
    }));

    const inserted = await Notification.insertMany(docs);

    // FIX: map follower._id → notif._id để emit id thật, tránh tmp_ trên client
    const idByFollower = new Map<string, string>(
      inserted.map((n, i) => [
        followers[i]._id.toString(),
        (n._id as mongoose.Types.ObjectId).toString(),
      ]),
    );

    for (const f of followers) {
      const fId = f._id.toString();
      io.to(`user_${fId}`).emit("notification", {
        id: idByFollower.get(fId), // ← id thật từ MongoDB
        type: "new_product",
        productId,
        sellerId,
        preview: previewText,
      });
    }
  } catch (err) {
    console.error("Lỗi khi lưu/phát thông báo sản phẩm mới:", err);
  }
}

// ─── Thông báo đánh giá mới → người bán ───────────────────────────────────

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
    productId,
    productName,
    reviewId,
    rating,
    comment,
  } = params;

  const previewText =
    `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
    `"${comment ? comment.slice(0, 40) : "Không có nhận xét"}"`;

  try {
    const notif = new Notification({
      userId: new mongoose.Types.ObjectId(sellerId),
      type: "new_review",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
      reviewId: new mongoose.Types.ObjectId(reviewId),
    });

    await notif.save();

    getIO()
      .to(`user_${sellerId}`)
      .emit("notification", {
        id: (notif._id as mongoose.Types.ObjectId).toString(), // ← FIX
        type: "new_review",
        productId,
        sellerId,
        reviewId,
        preview: previewText,
      });
  } catch (err) {
    console.error("Lỗi khi lưu và phát thông báo đánh giá:", err);
  }
}

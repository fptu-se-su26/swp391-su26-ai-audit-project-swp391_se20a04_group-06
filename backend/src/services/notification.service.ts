// Import hàm getIO để gửi thông báo thời gian thực qua socket
import { getIO } from "../socket";
// Import đối tượng userRepository để tương tác thông tin người dùng
import { userRepository } from "../repositories/user.repository";
// Import đối tượng notificationRepository để lưu trữ thông báo vào cơ sở dữ liệu
import { notificationRepository } from "../repositories/notification.repository";
// Import đối tượng broadcastLogRepository để ghi lại nhật ký phát sóng thông báo hàng loạt của Admin
import { broadcastLogRepository } from "../repositories/broadcastlog.repository";
// Import đối tượng logger phục vụ việc ghi nhận lỗi hệ thống
import { logger } from "../utils/logger";
// Import thư viện mongoose để ép kiểu ID dạng ObjectId
import mongoose from "mongoose";
// Import mô hình Mongoose User để truy vấn danh sách người dùng hiệu năng cao
import { User } from "../models/User";

// Hàm xử lý nghiệp vụ phát thông báo hàng loạt (broadcast) từ Admin đến toàn bộ hoặc một nhóm đối tượng người dùng
export async function broadcastToUsers(params: {
  // ID của quản trị viên thực hiện gửi
  adminId: string;
  // Nội dung thông báo phát đi
  content: string;
  // Nhóm vai trò người dùng đích nhận thông báo (tất cả, chỉ người bán, hoặc chỉ người mua)
  targetRole: "all" | "Seller" | "Buyer";
}): Promise<{ sentCount: number; broadcast: object }> {
  const { adminId, content, targetRole } = params;

  // Xác định bộ lọc query dựa theo vai trò đích nhận thông báo
  const query: Record<string, unknown> =
    targetRole === "all" ? { role: { $ne: "Admin" } } : { role: targetRole }; // Nếu là 'all' thì gửi đến tất cả ngoại trừ Admin

  // [FIX PERFORMANCE 3] Sử dụng Lean Queries để tránh rò rỉ bộ nhớ (RAM Leak), chỉ lấy trường _id
  const recipients = await User.find(query).select("_id").lean();
  // Tổng số lượng người nhận được
  const sentCount = recipients.length;

  // Nếu có ít nhất một người nhận phù hợp
  if (sentCount > 0) {
    // Tạo danh sách tài liệu thông báo tương ứng cho từng người nhận
    const docs = recipients.map((u) => ({
      userId: u._id,
      type: "broadcast",
      content,
      isRead: false,
    }));

    // Lưu hàng loạt thông báo vào database thông qua repository
    const inserted = await notificationRepository.insertMany(docs);

    // Ánh xạ danh sách ID thông báo vừa tạo vào một Map để tra cứu bằng userId
    const idByUser = new Map<string, string>(
      inserted.map((n, i) => [
        recipients[i]._id.toString(),
        (n._id as mongoose.Types.ObjectId).toString(),
      ]),
    );

    // Lấy đối tượng Socket Server
    const io = getIO();
    // Vòng lặp gửi thông báo thời gian thực cho từng người dùng qua phòng cá nhân socket `user_{userId}`
    for (const u of recipients) {
      const uid = u._id.toString();
      io.to(`user_${uid}`).emit("notification", {
        id: idByUser.get(uid),
        type: "broadcast",
        preview: content,
      });
    }
  }

  // Tạo một bản ghi lịch sử phát sóng thông báo của admin vào DB
  const log = await broadcastLogRepository.create({
    adminId,
    content,
    targetRole,
    sentCount,
  });

  // Trả về số lượng người gửi thành công và thông tin bản ghi phát sóng vừa lưu
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

// Hàm nghiệp vụ tự động gửi thông báo đến toàn bộ những người theo dõi (followers) khi ngư dân đăng bán mẻ hải sản mới
export async function notifyFollowersNewProduct(
  sellerId: string, // ID người bán đăng sản phẩm
  sellerName: string, // Tên người bán
  productId: string, // ID sản phẩm vừa tạo
  productName: string, // Tên sản phẩm
): Promise<void> {
  try {
    // [FIX PERFORMANCE 3] Tìm danh sách những người dùng đang theo dõi người bán này, chỉ lấy ID dạng lean
    const followers = await User.find({
      following: new mongoose.Types.ObjectId(sellerId),
    })
      .select("_id")
      .lean();

    // Nếu không có ai theo dõi ngư dân này thì kết thúc sớm
    if (followers.length === 0) return;

    // Thiết lập nội dung văn bản hiển thị trước của thông báo
    const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
    // Lấy server socket
    const io = getIO();

    // Tạo mảng tài liệu thông báo để lưu vào database
    const docs = followers.map((f) => ({
      userId: f._id,
      type: "new_product",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
    }));

    // Lưu đồng loạt danh sách thông báo vào DB
    const inserted = await notificationRepository.insertMany(docs);

    // Ánh xạ ID thông báo vừa lưu vào Map để tra cứu bằng ID của follower
    const idByFollower = new Map<string, string>(
      inserted.map((n, i) => [
        followers[i]._id.toString(),
        (n._id as mongoose.Types.ObjectId).toString(),
      ]),
    );

    // Gửi thông báo thời gian thực qua socket cho từng người theo dõi
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
    // Ghi log lỗi nếu quá trình lưu hoặc phát thông báo gặp sự cố
    logger.error("Lỗi khi lưu/phát thông báo sản phẩm mới:", {
      message: err.message,
    });
  }
}

export async function notifyFollowersNewLandingBatch(params: {
  sellerId: string;
  sellerName: string;
  landingBatchId: string;
  productCount: number;
}): Promise<void> {
  const { sellerId, sellerName, landingBatchId, productCount } = params;
  try {
    const followers = await User.find({
      following: new mongoose.Types.ObjectId(sellerId),
    })
      .select("_id")
      .lean();
    if (followers.length === 0) return;

    const previewText = `${sellerName} vừa cập bến vựa cá mới gồm ${productCount} loại hải sản.`;
    const docs = followers.map((follower) => ({
      userId: follower._id,
      type: "new_landing_batch",
      content: previewText,
      landingBatchId: new mongoose.Types.ObjectId(landingBatchId),
    }));
    const inserted = await notificationRepository.insertMany(docs);
    const io = getIO();

    followers.forEach((follower, index) => {
      io.to(`user_${follower._id.toString()}`).emit("notification", {
        id: inserted[index]._id.toString(),
        type: "new_landing_batch",
        landingBatchId,
        sellerId,
        preview: previewText,
        createdAt: inserted[index].createdAt,
      });
    });
  } catch (err: any) {
    logger.error("Lỗi khi lưu/phát thông báo vựa cá mới:", {
      message: err.message,
    });
  }
}

// Hàm nghiệp vụ tự động gửi thông báo đến người bán khi có một người mua gửi đánh giá (review) mới
export async function notifySellerNewReview(params: {
  sellerId: string; // ID người bán nhận đánh giá
  reviewerId: string; // ID người đánh giá
  reviewerName: string; // Tên người đánh giá
  productId: string; // ID sản phẩm liên kết
  productName: string; // Tên sản phẩm
  reviewId: string; // ID đánh giá vừa tạo
  rating: number; // Điểm số sao đánh giá
  comment: string | null; // Nội dung bình luận nhận xét
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

  // Xây dựng chuỗi nội dung văn bản thông báo, cắt bớt bình luận nếu quá dài
  const previewText =
    `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
    `"${comment ? comment.slice(0, 40) : "Không có nhận xét"}"`;

  try {
    // Tạo và lưu thông báo mới vào database
    const notif = await notificationRepository.create({
      userId: new mongoose.Types.ObjectId(sellerId) as any,
      type: "new_review",
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId) as any,
      reviewId: new mongoose.Types.ObjectId(reviewId) as any,
    });

    // Phát thông báo trực tiếp thời gian thực cho người bán qua socket
    getIO().to(`user_${sellerId}`).emit("notification", {
      id: notif._id.toString(),
      type: "new_review",
      productId,
      sellerId,
      reviewId,
      preview: previewText,
    });
  } catch (err: any) {
    // Ghi log lỗi nếu quá trình lưu hoặc phát thông báo gặp sự cố
    logger.error("Lỗi khi lưu và phát thông báo đánh giá:", {
      message: err.message,
    });
  }
}

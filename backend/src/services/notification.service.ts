import { getIO } from '../socket';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

/**
 * Notification Service — gửi thông báo cho người dùng.
 */

/** Gửi thông báo "sản phẩm mới" đến toàn bộ người follow người bán */
export async function notifyFollowersNewProduct(
  sellerId: string,
  sellerName: string,
  productId: string,
  productName: string,
): Promise<void> {
  try {
    // Tìm toàn bộ người theo dõi người bán (những người có sellerId trong mảng following)
    const followers = await User.find({
      following: new mongoose.Types.ObjectId(sellerId)
    }).select("_id");

    if (followers.length === 0) return;

    const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
    const io = getIO();

    // Tạo các bản ghi thông báo trong MongoDB
    const notifications = followers.map((f) => ({
      userId: f._id,
      type: 'new_product',
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
    }));

    await Notification.insertMany(notifications);

    for (const f of followers) {
      io.to(`user_${f._id.toString()}`).emit('notification', {
        type: 'new_product',
        productId,
        sellerId,
        preview: previewText,
      });
    }
  } catch (err) {
    console.error('Lỗi khi lưu/phát thông báo sản phẩm mới:', err);
  }
}

/** Gửi thông báo "đánh giá mới" đến người bán */
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
  const { sellerId, reviewerName, productId, productName, reviewId, rating, comment } = params;

  const previewText =
    `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
    `"${comment ? comment.slice(0, 40) : 'Không có nhận xét'}"`;

  try {
    const notif = new Notification({
      userId: new mongoose.Types.ObjectId(sellerId),
      type: 'new_review',
      content: previewText,
      productId: new mongoose.Types.ObjectId(productId),
      reviewId: new mongoose.Types.ObjectId(reviewId),
    });

    await notif.save();

    getIO().to(`user_${sellerId}`).emit('notification', {
      type: 'new_review',
      productId,
      sellerId,
      reviewId,
      preview: previewText,
    });
  } catch (err) {
    console.error('Lỗi khi lưu và phát thông báo đánh giá:', err);
  }
}

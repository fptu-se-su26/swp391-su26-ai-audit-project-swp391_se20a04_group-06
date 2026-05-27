import { pool } from '../db';
import { getIO } from '../socket';

/**
 * Notification Service — gửi thông báo cho người dùng.
 * Tách ra khỏi các controller để tuân theo Single Responsibility Principle.
 */

/** Gửi thông báo "sản phẩm mới" đến toàn bộ người follow người bán */
export async function notifyFollowersNewProduct(
  sellerId: number,
  sellerName: string,
  productId: number,
  productName: string,
): Promise<void> {
  const [followers] = await pool.query<any[]>(
    'SELECT FollowerID FROM Follow WHERE SellerID = ?',
    [sellerId],
  );
  if (followers.length === 0) return;

  const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
  const io = getIO();

  try {
    const values = followers.map((f) => [f.FollowerID, 'new_product', previewText, productId]);
    await pool.query(
      'INSERT INTO Notification (UserID, Type, Content, ProductID) VALUES ?',
      [values],
    );

    for (const f of followers) {
      io.to(`user_${f.FollowerID}`).emit('notification', {
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
  sellerId: number;
  reviewerId: number;
  reviewerName: string;
  productId: number;
  productName: string;
  reviewId: number;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const { sellerId, reviewerName, productId, productName, reviewId, rating, comment } = params;

  const previewText =
    `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
    `"${comment ? comment.slice(0, 40) : 'Không có nhận xét'}"`;

  try {
    await pool.query(
      'INSERT INTO Notification (UserID, Type, Content, ProductID, ReviewID) VALUES (?, ?, ?, ?, ?)',
      [sellerId, 'new_review', previewText, productId, reviewId],
    );
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

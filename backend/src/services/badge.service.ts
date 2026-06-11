import { User } from "../models/User";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Post } from "../models/Post";
import { logger } from "../utils/logger";

export async function updateUserBadges(userId: any): Promise<string[]> {
  try {
    const badges: string[] = [];

    // 1. Lão ngư bám biển: Có từ 5 sản phẩm "Active" trở lên
    const productCount = await Product.countDocuments({ sellerId: userId, status: "Active" });
    if (productCount >= 5) {
      badges.push("Lão ngư bám biển");
    }

    // 2. Vua Mực Nháy: Có ít nhất 1 sản phẩm thuộc phân loại "Squid" đang "Active"
    const hasSquid = await Product.findOne({ sellerId: userId, category: "Squid", status: "Active" });
    if (hasSquid) {
      badges.push("Vua Mực Nháy");
    }

    // 3. Đệ nhất mẻ tươi: Điểm trung bình đánh giá từ 4.5 trở lên và có ít nhất 1 đánh giá
    const reviewStats = await Review.aggregate([
      { $match: { sellerId: userId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    const avgRating = reviewStats[0]?.avgRating || 0;
    const ratingCount = reviewStats[0]?.totalReviews || 0;
    if (avgRating >= 4.5 && ratingCount >= 1) {
      badges.push("Đệ nhất mẻ tươi");
    }

    // 4. Đại sứ biển khơi: Đăng ít nhất 3 bài viết trong cộng đồng
    const postCount = await Post.countDocuments({ userId });
    if (postCount >= 3) {
      badges.push("Đại sứ biển khơi");
    }

    // 5. Khách quen nhà tàu: Đã viết ít nhất 3 đánh giá cho người bán khác
    const writtenReviewsCount = await Review.countDocuments({ reviewerId: userId });
    if (writtenReviewsCount >= 3) {
      badges.push("Khách quen nhà tàu");
    }

    await User.findByIdAndUpdate(userId, { $set: { badges } });
    return badges;
  } catch (err: any) {
    logger.error(`Error updating user badges for ${userId}: ${err.message}`);
    return [];
  }
}

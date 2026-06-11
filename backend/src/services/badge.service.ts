import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { reviewRepository } from "../repositories/review.repository";
import { postRepository } from "../repositories/post.repository";
import { logger } from "../utils/logger";

export async function updateUserBadges(userId: any): Promise<string[]> {
  try {
    const badges: string[] = [];
    const userIdStr = userId.toString();

    const productCount = await productRepository.countDocuments({
      sellerId: userIdStr,
      status: "Active",
    });
    if (productCount >= 5) {
      badges.push("Lão ngư bám biển");
    }

    const hasSquid = await productRepository.findOne({
      sellerId: userIdStr,
      category: "Squid",
      status: "Active",
    });
    if (hasSquid) {
      badges.push("Vua Mực Nháy");
    }

    const reviewStats = await reviewRepository.aggregate([
      { $match: { sellerId: userId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const avgRating = reviewStats[0]?.avgRating || 0;
    const ratingCount = reviewStats[0]?.totalReviews || 0;
    if (avgRating >= 4.5 && ratingCount >= 1) {
      badges.push("Đệ nhất mẻ tươi");
    }

    const postCount = await postRepository.countDocuments({
      userId: userIdStr,
    });
    if (postCount >= 3) {
      badges.push("Đại sứ biển khơi");
    }

    const writtenReviewsCount = await reviewRepository.countDocuments({
      reviewerId: userIdStr,
    });
    if (writtenReviewsCount >= 3) {
      badges.push("Khách quen nhà tàu");
    }

    await userRepository.updateBadges(userIdStr, badges);
    return badges;
  } catch (err: any) {
    logger.error(`Error updating user badges for ${userId}: ${err.message}`);
    return [];
  }
}

import { userRepository } from "../repositories/user.repository";
import { reviewRepository } from "../repositories/review.repository";
import { productRepository } from "../repositories/product.repository";
import { HttpError } from "../errors/HttpError";

export const userService = {
  async getPublicProfile(id: string) {
    const user = await userRepository.findRawById(id);
    if (!user || !user.isActive) {
      throw new HttpError(404, "Không tìm thấy người dùng");
    }

    // Đọc trực tiếp badges từ Database thay vì quét tính toán lại mỗi lần tải trang
    const badges = user.badges || [];

    const reviewStats = await reviewRepository.aggregate([
      { $match: { sellerId: user._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const avgRating = reviewStats[0]?.avgRating
      ? Math.round(reviewStats[0].avgRating * 10) / 10
      : 0;
    const ratingCount = reviewStats[0]?.totalReviews || 0;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      isVerified: !!user.isVerified,
      isPremium: !!user.isPremium,
      createdAt: user.createdAt,
      avgRating,
      ratingCount,
      badges,
    };
  },

  async getFishermanLeaderboard() {
    const sellerIds = await productRepository.distinct("sellerId", {
      status: "Active",
    });
    if (!sellerIds || sellerIds.length === 0) {
      return [];
    }

    const sellers = await userRepository.find({
      _id: { $in: sellerIds },
      isActive: true,
    });

    const reviewStats = await reviewRepository.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      {
        $group: {
          _id: "$sellerId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const reviewMap = new Map<
      string,
      { avgRating: number; ratingCount: number }
    >();
    for (const stat of reviewStats) {
      if (stat._id) {
        const avg = stat.avgRating ? Math.round(stat.avgRating * 10) / 10 : 0;
        reviewMap.set(stat._id.toString(), {
          avgRating: avg,
          ratingCount: stat.totalReviews || 0,
        });
      }
    }

    const productStats = await productRepository.aggregate([
      { $match: { sellerId: { $in: sellerIds }, status: "Active" } },
      {
        $group: {
          _id: "$sellerId",
          count: { $sum: 1 },
        },
      },
    ]);

    const productCountMap = new Map<string, number>();
    for (const stat of productStats) {
      if (stat._id) {
        productCountMap.set(stat._id.toString(), stat.count || 0);
      }
    }

    const leaderboard = sellers.map((user) => {
      const sellerIdStr = user._id.toString();
      const reviews = reviewMap.get(sellerIdStr) || {
        avgRating: 0,
        ratingCount: 0,
      };
      const productCount = productCountMap.get(sellerIdStr) || 0;

      return {
        id: sellerIdStr,
        name: user.name,
        avatar: user.avatar || null,
        isVerified: !!user.isVerified,
        isPremium: !!user.isPremium,
        badges: user.badges || [],
        avgRating: reviews.avgRating,
        ratingCount: reviews.ratingCount,
        productCount,
      };
    });

    return leaderboard
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        if (b.productCount !== a.productCount)
          return b.productCount - a.productCount;
        return b.ratingCount - a.ratingCount;
      })
      .slice(0, 5);
  },
};

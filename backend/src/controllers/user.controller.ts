// Trong tệp: backend/src/controllers/user.controller.ts

import { Request, Response } from "express";
import { User } from "../models/User";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { sendServerError, parseId } from "../helpers/response.helper";
import { updateUserBadges } from "../services/badge.service";

export async function getUserPublicProfile(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // Cập nhật huy hiệu trước khi phản hồi
    const badges = await updateUserBadges(user._id);

    const reviewStats = await Review.aggregate([
      { $match: { sellerId: user._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const avgRating = reviewStats[0]?.avgRating ? Math.round(reviewStats[0].avgRating * 10) / 10 : 0;
    const ratingCount = reviewStats[0]?.totalReviews || 0;

    return res.json({
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
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getFishermanLeaderboard(req: Request, res: Response) {
  try {
    const sellerIds = await Product.distinct("sellerId", { status: "Active" });
    if (!sellerIds || sellerIds.length === 0) {
      return res.json([]);
    }

    // 1. Fetch all active users in a single query
    const sellers = await User.find({ _id: { $in: sellerIds }, isActive: true })
      .select("name avatar isVerified isPremium badges");

    // 2. Fetch all review statistics in a single aggregation
    const reviewStats = await Review.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      {
        $group: {
          _id: "$sellerId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const reviewMap = new Map<string, { avgRating: number; ratingCount: number }>();
    for (const stat of reviewStats) {
      if (stat._id) {
        const avg = stat.avgRating ? Math.round(stat.avgRating * 10) / 10 : 0;
        reviewMap.set(stat._id.toString(), {
          avgRating: avg,
          ratingCount: stat.totalReviews || 0
        });
      }
    }

    // 3. Fetch all product counts in a single aggregation
    const productStats = await Product.aggregate([
      { $match: { sellerId: { $in: sellerIds }, status: "Active" } },
      {
        $group: {
          _id: "$sellerId",
          count: { $sum: 1 }
        }
      }
    ]);

    const productCountMap = new Map<string, number>();
    for (const stat of productStats) {
      if (stat._id) {
        productCountMap.set(stat._id.toString(), stat.count || 0);
      }
    }

    // 4. Assemble the leaderboard in-memory
    const leaderboard = sellers.map((user) => {
      const sellerIdStr = user._id.toString();
      const reviews = reviewMap.get(sellerIdStr) || { avgRating: 0, ratingCount: 0 };
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

    const sortedLeaderboard = leaderboard
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        if (b.productCount !== a.productCount) return b.productCount - a.productCount;
        return b.ratingCount - a.ratingCount;
      })
      .slice(0, 5);

    return res.json(sortedLeaderboard);
  } catch (err) {
    return sendServerError(res, err);
  }
}
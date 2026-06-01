// Trong tệp: backend/src/controllers/user.controller.ts

import { Request, Response } from "express";
import { User } from "../models/User";
import { Review } from "../models/Review"; // 🌟 GIẢI PHÁP: Import thêm Model Review
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getUserPublicProfile(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    // 🌟 GIẢI PHÁP: Tính toán điểm đánh giá trung bình và số lượng review trực tiếp từ MongoDB
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
      isVerified: !!user.isVerified, // 🌟 Đồng bộ hóa kiểu dữ liệu boolean chuẩn
      isPremium: !!user.isPremium,
      createdAt: user.createdAt,
      avgRating,    // Trả về điểm trung bình thực tế
      ratingCount,  // Trả về tổng số lượng đánh giá thực tế
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}
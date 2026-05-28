import { Request, Response } from "express";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { uploadToCloudinary } from "../middlewares/upload";
import { sendServerError } from "../helpers/response.helper";
import { notifySellerNewReview } from "../services/notification.service";
import mongoose from "mongoose";

export async function addReview(req: Request, res: Response) {
  const { userId: reviewerId } = req.user;
  const { productId, sellerId, rating, comment } = req.body;

  if (!productId || !sellerId || !rating)
    return res.status(400).json({ message: "Thiếu thông tin đánh giá" });

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5)
    return res.status(400).json({ message: "Đánh giá phải từ 1 đến 5 sao" });

  if (reviewerId.toString() === sellerId.toString())
    return res
      .status(400)
      .json({ message: "Bạn không thể tự đánh giá chính mình" });

  try {
    const existing = await Review.findOne({ reviewerId, productId });
    if (existing)
      return res
        .status(409)
        .json({ message: "Bạn đã đánh giá sản phẩm này rồi" });

    let finalImageUrl = req.body.imageUrl || null;
    if (req.file) {
      const { url } = await uploadToCloudinary(req.file.buffer, "reviews");
      finalImageUrl = url;
    }

    const newReview = new Review({
      productId,
      reviewerId,
      sellerId,
      rating: numRating,
      comment: comment || null,
      imageUrl: finalImageUrl,
    });

    await newReview.save();

    const reviewer = await User.findById(reviewerId);
    const product = await Product.findById(productId);

    await notifySellerNewReview({
      sellerId: sellerId as any,
      reviewerId: reviewerId as any,
      reviewerName: reviewer?.name || "Một người dùng",
      productId: productId as any,
      productName: product?.name || "sản phẩm",
      reviewId: newReview._id as any,
      rating: numRating,
      comment: comment || null,
    });

    return res
      .status(201)
      .json({ message: "Đánh giá thành công", reviewId: newReview._id });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function getReviewsBySeller(req: Request, res: Response) {
  const sellerId = req.params.sellerId;
  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "ID người bán không hợp lệ" });
  }

  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) || "20", 10)),
  );
  const skip = (page - 1) * limit;

  try {
    const total = await Review.countDocuments({ sellerId });
    const rows = await Review.find({ sellerId })
      .populate("reviewerId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = rows.map((r: any) => ({
      ReviewID: r._id,
      Rating: r.rating,
      Comment: r.comment,
      ImageURL: r.imageUrl,
      CreatedAt: r.createdAt,
      ReviewerName: r.reviewerId?.name || "Một người dùng",
      ProductName: r.productId?.name || "Sản phẩm",
    }));

    return res.json({
      data: formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}

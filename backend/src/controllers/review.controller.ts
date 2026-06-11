import { Request, Response } from "express";
import { reviewService } from "../services/review.service";
import { sendServerError } from "../helpers/response.helper";
import mongoose from "mongoose";

export async function addReview(req: Request, res: Response) {
  const { userId: reviewerId } = req.user;
  try {
    const reviewId = await reviewService.addReview(
      reviewerId,
      req.body,
      req.file?.buffer,
    );
    return res.status(201).json({ message: "Đánh giá thành công", reviewId });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

export async function getReviewsBySeller(req: Request, res: Response) {
  const { sellerId } = req.params;
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
    const { formatted, total } = await reviewService.listSellerReviews(
      sellerId,
      skip,
      limit,
    );
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

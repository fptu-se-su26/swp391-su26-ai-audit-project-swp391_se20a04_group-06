import { reviewRepository } from "../repositories/review.repository";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { notifySellerNewReview } from "./notification.service";
import { updateUserBadges } from "./badge.service";
import { HttpError } from "../errors/HttpError";

export const reviewService = {
  async addReview(reviewerId: string, body: any, fileBuffer?: Buffer) {
    const { productId, sellerId, rating, comment } = body;
    const numRating = Number(rating);

    if (reviewerId.toString() === sellerId.toString()) {
      throw new HttpError(400, "Bạn không thể tự đánh giá chính mình");
    }

    const hasInteracted = await reviewRepository.hasBuyerInteracted(
      productId,
      reviewerId,
      sellerId,
    );
    if (!hasInteracted) {
      throw new HttpError(
        403,
        "Chỉ những người đã liên hệ người bán về sản phẩm này mới được đánh giá",
      );
    }

    const existing = await reviewRepository.existsByReviewerAndProduct(
      reviewerId,
      productId,
    );
    if (existing) {
      throw new HttpError(409, "Bạn đã đánh giá sản phẩm này rồi");
    }

    let finalImageUrl = body.imageUrl || null;
    if (fileBuffer) {
      const { uploadToCloudinary } = require("../middlewares/upload");
      const { url } = await uploadToCloudinary(fileBuffer, "reviews");
      finalImageUrl = url;
    }

    const cleanComment = comment
      ? comment
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 500)
      : null;

    const newReview = await reviewRepository.create({
      productId,
      reviewerId,
      sellerId,
      rating: numRating,
      comment: cleanComment,
      imageUrl: finalImageUrl,
    });

    updateUserBadges(sellerId).catch(() => {});
    updateUserBadges(reviewerId).catch(() => {});

    const reviewer = await userRepository.findRawById(reviewerId);
    const product = await productRepository.findById(productId);

    await notifySellerNewReview({
      sellerId: sellerId as any,
      reviewerId: reviewerId as any,
      reviewerName: reviewer?.name || "Một người dùng",
      productId: productId as any,
      productName: product?.name || "sản phẩm",
      reviewId: newReview._id.toString(),
      rating: numRating,
      comment: comment || null,
    });

    return newReview._id;
  },

  async listSellerReviews(sellerId: string, skip: number, limit: number) {
    const { rows, total } = await reviewRepository.findBySeller(
      sellerId,
      skip,
      limit,
    );

    const formatted = rows.map((r: any) => ({
      ReviewID: r._id,
      Rating: r.rating,
      Comment: r.comment,
      ImageURL: r.imageUrl,
      CreatedAt: r.createdAt,
      ReviewerName: r.reviewerId?.name || "Một người dùng",
      ProductName: r.productId?.name || "Sản phẩm",
    }));

    return { formatted, total };
  },
};

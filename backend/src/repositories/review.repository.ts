import { Review, IReview } from "../models/Review";
import { Message } from "../models/Message";

export const reviewRepository = {
  async hasBuyerInteracted(
    productId: string,
    buyerId: string,
    sellerId: string,
  ): Promise<boolean> {
    return !!(await Message.exists({
      productId,
      $or: [
        { senderId: buyerId, receiverId: sellerId },
        { senderId: sellerId, receiverId: buyerId },
      ],
    }));
  },

  async existsByReviewerAndProduct(
    reviewerId: string,
    productId: string,
  ): Promise<boolean> {
    return !!(await Review.findOne({ reviewerId, productId }));
  },

  async findOne(query: any): Promise<IReview | null> {
    return Review.findOne(query);
  },

  async countDocuments(filter: any): Promise<number> {
    return Review.countDocuments(filter);
  },

  async deleteMany(filter: any): Promise<any> {
    return Review.deleteMany(filter);
  },

  async aggregate(pipeline: any[]): Promise<any[]> {
    return Review.aggregate(pipeline);
  },

  async create(data: {
    productId: string;
    reviewerId: string;
    sellerId: string;
    rating: number;
    comment: string | null;
    imageUrl: string | null;
  }) {
    const review = new Review(data);
    await review.save();
    return review;
  },

  async findBySeller(sellerId: string, skip: number, limit: number) {
    const [rows, total] = await Promise.all([
      Review.find({ sellerId })
        .populate("reviewerId", "name")
        .populate("productId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ sellerId }),
    ]);
    return { rows, total };
  },
};

import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  productId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
    imageUrl: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Ràng buộc duy nhất: Một người dùng chỉ đánh giá một sản phẩm một lần
reviewSchema.index({ reviewerId: 1, productId: 1 }, { unique: true });

export const Review = model<IReview>("Review", reviewSchema);

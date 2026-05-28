import { Schema, model, Document } from "mongoose";

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  type: string;
  content: string;
  isRead: boolean;
  productId?: Schema.Types.ObjectId;
  reviewId?: Schema.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    reviewId: { type: Schema.Types.ObjectId, ref: "Review" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>("Notification", notificationSchema);

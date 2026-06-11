/**
 * BroadcastLog.ts
 * Lưu lịch sử mỗi lần admin phát thông báo hệ thống.
 * Không phải Notification (đó là bản ghi riêng cho từng user).
 */
import { Schema, model, Document, Types } from "mongoose";

export interface IBroadcastLog extends Document {
  adminId: Types.ObjectId;
  content: string;
  targetRole: "all" | "Seller" | "Buyer";
  sentCount: number;
  createdAt: Date;
}

const broadcastLogSchema = new Schema<IBroadcastLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 200 },
    targetRole: {
      type: String,
      enum: ["all", "Seller", "Buyer"],
      default: "all",
    },
    sentCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Index để sắp xếp lịch sử nhanh
broadcastLogSchema.index({ createdAt: -1 });

export const BroadcastLog = model<IBroadcastLog>(
  "BroadcastLog",
  broadcastLogSchema,
);

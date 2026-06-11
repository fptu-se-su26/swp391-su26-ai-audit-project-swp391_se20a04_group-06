import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  productId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string | null;
  imageUrl: string | null;
  location?: {
    // 🌟 Thêm kiểu dữ liệu cho vị trí
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: null },
    imageUrl: { type: String, default: null },
    location: {
      // 🌟 Thêm trường location vào Schema
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

messageSchema.index({ productId: 1, senderId: 1, receiverId: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);

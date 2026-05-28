import { Schema, model, Document } from "mongoose";

export interface IMessage extends Document {
  productId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  receiverId: Schema.Types.ObjectId;
  content: string | null;
  imageUrl: string | null;
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
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Lập chỉ mục kép tối ưu hóa tốc độ tải phòng chat
messageSchema.index({ productId: 1, senderId: 1, receiverId: 1 });

export const Message = model<IMessage>("Message", messageSchema);

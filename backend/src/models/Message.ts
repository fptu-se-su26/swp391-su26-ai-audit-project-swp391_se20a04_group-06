// models/Message.ts

import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  productId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string | null;
  imageUrl: string | null;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  replyTo?: {
    senderId: string;
    content: string;
  } | null;
  isRead: boolean;
  isRecalled: boolean;
  reaction: string | null;
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
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },

    // ✅ FIX 2: Lưu thông tin tin nhắn được trả lời
    replyTo: {
      senderId: { type: String },
      content: { type: String },
      _id: false, // không tạo _id phụ cho sub-document
    },

    isRead: { type: Boolean, default: false },
    isRecalled: { type: Boolean, default: false }, // Thu hồi tin nhắn
    reaction: { type: String, default: null }, // ❤️ 😆 😮 😢 😡 👍
  },
  { timestamps: true },
);

messageSchema.index({ productId: 1, senderId: 1, receiverId: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

export const Message = model<IMessage>("Message", messageSchema);

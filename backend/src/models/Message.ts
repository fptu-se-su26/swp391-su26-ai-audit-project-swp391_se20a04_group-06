import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  productId: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
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

// 💡 CẢI TIẾN HIỆU NĂNG QUAN TRỌNG CHO TEAM:
// Hai chỉ mục dưới đây được thêm vào để tối ưu hóa hiệu năng cho chức năng lấy danh sách hội thoại (Conversations).
// API hội thoại lọc tin nhắn của một người dùng cụ thể bằng điều kiện lọc OR: { senderId: userId } hoặc { receiverId: userId }
// và sau đó sắp xếp giảm dần theo thời gian tạo tin nhắn: { createdAt: -1 } để lấy tin nhắn mới nhất lên đầu.
// Nếu thiếu 2 chỉ mục này, MongoDB buộc phải quét qua toàn bộ dữ liệu tin nhắn (COLLSCAN - Full Collection Scan),
// gây ra việc sụt giảm hiệu năng cực lớn (treo máy chủ) khi lượng tin nhắn tăng cao.
// Thêm index giúp MongoDB truy xuất ngay lập tức các tin nhắn liên quan đến userId chỉ trong vài mili-giây!
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);

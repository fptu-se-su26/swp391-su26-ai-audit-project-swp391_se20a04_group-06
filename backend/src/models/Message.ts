// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ tin nhắn chat
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IMessage mô tả cấu trúc của một tài liệu tin nhắn chat trong DB
export interface IMessage extends Document {
  // ID của sản phẩm hải sản làm ngữ cảnh cho cuộc trò chuyện (liên kết bảng Product)
  productId: Types.ObjectId;
  // ID của người gửi tin nhắn (liên kết bảng User)
  senderId: Types.ObjectId;
  // ID của người nhận tin nhắn (liên kết bảng User)
  receiverId: Types.ObjectId;
  // Nội dung tin nhắn dạng văn bản (có thể null nếu chỉ gửi hình ảnh hoặc vị trí)
  content: string | null;
  // Đường dẫn hình ảnh nếu tin nhắn chứa ảnh (có thể null)
  imageUrl: string | null;
  // Cấu hình chia sẻ tọa độ địa lý (không bắt buộc, có thể null)
  location?: {
    // Vĩ độ GPS
    latitude: number;
    // Kinh độ GPS
    longitude: number;
    // Tên địa chỉ thực tế (tùy chọn)
    address?: string;
  } | null;
  // Cấu hình phản hồi/trích dẫn tin nhắn khác (không bắt buộc, có thể null)
  replyTo?: {
    // Mã ID của người viết tin nhắn gốc được trích dẫn
    senderId: string;
    // Nội dung tin nhắn gốc được trích dẫn
    content: string;
  } | null;
  // Trạng thái đã đọc tin nhắn hay chưa
  isRead: boolean;
  // Trạng thái tin nhắn đã bị thu hồi hay chưa (phía client sẽ ẩn nội dung)
  isRecalled: boolean;
  // Biểu tượng cảm xúc bày tỏ trên tin nhắn (ví dụ: ❤️, 👍, 😆...)
  reaction: string | null;
  // Mốc thời gian tạo tin nhắn
  createdAt: Date;
  // Mốc thời gian cập nhật tin nhắn
  updatedAt: Date;
}

// Khởi tạo lược đồ messageSchema dành cho bộ sưu tập Message
const messageSchema = new Schema<IMessage>(
  {
    // Cấu hình trường productId: liên kết với bộ sưu tập Product, bắt buộc nhập
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Cấu hình trường senderId: liên kết với bộ sưu tập User, bắt buộc nhập
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường receiverId: liên kết với bộ sưu tập User, bắt buộc nhập
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Cấu hình trường content: kiểu chuỗi, mặc định bằng null
    content: { type: String, default: null },
    // Cấu hình trường imageUrl: kiểu chuỗi, mặc định bằng null
    imageUrl: { type: String, default: null },

    // Cấu hình trường location: kiểu đối tượng chứa tọa độ và địa chỉ
    location: {
      // Vĩ độ kiểu số
      latitude: { type: Number },
      // Kinh độ kiểu số
      longitude: { type: Number },
      // Địa chỉ kiểu chuỗi
      address: { type: String },
    },

    // Cấu hình trường replyTo: lưu trữ thông tin trích dẫn phản hồi tin nhắn khác
    replyTo: {
      // ID người gửi tin nhắn trích dẫn
      senderId: { type: String },
      // Nội dung tin nhắn được trích dẫn
      content: { type: String },
      // Chặn việc tự động tạo trường khóa phụ _id cho đối tượng con replyTo trong DB
      _id: false,
    },

    // Cấu hình trường isRead: kiểu boolean, mặc định là false
    isRead: { type: Boolean, default: false },
    // Cấu hình trường isRecalled: kiểu boolean, mặc định là false
    isRecalled: { type: Boolean, default: false },
    // Cấu hình trường reaction: kiểu chuỗi biểu tượng cảm xúc, mặc định là null
    reaction: { type: String, default: null },
  },
  // Kích hoạt tính năng timestamps tự động cập nhật thời gian tạo và sửa tin nhắn
  { timestamps: true },
);

// Đánh chỉ mục phức hợp theo productId, senderId, receiverId để tăng tốc độ truy vấn hội thoại
messageSchema.index({ productId: 1, senderId: 1, receiverId: 1 });
// Đánh chỉ mục index cho người gửi và sắp xếp thời gian giảm dần
messageSchema.index({ senderId: 1, createdAt: -1 });
// Đánh chỉ mục index cho người nhận và sắp xếp thời gian giảm dần
messageSchema.index({ receiverId: 1, createdAt: -1 });
// Đánh chỉ mục index để kiểm tra nhanh các tin nhắn chưa đọc của một người nhận cụ thể
messageSchema.index({ receiverId: 1, isRead: 1 });

// Tạo và xuất ra ngoài mô hình Message
export const Message = model<IMessage>("Message", messageSchema);

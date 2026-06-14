// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để xây dựng lược đồ cơ sở dữ liệu
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IBroadcastLog mô tả cấu trúc của một tài liệu lịch sử phát sóng thông báo từ Admin
export interface IBroadcastLog extends Document {
  // Mã ID của quản trị viên (Admin) đã phát thông báo này (liên kết bảng User)
  adminId: Types.ObjectId;
  // Nội dung văn bản thông báo được phát đi
  content: string;
  // Đối tượng người nhận được chỉ định: tất cả, người bán (Seller), hoặc người mua (Buyer)
  targetRole: "all" | "Seller" | "Buyer";
  // Số lượng người dùng đã gửi thành công thông báo này
  sentCount: number;
  // Thời điểm thông báo được gửi đi
  createdAt: Date;
}

// Khởi tạo lược đồ mongoose broadcastLogSchema
const broadcastLogSchema = new Schema<IBroadcastLog>(
  {
    // Cấu hình trường adminId: liên kết với bộ sưu tập User, bắt buộc nhập
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường content: kiểu chuỗi, bắt buộc nhập và giới hạn tối đa 200 ký tự
    content: { type: String, required: true, maxlength: 200 },
    // Cấu hình trường targetRole: kiểu chuỗi, nhận giá trị trong mảng enum và mặc định là "all"
    targetRole: {
      type: String,
      enum: ["all", "Seller", "Buyer"],
      default: "all",
    },
    // Cấu hình trường sentCount: kiểu số, mặc định bằng 0
    sentCount: { type: Number, default: 0 },
  },
  // Cấu hình timestamps: chỉ ghi nhận thời gian tạo (createdAt), không cần trường cập nhật (updatedAt)
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Đánh chỉ mục index cho trường createdAt giảm dần để truy vấn lịch sử thông báo mới nhất nhanh hơn
broadcastLogSchema.index({ createdAt: -1 });

// Tạo và xuất mô hình BroadcastLog dùng cho việc tương tác dữ liệu
export const BroadcastLog = model<IBroadcastLog>(
  "BroadcastLog",
  broadcastLogSchema,
);

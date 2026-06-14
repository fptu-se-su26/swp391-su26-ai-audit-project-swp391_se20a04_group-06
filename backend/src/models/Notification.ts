// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ thông báo người dùng
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện INotification mô tả cấu trúc của một tài liệu thông báo (Notification Document)
export interface INotification extends Document {
  // Mã ID của người dùng nhận thông báo này (liên kết bảng User)
  userId: Types.ObjectId;
  // Phân loại thông báo (ví dụ: "new_product", "follow", "badge", "review"...)
  type: string;
  // Nội dung chi tiết hiển thị trong thông báo
  content: string;
  // Trạng thái người dùng đã đọc thông báo này hay chưa
  isRead: boolean;
  // Mã ID sản phẩm liên kết nếu thông báo liên quan đến sản phẩm (tùy chọn)
  productId?: Types.ObjectId;
  // Mã ID đánh giá liên kết nếu thông báo liên quan đến đánh giá shop (tùy chọn)
  reviewId?: Types.ObjectId;
  // Mốc thời gian tự động tạo thông báo
  createdAt: Date;
}

// Khởi tạo lược đồ mongoose notificationSchema
const notificationSchema = new Schema<INotification>(
  {
    // Cấu hình trường userId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh chỉ mục index để truy vấn nhanh
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Cấu hình trường type: kiểu chuỗi và bắt buộc nhập
    type: { type: String, required: true },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
    // Cấu hình trường isRead: kiểu boolean, mặc định bằng false khi mới tạo thông báo
    isRead: { type: Boolean, default: false },
    // Cấu hình trường productId: kiểu ObjectId tham chiếu đến bảng Product (không bắt buộc)
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    // Cấu hình trường reviewId: kiểu ObjectId tham chiếu đến bảng Review (không bắt buộc)
    reviewId: { type: Schema.Types.ObjectId, ref: "Review" },
  },
  // Cấu hình chỉ ghi nhận mốc thời gian tạo (createdAt: true), bỏ qua việc tự tạo trường updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Đánh chỉ mục index phức hợp theo userId tăng dần và createdAt giảm dần để tối ưu hóa việc tải danh sách thông báo mới nhất
notificationSchema.index({ userId: 1, createdAt: -1 });

// Tạo và xuất ra mô hình Notification
export const Notification = model<INotification>("Notification", notificationSchema);

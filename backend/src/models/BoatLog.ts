// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ (schema) và mô hình (model)
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IBoatLog mở rộng từ Document của Mongoose để quy định kiểu dữ liệu cho tài liệu nhật ký cabin
export interface IBoatLog extends Document {
  // Mã ID liên kết của tài khoản người dùng viết nhật ký (kiểu ObjectId)
  userId: Types.ObjectId;
  // Tên hiển thị của người viết nhật ký
  userName: string;
  // Ảnh đại diện của người viết nhật ký (có thể là null)
  userAvatar: string | null;
  // Nội dung chi tiết bài nhật ký cabin
  content: string;
  // Mảng chứa danh sách đường dẫn các hình ảnh đính kèm
  images: string[];
  // Mảng chứa các ID người dùng đã thích bài viết này (liên kết bảng User)
  likes: Types.ObjectId[];
  // Mốc thời gian tự động tạo tài liệu trong DB
  createdAt: Date;
  // Mốc thời gian tự động cập nhật tài liệu trong DB
  updatedAt: Date;
}

// Khởi tạo lược đồ boatLogSchema dành cho bộ sưu tập BoatLog
const boatLogSchema = new Schema<IBoatLog>(
  {
    // Cấu hình trường userId: liên kết với bảng User, bắt buộc nhập, và được đánh chỉ mục index để truy vấn nhanh
    userId: {
      // Sử dụng định dạng Schema.Types.ObjectId của Mongoose
      type: Schema.Types.ObjectId,
      // Tham chiếu đến bộ sưu tập User
      ref: "User",
      // Bắt buộc phải có
      required: true,
      // Đánh chỉ mục
      index: true,
    },
    // Cấu hình trường userName: kiểu chuỗi và bắt buộc nhập
    userName: { type: String, required: true },
    // Cấu hình trường userAvatar: kiểu chuỗi và mặc định bằng null
    userAvatar: { type: String, default: null },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
    // Cấu hình trường images: mảng các chuỗi string
    images: [{ type: String }],
    // Cấu hình trường likes: mảng các ObjectId tham chiếu đến User
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  // Cấu hình tự động ghi nhận mốc thời gian tạo (createdAt) và sửa đổi (updatedAt) tài liệu
  { timestamps: true }
);

// Đánh chỉ mục phức hợp (Compound Index) theo userId tăng dần và createdAt giảm dần để tối ưu hóa truy vấn tìm kiếm nhật ký mới nhất
boatLogSchema.index({ userId: 1, createdAt: -1 });

// Tạo và xuất ra ngoài (export) mô hình BoatLog dựa trên lược đồ và giao diện đã định nghĩa
export const BoatLog = model<IBoatLog>("BoatLog", boatLogSchema);

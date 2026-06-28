// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ báo cáo vi phạm
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IReport mô tả cấu trúc của một tài liệu báo cáo vi phạm sản phẩm (Report Document)
export interface IReport extends Document {
  // Mã ID của người dùng gửi báo cáo (kiểu ObjectId liên kết bảng User)
  reporterId: Types.ObjectId;
  // Mã ID của sản phẩm bị báo cáo vi phạm (kiểu ObjectId liên kết bảng Product)
  productId?: Types.ObjectId;
  postId?: Types.ObjectId;
  recipeId?: Types.ObjectId;
  targetType: "Product" | "Post" | "Recipe";
  // Lý do báo cáo vi phạm sản phẩm/bài viết/công thức
  reason: string;
  // Trạng thái xử lý báo cáo: Đang chờ (Pending), Đã giải quyết (Resolved), hoặc Bị bác bỏ (Dismissed)
  status: "Pending" | "Resolved" | "Dismissed";
  // Ghi chú của quản trị viên (Admin) sau khi kiểm duyệt và xử lý báo cáo (có thể null)
  adminNote: string | null;
  // Mốc thời gian tự động tạo báo cáo
  createdAt: Date;
}

// Khởi tạo lược đồ mongoose reportSchema
const reportSchema = new Schema<IReport>(
  {
    // Cấu hình trường reporterId: liên kết với bộ sưu tập User, bắt buộc nhập
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường productId: liên kết với bộ sưu tập Product
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: false },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: false },
    recipeId: { type: Schema.Types.ObjectId, ref: "Recipe", required: false },
    targetType: {
      type: String,
      enum: ["Product", "Post", "Recipe"],
      default: "Product",
      required: true
    },
    // Cấu hình trường reason: kiểu chuỗi và bắt buộc nhập lý do báo cáo
    reason: { type: String, required: true },
    // Cấu hình trường status: kiểu chuỗi, chỉ nhận giá trị enum và mặc định là "Pending"
    status: {
      type: String,
      enum: ["Pending", "Resolved", "Dismissed"],
      default: "Pending",
    },
    // Cấu hình trường adminNote: kiểu chuỗi, mặc định bằng null
    adminNote: { type: String, default: null },
  },
  // Cấu hình timestamps: chỉ ghi nhận mốc thời gian tạo (createdAt: true), không cần trường tự tạo updatedAt
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Đánh chỉ mục index phức hợp để hỗ trợ truy vấn và kiểm tra trùng lặp báo cáo của cùng một người nhanh hơn
reportSchema.index({ reporterId: 1, productId: 1 });
reportSchema.index({ reporterId: 1, postId: 1 });
reportSchema.index({ reporterId: 1, recipeId: 1 });
// Đánh chỉ mục index phức hợp theo status tăng dần và thời gian tạo giảm dần để tối ưu hóa việc Admin tải danh sách báo cáo theo trạng thái xử lý
reportSchema.index({ status: 1, createdAt: -1 });

// Tạo và xuất mô hình Report
export const Report = model<IReport>("Report", reportSchema);

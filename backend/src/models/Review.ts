// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ đánh giá phản hồi
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IReview mô tả cấu trúc của một tài liệu đánh giá shop/sản phẩm (Review Document)
export interface IReview extends Document {
  // Mã ID sản phẩm hải sản được đánh giá (kiểu ObjectId liên kết bảng Product)
  productId: Types.ObjectId;
  // Mã ID của người thực hiện viết đánh giá (kiểu ObjectId liên kết bảng User)
  reviewerId: Types.ObjectId;
  // Mã ID của người bán (ngư dân) sở hữu sản phẩm được đánh giá (kiểu ObjectId liên kết bảng User)
  sellerId: Types.ObjectId;
  // Số điểm đánh giá xếp hạng (từ 1 đến 5 sao)
  rating: number;
  // Nội dung nhận xét chi tiết của người đánh giá (có thể null)
  comment: string | null;
  // Đường dẫn hình ảnh đính kèm nhận xét nếu có (có thể null)
  imageUrl: string | null;
  // Mốc thời gian tạo đánh giá
  createdAt: Date;
}

// Khởi tạo lược đồ mongoose reviewSchema
const reviewSchema = new Schema<IReview>(
  {
    // Cấu hình trường productId: liên kết với bộ sưu tập Product, bắt buộc nhập
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // Cấu hình trường reviewerId: liên kết với bộ sưu tập User, bắt buộc nhập
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường sellerId: liên kết bộ sưu tập User, bắt buộc nhập và đánh index để tối ưu hóa truy vấn điểm uy tín của shop
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Cấu hình trường rating: kiểu số, bắt buộc nhập, giới hạn tối thiểu 1 sao và tối đa 5 sao
    rating: { type: Number, required: true, min: 1, max: 5 },
    // Cấu hình trường comment: kiểu chuỗi và mặc định bằng null
    comment: { type: String, default: null },
    // Cấu hình trường imageUrl: kiểu chuỗi và mặc định bằng null
    imageUrl: { type: String, default: null },
  },
  // Cấu hình timestamps: chỉ ghi nhận mốc thời gian tạo (createdAt: true), không cần trường tự tạo updatedAt do đánh giá là lịch sử bất biến
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Ràng buộc duy nhất (Unique Compound Index): Một người dùng chỉ được phép đánh giá một sản phẩm tối đa một lần
reviewSchema.index({ reviewerId: 1, productId: 1 }, { unique: true });
// Đánh chỉ mục index phức hợp theo sellerId tăng dần và createdAt giảm dần để tối ưu hóa việc tải các lượt đánh giá mới nhất của shop bán hàng
reviewSchema.index({ sellerId: 1, createdAt: -1 });

// Tạo và xuất mô hình Review
export const Review = model<IReview>("Review", reviewSchema);

// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ giao dịch thanh toán
import { Schema, model, Document, Types } from "mongoose";

// Định nghĩa giao diện IPaymentTransaction mô tả cấu trúc của một tài liệu giao dịch thanh toán (Payment Transaction Document)
export interface IPaymentTransaction extends Document {
  // Mã ID giao dịch duy nhất từ cổng thanh toán (ví dụ: Sepay/Ngân hàng) để ngăn chặn hành vi Replay Attack (xử lý trùng lặp giao dịch)
  gatewayTransactionId: string;
  // Mã ID của người dùng đã thực hiện giao dịch thanh toán này (liên kết bảng User)
  userId: Types.ObjectId;
  // Số tiền giao dịch thanh toán (đơn vị tiền tệ)
  amount: number;
  // Nội dung chi tiết chuyển khoản hoặc ghi chú giao dịch thanh toán
  content: string;
  // Mốc thời gian tạo giao dịch thanh toán trong hệ thống
  createdAt: Date;
}

// Khởi tạo lược đồ mongoose paymentTransactionSchema
const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    // Cấu hình trường gatewayTransactionId: kiểu chuỗi, bắt buộc nhập, có giá trị duy nhất trong bộ sưu tập (unique), và đánh index để tối ưu kiểm tra tồn tại
    gatewayTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Cấu hình trường userId: liên kết với bộ sưu tập User, bắt buộc nhập
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường amount: kiểu số, bắt buộc nhập để lưu trữ số tiền thanh toán nâng cấp
    amount: { type: Number, required: true },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
  },
  // Cấu hình timestamps: chỉ ghi nhận thời điểm tạo (createdAt: true), không cần updatedAt do giao dịch thanh toán là bất biến (không chỉnh sửa)
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Tạo và xuất ra mô hình PaymentTransaction
export const PaymentTransaction = model<IPaymentTransaction>(
  "PaymentTransaction",
  paymentTransactionSchema,
);

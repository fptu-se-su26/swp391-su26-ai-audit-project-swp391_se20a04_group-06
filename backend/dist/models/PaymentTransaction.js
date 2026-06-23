"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransaction = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ giao dịch thanh toán
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ mongoose paymentTransactionSchema
const paymentTransactionSchema = new mongoose_1.Schema({
    // Cấu hình trường gatewayTransactionId: kiểu chuỗi, bắt buộc nhập, có giá trị duy nhất trong bộ sưu tập (unique), và đánh index để tối ưu kiểm tra tồn tại
    gatewayTransactionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    // Cấu hình trường userId: liên kết với bộ sưu tập User, bắt buộc nhập
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường amount: kiểu số, bắt buộc nhập để lưu trữ số tiền thanh toán nâng cấp
    amount: { type: Number, required: true },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
}, 
// Cấu hình timestamps: chỉ ghi nhận thời điểm tạo (createdAt: true), không cần updatedAt do giao dịch thanh toán là bất biến (không chỉnh sửa)
{ timestamps: { createdAt: true, updatedAt: false } });
// Tạo và xuất ra mô hình PaymentTransaction
exports.PaymentTransaction = (0, mongoose_1.model)("PaymentTransaction", paymentTransactionSchema);

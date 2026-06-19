"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastLog = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để xây dựng lược đồ cơ sở dữ liệu
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ mongoose broadcastLogSchema
const broadcastLogSchema = new mongoose_1.Schema({
    // Cấu hình trường adminId: liên kết với bộ sưu tập User, bắt buộc nhập
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
{ timestamps: { createdAt: true, updatedAt: false } });
// Đánh chỉ mục index cho trường createdAt giảm dần để truy vấn lịch sử thông báo mới nhất nhanh hơn
broadcastLogSchema.index({ createdAt: -1 });
// Tạo và xuất mô hình BroadcastLog dùng cho việc tương tác dữ liệu
exports.BroadcastLog = (0, mongoose_1.model)("BroadcastLog", broadcastLogSchema);

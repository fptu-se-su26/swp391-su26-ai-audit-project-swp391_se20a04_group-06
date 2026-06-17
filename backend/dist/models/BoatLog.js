"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoatLog = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ (schema) và mô hình (model)
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ boatLogSchema dành cho bộ sưu tập BoatLog
const boatLogSchema = new mongoose_1.Schema({
    // Cấu hình trường userId: liên kết với bảng User, bắt buộc nhập, và được đánh chỉ mục index để truy vấn nhanh
    userId: {
        // Sử dụng định dạng Schema.Types.ObjectId của Mongoose
        type: mongoose_1.Schema.Types.ObjectId,
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
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
}, 
// Cấu hình tự động ghi nhận mốc thời gian tạo (createdAt) và sửa đổi (updatedAt) tài liệu
{ timestamps: true });
// Đánh chỉ mục phức hợp (Compound Index) theo userId tăng dần và createdAt giảm dần để tối ưu hóa truy vấn tìm kiếm nhật ký mới nhất
boatLogSchema.index({ userId: 1, createdAt: -1 });
// Tạo và xuất ra ngoài (export) mô hình BoatLog dựa trên lược đồ và giao diện đã định nghĩa
exports.BoatLog = (0, mongoose_1.model)("BoatLog", boatLogSchema);

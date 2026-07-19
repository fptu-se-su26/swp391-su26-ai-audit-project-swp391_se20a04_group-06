"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ thông báo người dùng
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ mongoose notificationSchema
const notificationSchema = new mongoose_1.Schema({
    // Cấu hình trường userId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh chỉ mục index để truy vấn nhanh
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // Cấu hình trường type: kiểu chuỗi và bắt buộc nhập
    type: { type: String, required: true },
    // Cấu hình trường content: kiểu chuỗi và bắt buộc nhập
    content: { type: String, required: true },
    // Cấu hình trường isRead: kiểu boolean, mặc định bằng false khi mới tạo thông báo
    isRead: { type: Boolean, default: false },
    // Cấu hình trường productId: kiểu ObjectId tham chiếu đến bảng Product (không bắt buộc)
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    landingBatchId: { type: mongoose_1.Schema.Types.ObjectId, ref: "LandingBatch" },
    // Cấu hình trường reviewId: kiểu ObjectId tham chiếu đến bảng Review (không bắt buộc)
    reviewId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Review" },
    // Cấu hình trường postId: kiểu ObjectId tham chiếu đến bảng Post (không bắt buộc)
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
}, 
// Cấu hình chỉ ghi nhận mốc thời gian tạo (createdAt: true), bỏ qua việc tự tạo trường updatedAt
{ timestamps: { createdAt: true, updatedAt: false } });
// Đánh chỉ mục index phức hợp theo userId tăng dần và createdAt giảm dần để tối ưu hóa việc tải danh sách thông báo mới nhất
notificationSchema.index({ userId: 1, createdAt: -1 });
// Tạo và xuất ra mô hình Notification
exports.Notification = (0, mongoose_1.model)("Notification", notificationSchema);

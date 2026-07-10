"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ báo cáo vi phạm
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ mongoose reportSchema
const reportSchema = new mongoose_1.Schema({
    // Cấu hình trường reporterId: liên kết với bộ sưu tập User, bắt buộc nhập
    reporterId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    // Cấu hình trường productId: liên kết với bộ sưu tập Product
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product", required: false },
    postId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: false },
    recipeId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Recipe", required: false },
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
{ timestamps: { createdAt: true, updatedAt: false } });
// Đánh chỉ mục index phức hợp để hỗ trợ truy vấn và kiểm tra trùng lặp báo cáo của cùng một người nhanh hơn
reportSchema.index({ reporterId: 1, productId: 1 });
reportSchema.index({ reporterId: 1, postId: 1 });
reportSchema.index({ reporterId: 1, recipeId: 1 });
// Đánh chỉ mục index phức hợp theo status tăng dần và thời gian tạo giảm dần để tối ưu hóa việc Admin tải danh sách báo cáo theo trạng thái xử lý
reportSchema.index({ status: 1, createdAt: -1 });
// Tạo và xuất mô hình Report
exports.Report = (0, mongoose_1.model)("Report", reportSchema);

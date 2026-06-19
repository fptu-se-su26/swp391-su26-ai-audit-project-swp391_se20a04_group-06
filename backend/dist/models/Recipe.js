"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recipe = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ công thức nấu ăn
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ recipeSchema dành cho bộ sưu tập Recipe
const recipeSchema = new mongoose_1.Schema({
    // Cấu hình trường title: kiểu chuỗi, bắt buộc nhập và tự động loại bỏ khoảng trắng hai đầu (trim)
    title: { type: String, required: true, trim: true },
    // Cấu hình trường description: kiểu chuỗi và bắt buộc nhập
    description: { type: String, required: true },
    // Cấu hình trường ingredients: mảng chứa danh sách nguyên liệu dạng chuỗi
    ingredients: [{ type: String }],
    // Cấu hình trường instructions: mảng chứa danh sách các bước chế biến dạng chuỗi
    instructions: [{ type: String }],
    // Cấu hình trường imageUrl: kiểu chuỗi hình ảnh, mặc định là null
    imageUrl: { type: String, default: null },
    // Cấu hình trường authorId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh index để tăng tốc độ tìm kiếm
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    // Cấu hình trường difficulty: kiểu chuỗi, chỉ nhận giá trị enum và mặc định là "Medium"
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium",
    },
    // Cấu hình trường cookingTime: kiểu số, mặc định là 30 phút
    cookingTime: { type: Number, default: 30 },
    // Cấu hình trường servings: kiểu số, mặc định là 2 người ăn
    servings: { type: Number, default: 2 },
    // Cấu hình trường tags: mảng các từ khóa gắn thẻ dạng chuỗi
    tags: [{ type: String }],
    // Cấu hình trường likes: mảng chứa các ObjectId tham chiếu đến bảng User
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    // Cấu hình trường viewCount: kiểu số lưu lượt xem, mặc định bằng 0
    viewCount: { type: Number, default: 0 },
}, 
// Kích hoạt tính năng timestamps tự động ghi nhận thời điểm tạo và cập nhật công thức
{ timestamps: true });
// Đánh chỉ mục index phức hợp theo authorId tăng dần và createdAt giảm dần để tối ưu hóa việc tải công thức mới nhất của một tác giả
recipeSchema.index({ authorId: 1, createdAt: -1 });
// Đánh chỉ mục tìm kiếm văn bản (Text Index) trên trường title và description để phục vụ tìm kiếm công thức bằng từ khóa nhanh chóng
recipeSchema.index({ title: "text", description: "text" });
// Tạo và xuất ra mô hình Recipe
exports.Recipe = (0, mongoose_1.model)("Recipe", recipeSchema);

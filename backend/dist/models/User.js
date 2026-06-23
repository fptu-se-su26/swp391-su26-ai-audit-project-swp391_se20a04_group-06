"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ tài khoản người dùng
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ userSchema dành cho bộ sưu tập User
const userSchema = new mongoose_1.Schema({
    // Cấu hình trường name: kiểu chuỗi, bắt buộc nhập và tự động loại bỏ khoảng trắng dư ở đầu/cuối (trim)
    name: { type: String, required: true, trim: true },
    // Cấu hình trường email: kiểu chuỗi, bắt buộc nhập, giá trị là duy nhất (unique), tự động viết thường (lowercase), trim và đánh chỉ mục index
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
    },
    // Cấu hình trường passwordHash: kiểu chuỗi và bắt buộc nhập
    passwordHash: { type: String, required: true },
    // Cấu hình trường role: kiểu chuỗi, chỉ nhận giá trị enum và mặc định là "User"
    role: { type: String, enum: ["User", "Admin"], default: "User" },
    // Cấu hình trường isActive: kiểu boolean, mặc định tài khoản mới tạo được kích hoạt hoạt động
    isActive: { type: Boolean, default: true },
    // Cấu hình trường isVerified: kiểu boolean, mặc định tài khoản mới chưa được xác minh
    isVerified: { type: Boolean, default: false },
    // Cấu hình trường avatar: kiểu chuỗi đường dẫn ảnh, mặc định là null
    avatar: { type: String, default: null },
    // Cấu hình trường favorites: mảng chứa các ObjectId tham chiếu đến bảng Product
    favorites: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Product" }],
    // Cấu hình trường following: mảng chứa các ObjectId tham chiếu đến chính bộ sưu tập User
    following: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    // Cấu hình trường isPremium: kiểu boolean, mặc định là tài khoản thường (false)
    isPremium: { type: Boolean, default: false },
    // Cấu hình trường badges: mảng chứa danh sách danh hiệu dạng chuỗi
    badges: [{ type: String }],
}, 
// Kích hoạt timestamps tự động theo dõi thời gian tạo và cập nhật tài khoản người dùng
{ timestamps: true });
// Đánh chỉ mục index cho trường following để tăng tốc độ truy vấn danh sách người theo dõi
userSchema.index({ following: 1 });
// Đánh chỉ mục index cho trường favorites để tăng tốc độ truy vấn danh sách sản phẩm yêu thích
userSchema.index({ favorites: 1 });
// Tạo và xuất ra mô hình User
exports.User = (0, mongoose_1.model)("User", userSchema);

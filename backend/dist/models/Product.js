"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
// Import các đối tượng Schema, model, Document và Types từ thư viện mongoose để thiết kế lược đồ sản phẩm hải sản
const mongoose_1 = require("mongoose");
// Khởi tạo lược đồ productSchema dành cho bộ sưu tập Product
const productSchema = new mongoose_1.Schema({
    // Cấu hình trường sellerId: liên kết với bộ sưu tập User, bắt buộc nhập và đánh index để tối ưu hóa truy vấn sản phẩm của một shop
    sellerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    batchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "LandingBatch",
        index: true,
    },
    // Cấu hình trường type: kiểu chuỗi, bắt buộc nhập và nhận giá trị trong mảng enum
    type: { type: String, enum: ["Fresh", "Dried"], required: true },
    // Cấu hình trường category: kiểu chuỗi, bắt buộc nhập và nhận giá trị trong mảng enum danh mục hải sản
    category: {
        type: String,
        enum: ["Fish", "Shrimp", "Squid", "Crab", "Shellfish", "Others"],
        required: true,
    },
    // Cấu hình trường name: kiểu chuỗi, bắt buộc nhập và tự động cắt khoảng trắng hai đầu (trim)
    name: { type: String, required: true, trim: true },
    // Cấu hình trường description: kiểu chuỗi và mặc định bằng null
    description: { type: String, default: null },
    // Cấu hình trường price: kiểu số và bắt buộc nhập
    price: { type: Number, required: true },
    priceHistory: [
        {
            price: { type: Number, required: true },
            changedAt: { type: Date, default: Date.now },
            _id: false,
        },
    ],
    // Cấu hình trường salesType: kiểu chuỗi, bắt buộc nhận giá trị enum và mặc định là "Retail"
    salesType: {
        type: String,
        enum: ["Retail", "Wholesale"],
        default: "Retail",
    },
    // Cấu hình trường totalWeight: kiểu số và bắt buộc nhập
    totalWeight: { type: Number, required: true },
    // Cấu hình trường remainingWeight: kiểu số và bắt buộc nhập
    remainingWeight: { type: Number, required: true },
    // Cấu hình trường status: kiểu chuỗi, nhận giá trị enum trạng thái và mặc định là "Active"
    status: {
        type: String,
        enum: ["Active", "Expired", "Deleted"],
        default: "Active",
    },
    // Cấu hình GeoJSON định vị của sản phẩm
    // LƯU Ý BẢO MẬT/LOGIC: Không đặt "default: 'Point'" ở trường type vì Mongoose sẽ tự tạo đối tượng rỗng
    // khi lưu sản phẩm không có tọa độ (đồ khô), dẫn đến lỗi chỉ mục 2dsphere của MongoDB do thiếu tọa độ.
    location: {
        // Kiểu String và chỉ chấp nhận giá trị là "Point"
        type: { type: String, enum: ["Point"] },
        // Mảng lưu trữ các số thực đại diện cho tọa độ: [Kinh độ, Vĩ độ]
        coordinates: { type: [Number] },
    },
    // Cấu hình GeoJSON tọa độ nơi đánh bắt hải sản tươi sống
    catchLocation: {
        // Kiểu String và chỉ chấp nhận giá trị là "Point"
        type: { type: String, enum: ["Point"] },
        // Mảng lưu trữ tọa độ: [Kinh độ, Vĩ độ]
        coordinates: { type: [Number] },
    },
    // Cấu hình trường catchTime: kiểu thời gian Date
    catchTime: { type: Date },
    // Cấu hình trường origin: kiểu chuỗi lưu xuất xứ mẻ cá
    origin: { type: String },
    // Cấu hình trường expiryDate: kiểu thời gian Date lưu hạn dùng
    expiryDate: { type: Date },
    // Cấu hình trường images: mảng chứa các URL ảnh dạng chuỗi
    images: [{ type: String }],
    // Cấu hình trường viewCount: kiểu số lưu lượt xem, mặc định bằng 0
    viewCount: { type: Number, default: 0 },
    // Cấu hình trường bumpedAt: kiểu thời gian lưu mốc đẩy bài, mặc định là thời điểm hiện tại
    bumpedAt: { type: Date, default: Date.now },
}, 
// Kích hoạt timestamps tự động cập nhật thời gian tạo và cập nhật sản phẩm
{ timestamps: true });
// Thiết lập chỉ mục không gian hình học 2dsphere cho trường location để hỗ trợ tính toán khoảng cách địa lý (ví dụ: tìm sản phẩm quanh bán kính 20km)
productSchema.index({ location: "2dsphere" });
// Thiết lập chỉ mục index phức hợp tối ưu hóa tìm kiếm sản phẩm đang bán, theo loại, và sắp xếp đẩy bài xếp trước
productSchema.index({ status: 1, type: 1, bumpedAt: -1, createdAt: -1 });
// Thiết lập chỉ mục index phức hợp tối ưu hóa tìm kiếm sản phẩm của một shop sắp xếp theo mốc đẩy bài
productSchema.index({ sellerId: 1, bumpedAt: -1, createdAt: -1 });
productSchema.index({ batchId: 1, status: 1, createdAt: -1 });
// Thiết lập chỉ mục tìm kiếm văn bản toàn diện (Full-Text Search) trên hai trường name và description để hỗ trợ tìm kiếm bằng từ khóa tiếng Việt
productSchema.index({ name: "text", description: "text" });
// Tạo và xuất ra mô hình Product
exports.Product = (0, mongoose_1.model)("Product", productSchema);

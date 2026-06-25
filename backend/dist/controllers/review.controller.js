"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addReview = addReview;
exports.getReviewsBySeller = getReviewsBySeller;
// Import reviewService chứa logic nghiệp vụ thêm/lấy đánh giá người bán
const review_service_1 = require("../services/review.service");
// Import helper gửi phản hồi lỗi server chuẩn hóa
const response_helper_1 = require("../helpers/response.helper");
// Import thư viện Mongoose để kiểm tra kiểu dữ liệu ID của MongoDB
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * HÀM NGƯỜI DÙNG GỬI ĐÁNH GIÁ (REVIEW/FEEDBACK) CHO NGƯỜI BÁN
 */
async function addReview(req, res) {
    // Lấy ID người thực hiện đánh giá từ token xác thực
    const { userId: reviewerId } = req.user;
    try {
        // Gọi service xử lý thêm đánh giá mới, truyền vào ID người đánh giá, dữ liệu body (sao, nội dung...) và tệp tin hình ảnh đính kèm (nếu có) dưới dạng buffer
        const reviewId = await review_service_1.reviewService.addReview(reviewerId, req.body, req.file?.buffer);
        // Trả về mã thành công 201 cùng ID của đánh giá vừa tạo cho Client
        return res.status(201).json({ message: "Đánh giá thành công", reviewId });
    }
    catch (err) {
        // Trả về lỗi nghiệp vụ nếu có định nghĩa sẵn status code
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        // Trả về lỗi server 500 nếu có sự cố bất ngờ
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM TRUY VẤN DANH SÁCH ĐÁNH GIÁ CỦA MỘT NGƯỜI BÁN (CÓ PHÂN TRANG)
 */
async function getReviewsBySeller(req, res) {
    // Lấy ID người bán cần truy vấn đánh giá từ tham số URL (:sellerId)
    const { sellerId } = req.params;
    // Validate: Đảm bảo ID người bán hợp lệ định dạng MongoDB ObjectId
    if (!sellerId || !mongoose_1.default.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({ message: "ID người bán không hợp lệ" });
    }
    // Tự thực hiện logic phân trang thủ công và giới hạn cận trên limit tối đa 100
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit; // Tính số bản ghi bỏ qua (offset)
    try {
        // Gọi service lấy danh sách đánh giá của người bán theo skip/limit
        const { formatted, total } = await review_service_1.reviewService.listSellerReviews(sellerId, skip, limit);
        // Trả về dữ liệu phân trang đánh giá cho Client dạng JSON
        return res.json({
            data: formatted, // Mảng danh sách đánh giá chi tiết
            page, // Số trang hiện tại
            limit, // Giới hạn số phần tử trên trang
            total, // Tổng số đánh giá của người bán này
            totalPages: Math.ceil(total / limit), // Tổng số trang tính được
        });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

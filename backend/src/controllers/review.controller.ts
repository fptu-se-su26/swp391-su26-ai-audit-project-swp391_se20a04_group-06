// Import các kiểu dữ liệu Request và Response từ thư viện Express
import { Request, Response } from "express";
// Import reviewService chứa logic nghiệp vụ thêm/lấy đánh giá người bán
import { reviewService } from "../services/review.service";
// Import helper gửi phản hồi lỗi server chuẩn hóa
import { sendServerError } from "../helpers/response.helper";
// Import thư viện Mongoose để kiểm tra kiểu dữ liệu ID của MongoDB
import mongoose from "mongoose";

/**
 * HÀM NGƯỜI DÙNG GỬI ĐÁNH GIÁ (REVIEW/FEEDBACK) CHO NGƯỜI BÁN
 */
export async function addReview(req: Request, res: Response) {
  // Lấy ID người thực hiện đánh giá từ token xác thực
  const { userId: reviewerId } = req.user;
  try {
    // Gọi service xử lý thêm đánh giá mới, truyền vào ID người đánh giá, dữ liệu body (sao, nội dung...) và tệp tin hình ảnh đính kèm (nếu có) dưới dạng buffer
    const reviewId = await reviewService.addReview(
      reviewerId,
      req.body,
      req.file?.buffer,
    );
    // Trả về mã thành công 201 cùng ID của đánh giá vừa tạo cho Client
    return res.status(201).json({ message: "Đánh giá thành công", reviewId });
  } catch (err: any) {
    // Trả về lỗi nghiệp vụ nếu có định nghĩa sẵn status code
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về lỗi server 500 nếu có sự cố bất ngờ
    return sendServerError(res, err);
  }
}

/**
 * HÀM TRUY VẤN DANH SÁCH ĐÁNH GIÁ CỦA MỘT NGƯỜI BÁN (CÓ PHÂN TRANG)
 */
export async function getReviewsBySeller(req: Request, res: Response) {
  // Lấy ID người bán cần truy vấn đánh giá từ tham số URL (:sellerId)
  const { sellerId } = req.params;
  // Validate: Đảm bảo ID người bán hợp lệ định dạng MongoDB ObjectId
  if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({ message: "ID người bán không hợp lệ" });
  }

  // Tự thực hiện logic phân trang thủ công và giới hạn cận trên limit tối đa 100
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) || "20", 10)),
  );
  const skip = (page - 1) * limit; // Tính số bản ghi bỏ qua (offset)

  try {
    // Gọi service lấy danh sách đánh giá của người bán theo skip/limit
    const { formatted, total } = await reviewService.listSellerReviews(
      sellerId,
      skip,
      limit,
    );
    // Trả về dữ liệu phân trang đánh giá cho Client dạng JSON
    return res.json({
      data: formatted,                         // Mảng danh sách đánh giá chi tiết
      page,                                    // Số trang hiện tại
      limit,                                   // Giới hạn số phần tử trên trang
      total,                                   // Tổng số đánh giá của người bán này
      totalPages: Math.ceil(total / limit),    // Tổng số trang tính được
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}


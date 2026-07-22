// Import mô hình Review và kiểu IReview để tương tác dữ liệu đánh giá sản phẩm
import { Review, IReview } from "../models/Review";
// Import mô hình Message để kiểm tra tương tác giữa người mua và người bán
import { Message } from "../models/Message";
import mongoose from "mongoose";

// Xuất ra đối tượng reviewRepository chứa các phương thức tương tác cơ sở dữ liệu cho phần đánh giá/review
export const reviewRepository = {
  // Kiểm tra xem người mua và người bán đã từng chat (tương tác) với nhau về sản phẩm đó chưa
  async hasBuyerInteracted(
    // ID của sản phẩm
    productId: string,
    // ID của người mua
    buyerId: string,
    // ID của người bán
    sellerId: string,
  ): Promise<boolean> {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return false;
    if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) return false;
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) return false;

    // Yêu cầu hội thoại hai chiều thực tế: người mua nhắn cho người bán VÀ người bán có phản hồi lại
    const buyerSent = await Message.exists({
      productId,
      senderId: buyerId,
      receiverId: sellerId,
    });
    const sellerSent = await Message.exists({
      productId,
      senderId: sellerId,
      receiverId: buyerId,
    });
    return !!(buyerSent && sellerSent);
  },

  // Kiểm tra xem người đánh giá đã từng đánh giá sản phẩm này chưa
  async existsByReviewerAndProduct(
    // ID người đánh giá (người mua)
    reviewerId: string,
    // ID sản phẩm được đánh giá
    productId: string,
  ): Promise<boolean> {
    if (!reviewerId || !mongoose.Types.ObjectId.isValid(reviewerId)) return false;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return false;
    // Tìm kiếm xem có đánh giá nào khớp với reviewerId và productId không, ép kiểu về Boolean
    return !!(await Review.findOne({ reviewerId, productId }));
  },

  // Tìm kiếm một tài liệu đánh giá dựa theo điều kiện lọc
  async findOne(query: any): Promise<IReview | null> {
    // Tìm kiếm một tài liệu đánh giá dựa theo điều kiện lọc
    return Review.findOne(query);
  },

  // Đếm tổng số lượng đánh giá khớp với bộ lọc
  async countDocuments(filter: any): Promise<number> {
    // Gọi phương thức countDocuments của Mongoose model để đếm
    return Review.countDocuments(filter);
  },

  // Xóa hàng loạt các đánh giá khớp với bộ lọc
  async deleteMany(filter: any): Promise<any> {
    // Thực hiện xóa đồng loạt và trả về kết quả
    return Review.deleteMany(filter);
  },

  // Thực hiện truy vấn tổng hợp phức tạp (Aggregation) trên tập hợp đánh giá
  async aggregate(pipeline: any[]): Promise<any[]> {
    // Gọi aggregate với pipeline được truyền vào
    return Review.aggregate(pipeline);
  },

  // Tạo mới một đánh giá sản phẩm
  async create(data: {
    // ID sản phẩm được đánh giá
    productId: string;
    // ID người gửi đánh giá
    reviewerId: string;
    // ID người bán nhận đánh giá
    sellerId: string;
    // Điểm đánh giá (ví dụ: số sao từ 1 đến 5)
    rating: number;
    // Nhận xét chi tiết (tùy chọn)
    comment: string | null;
    // Đường dẫn ảnh đính kèm (tùy chọn)
    imageUrl: string | null;
  }) {
    // Khởi tạo đối tượng Review mới từ dữ liệu đầu vào
    const review = new Review(data);
    // Lưu tài liệu đánh giá vào cơ sở dữ liệu
    await review.save();
    // Trả về đối tượng đánh giá vừa tạo
    return review;
  },

  // Lấy danh sách đánh giá của một người bán có phân trang
  async findBySeller(sellerId: string, skip: number, limit: number) {
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return { rows: [], total: 0 };
    }
    // Chạy song song lệnh tìm kiếm danh sách đánh giá và đếm tổng số lượng đánh giá của người bán này
    const [rows, total] = await Promise.all([
      // Tìm kiếm đánh giá của người bán cụ thể
      Review.find({ sellerId })
        // Liên kết lấy thông tin tên của người đánh giá (reviewerId)
        .populate("reviewerId", "name")
        // Liên kết lấy thông tin tên của sản phẩm được đánh giá (productId)
        .populate("productId", "name")
        // Sắp xếp theo thời gian tạo giảm dần (mới nhất lên đầu)
        .sort({ createdAt: -1 })
        // Bỏ qua skip phần tử để phân trang
        .skip(skip)
        // Giới hạn tối đa limit phần tử trên mỗi trang
        .limit(limit),
      // Đếm tổng số lượng đánh giá có trường sellerId trùng khớp
      Review.countDocuments({ sellerId }),
    ]);
    // Trả về danh sách các hàng đánh giá và tổng số lượng
    return { rows, total };
  },
};

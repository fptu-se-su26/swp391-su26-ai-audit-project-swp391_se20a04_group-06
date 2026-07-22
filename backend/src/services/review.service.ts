// Import đối tượng reviewRepository phục vụ các truy vấn tương tác cơ sở dữ liệu với bảng reviews
import { reviewRepository } from "../repositories/review.repository";
// Import đối tượng userRepository để lấy thông tin tài khoản người viết đánh giá và người bán
import { userRepository } from "../repositories/user.repository";
// Import đối tượng productRepository để lấy thông tin sản phẩm mẻ hàng nhận đánh giá
import { productRepository } from "../repositories/product.repository";
// Import hàm notifySellerNewReview để gửi thông báo thời gian thực khi có người gửi đánh giá mới
import { notifySellerNewReview } from "./notification.service";
// Import hàm updateUserBadges phục vụ tái tính toán và cập nhật các danh hiệu tích lũy của người dùng
import { updateUserBadges } from "./badge.service";
// Import lớp lỗi HttpError dùng để ném ra các lỗi kèm theo mã HTTP phù hợp
import { HttpError } from "../errors/HttpError";

// Xuất ra đối tượng reviewService chứa các logic nghiệp vụ liên quan đến đánh giá mẻ hàng sản phẩm
export const reviewService = {
  // Nghiệp vụ thêm đánh giá mới cho mẻ hàng hải sản, có hỗ trợ tải tệp tin hình ảnh đính kèm lên Cloudinary
  async addReview(reviewerId: string, body: any, fileBuffer?: Buffer) {
    // Trích xuất thông tin ID sản phẩm, ID người bán, điểm đánh giá và lời nhận xét từ phần thân yêu cầu
    const { productId, sellerId, rating, comment } = body;
    // Chuyển đổi điểm đánh giá rating từ dạng chuỗi sang dạng số thực
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new HttpError(400, "Đánh giá phải từ 1 đến 5 sao");
    }

    // Ràng buộc nghiệp vụ: Không cho phép người dùng tự gửi đánh giá, tự nâng điểm uy tín cho chính mình
    if (reviewerId.toString() === sellerId.toString()) {
      // Ném lỗi 400 Bad Request nếu phát hiện ID người đánh giá trùng với ID người bán
      throw new HttpError(400, "Bạn không thể tự đánh giá chính mình");
    }

    // Kiểm tra tính tương tác: Chỉ cho phép người mua đã thực sự liên hệ trao đổi tin nhắn với người bán về mẻ hàng này được viết đánh giá
    const hasInteracted = await reviewRepository.hasBuyerInteracted(
      // ID mẻ hàng cần đánh giá
      productId,
      // ID người mua viết đánh giá
      reviewerId,
      // ID người bán sở hữu mẻ hàng
      sellerId,
    );
    // Nếu chưa từng nhắn tin liên lạc tương tác qua lại về sản phẩm này
    if (!hasInteracted) {
      // Ném lỗi 403 Forbidden chặn không cho phép đánh giá bừa bãi
      throw new HttpError(
        403,
        "Chỉ những người đã liên hệ người bán về sản phẩm này mới được đánh giá",
      );
    }

    // Kiểm tra tính duy nhất: Mỗi sản phẩm mẻ hàng người mua chỉ được phép đánh giá tối đa một lần duy nhất
    const existing = await reviewRepository.existsByReviewerAndProduct(
      // ID người mua
      reviewerId,
      // ID mẻ hàng
      productId,
    );
    // Nếu đã tồn tại bản ghi đánh giá tương ứng trong cơ sở dữ liệu
    if (existing) {
      // Ném lỗi 409 Conflict báo trùng lặp đánh giá
      throw new HttpError(409, "Bạn đã đánh giá sản phẩm này rồi");
    }

    // Khởi tạo đường dẫn hình ảnh đánh giá ban đầu, mặc định lấy từ thuộc tính gửi lên hoặc null
    let finalImageUrl = body.imageUrl || null;
    // Nếu có dữ liệu bộ đệm tệp hình ảnh tải lên từ máy khách
    if (fileBuffer) {
      // Nạp động hàm uploadToCloudinary từ middleware tải ảnh lên đám mây để tối ưu hiệu năng import
      const { uploadToCloudinary } = require("../middlewares/upload");
      // Thực hiện đẩy tệp hình ảnh lên thư mục "reviews" trên Cloudinary
      const { url } = await uploadToCloudinary(fileBuffer, "reviews");
      // Gán đường dẫn ảnh tải lên thành công vào biến lưu trữ cuối cùng
      finalImageUrl = url;
    }

    // Làm sạch comment để chống tấn công tiêm mã độc XSS và giới hạn tối đa 500 ký tự
    const cleanComment = comment
      ? comment
          .trim() // Cắt khoảng trắng hai đầu
          .replace(/<[^>]*>/g, "") // Loại bỏ các thẻ tag HTML thô
          .slice(0, 500) // Lấy tối đa 500 ký tự đầu tiên
      : null; // Nếu không viết nhận xét thì để giá trị null

    // Tạo tài liệu đánh giá mới và lưu trữ xuống cơ sở dữ liệu qua repository
    const newReview = await reviewRepository.create({
      // ID sản phẩm được đánh giá
      productId,
      // ID người gửi đánh giá
      reviewerId,
      // ID người bán nhận đánh giá
      sellerId,
      // Điểm số đánh giá
      rating: numRating,
      // Lời nhận xét đã làm sạch
      comment: cleanComment,
      // Đường dẫn hình ảnh đính kèm nếu có
      imageUrl: finalImageUrl,
    });

    // Cập nhật lại huy hiệu danh hiệu cho người bán bất đồng bộ (không chặn luồng xử lý chính)
    updateUserBadges(sellerId).catch(() => {});
    // Cập nhật lại huy hiệu danh hiệu cho người viết đánh giá bất đồng bộ để tránh ảnh hưởng phản hồi API
    updateUserBadges(reviewerId).catch(() => {});

    // Lấy thông tin tài khoản thô của người mua để phục vụ hiển thị tên trong thông báo
    const reviewer = await userRepository.findRawById(reviewerId);
    // Lấy thông tin mẻ hàng hải sản để phục vụ hiển thị tên sản phẩm trong thông báo
    const product = await productRepository.findById(productId);

    // Gửi thông báo đẩy và lưu thông báo đến người bán về việc nhận được một đánh giá mới
    await notifySellerNewReview({
      // ID tài khoản của người bán
      sellerId: sellerId as any,
      // ID tài khoản người gửi đánh giá
      reviewerId: reviewerId as any,
      // Tên hiển thị người đánh giá
      reviewerName: reviewer?.name || "Một người dùng",
      // ID sản phẩm mẻ hàng
      productId: productId as any,
      // Tên của sản phẩm mẻ hàng
      productName: product?.name || "sản phẩm",
      // ID của bản ghi đánh giá vừa tạo dạng chuỗi
      reviewId: newReview._id.toString(),
      // Số sao đánh giá
      rating: numRating,
      // Lời bình luận nhận xét đi kèm
      comment: comment || null,
    });

    // Trả về ID của tài liệu đánh giá mới tạo thành công
    return newReview._id;
  },

  // Nghiệp vụ lấy danh sách tất cả các đánh giá của một người bán có hỗ trợ phân trang
  async listSellerReviews(sellerId: string, skip: number, limit: number) {
    // Truy vấn cơ sở dữ liệu thông qua repository để lấy danh sách đánh giá và tổng số dòng khớp
    const { rows, total } = await reviewRepository.findBySeller(
      // ID người bán nhận đánh giá
      sellerId,
      // Vị trí dòng bắt đầu lấy
      skip,
      // Số dòng tối đa cần lấy
      limit,
    );

    // Định dạng cấu trúc thuộc tính trả về tương thích đồng bộ với giao diện của ứng dụng
    const formatted = rows.map((r: any) => ({
      // ID của bản ghi đánh giá
      ReviewID: r._id,
      // Điểm đánh giá (Rating)
      Rating: r.rating,
      // Nội dung bình luận nhận xét
      Comment: r.comment,
      // Đường dẫn ảnh đính kèm thực tế
      ImageURL: r.imageUrl,
      // Thời điểm tạo đánh giá
      CreatedAt: r.createdAt,
      // Tên hiển thị của người đánh giá, mặc định nếu không truy cập được tài khoản
      ReviewerName: r.reviewerId?.name || "Một người dùng",
      // Tên mẻ hàng sản phẩm hải sản, mặc định nếu sản phẩm đã bị xóa
      ProductName: r.productId?.name || "Sản phẩm",
    }));

    // Trả về danh sách đánh giá đã chuẩn hóa thuộc tính và tổng số lượng bản ghi phục vụ phân trang
    return { formatted, total };
  },
};

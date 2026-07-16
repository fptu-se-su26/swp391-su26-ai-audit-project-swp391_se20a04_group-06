// Import đối tượng reviewService chứa logic nghiệp vụ đánh giá cần kiểm thử
import { reviewService } from "../../../../backend/src/services/review.service";
// Import đối tượng reviewRepository phục vụ giả lập các tương tác cơ sở dữ liệu đánh giá
import { reviewRepository } from "../../../../backend/src/repositories/review.repository";
// Import đối tượng userRepository phục vụ giả lập các tương tác cơ sở dữ liệu người dùng
import { userRepository } from "../../../../backend/src/repositories/user.repository";
// Import đối tượng productRepository phục vụ giả lập các tương tác cơ sở dữ liệu sản phẩm mẻ hàng
import { productRepository } from "../../../../backend/src/repositories/product.repository";

// Thực hiện giả lập (mock) toàn bộ module reviewRepository để không làm ảnh hưởng cơ sở dữ liệu thật
jest.mock("../../../../backend/src/repositories/review.repository");
// Thực hiện giả lập (mock) toàn bộ module userRepository để tránh truy vấn cơ sở dữ liệu người dùng thật
jest.mock("../../../../backend/src/repositories/user.repository");
// Thực hiện giả lập (mock) toàn bộ module productRepository để tránh truy vấn cơ sở dữ liệu sản phẩm thật
jest.mock("../../../../backend/src/repositories/product.repository");
// Thực hiện giả lập nghiệp vụ notifySellerNewReview gửi thông báo để tránh gửi các thông báo thực tế
jest.mock("../../../../backend/src/services/notification.service", () => ({
  // Hàm notifySellerNewReview luôn giải quyết thành công (trả về undefined)
  notifySellerNewReview: jest.fn().mockResolvedValue(undefined),
}));
// Thực hiện giả lập nghiệp vụ updateUserBadges cập nhật huy hiệu người dùng để tránh chạy logic huy hiệu thực tế
jest.mock("../../../../backend/src/services/badge.service", () => ({
  // Hàm updateUserBadges luôn trả về mảng rỗng dưới dạng Promise đã giải quyết thành công
  updateUserBadges: jest.fn().mockResolvedValue([]),
}));
// Thực hiện giả lập ghi log hệ thống bằng cách mock logger ghi log lỗi để giữ màn hình console sạch sẽ
jest.mock("../../../../backend/src/utils/logger", () => ({
  // Đối tượng logger giả lập chứa các hàm thông báo rỗng
  logger: {
    // Hàm log thông tin bình thường giả lập
    info: jest.fn(),
    // Hàm log cảnh báo giả lập
    warn: jest.fn(),
    // Hàm log lỗi giả lập
    error: jest.fn(),
  },
}));

// Khởi tạo khối describe gom các ca kiểm thử đơn vị cho dịch vụ Review Service
describe("Unit Test: Nghiệp vụ Review Service (review.service.ts)", () => {
  // Định nghĩa một ID người đánh giá giả lập cố định
  const mockReviewerId = "60c72b2f9b1d8b2bad000001";
  // Định nghĩa một ID người bán giả lập cố định
  const mockSellerId = "60c72b2f9b1d8b2bad000002";
  // Định nghĩa một ID sản phẩm giả lập cố định
  const mockProductId = "60c72b2f9b1d8b2bad000003";

  // Hàm chạy trước mỗi ca kiểm thử đơn lẻ để dọn dẹp các thiết lập cũ
  beforeEach(() => {
    // Xóa sạch lịch sử gọi hàm của các module mock
    jest.clearAllMocks();
  });

  // Ca kiểm thử kiểm tra ném lỗi 400 nếu người dùng tự gửi đánh giá cho chính bản thân mình
  it("Nên ném lỗi 400 nếu người dùng tự gửi đánh giá cho chính bản thân mình", async () => {
    // Định nghĩa phần thân dữ liệu gửi đánh giá vi phạm quy định tự đánh giá
    const body = {
      // ID sản phẩm bị đánh giá
      productId: mockProductId,
      // ID người bán trùng khớp với ID người gửi đánh giá
      sellerId: mockReviewerId,
      // Điểm đánh giá 5 sao
      rating: 5,
      // Lời bình luận nhận xét
      comment: "Cá rất tươi",
    };

    // Kỳ vọng cuộc gọi addReview sẽ thất bại và ném lỗi 400
    await expect(
      // Gọi nghiệp vụ addReview từ dịch vụ với ID người mua trùng người bán
      reviewService.addReview(mockReviewerId, body)
    ).rejects.toThrow(
      // Kiểm tra đối tượng lỗi trả về có đúng các thông số mong đợi
      expect.objectContaining({
        // Mã trạng thái HTTP 400 Bad Request
        status: 400,
        // Thông điệp báo lỗi chi tiết
        message: "Bạn không thể tự đánh giá chính mình",
      }),
    );
  });

  // Ca kiểm thử kiểm tra ném lỗi 403 nếu người mua chưa từng nhắn tin trao đổi với người bán về mẻ hàng này
  it("Nên ném lỗi 403 nếu người mua chưa từng nhắn tin trao đổi với người bán về mẻ hàng này", async () => {
    // Định nghĩa dữ liệu gửi đánh giá hợp lệ
    const body = {
      // ID sản phẩm
      productId: mockProductId,
      // ID người bán
      sellerId: mockSellerId,
      // Số điểm đánh giá
      rating: 5,
      // Nội dung bình luận
      comment: "Giao hàng nhanh",
    };

    // Giả lập hàm hasBuyerInteracted của reviewRepository trả về false biểu thị chưa từng nhắn tin trao đổi
    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(false);

    // Kỳ vọng cuộc gọi addReview sẽ thất bại và ném lỗi 403
    await expect(
      // Gọi nghiệp vụ addReview từ dịch vụ
      reviewService.addReview(mockReviewerId, body)
    ).rejects.toThrow(
      // Kiểm tra đối tượng lỗi chứa mã trạng thái 403 và thông điệp yêu cầu tương tác trước khi đánh giá
      expect.objectContaining({
        // Mã trạng thái HTTP 403 Forbidden
        status: 403,
        // Thông báo lỗi chi tiết hiển thị cho người mua
        message:
          "Chỉ những người đã liên hệ người bán về sản phẩm này mới được đánh giá",
      }),
    );
  });

  // Ca kiểm thử kiểm tra ném lỗi 409 nếu người mua cố tình gửi đánh giá lần thứ 2 cho cùng một sản phẩm
  it("Nên ném lỗi 409 nếu người mua cố tình gửi đánh giá lần thứ 2 cho cùng một sản phẩm", async () => {
    // Định nghĩa dữ liệu gửi đánh giá hợp lệ
    const body = {
      // ID sản phẩm
      productId: mockProductId,
      // ID người bán
      sellerId: mockSellerId,
      // Số điểm đánh giá
      rating: 4,
      // Nội dung bình luận
      comment: "Mực dày cơm",
    };

    // Giả lập người mua đã nhắn tin liên hệ trao đổi thành công (trả về true)
    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(true);
    // Giả lập đã tồn tại bản ghi đánh giá của cặp (reviewerId, productId) này trong cơ sở dữ liệu (trả về true)
    (
      reviewRepository.existsByReviewerAndProduct as jest.Mock
    ).mockResolvedValue(true);

    // Kỳ vọng cuộc gọi addReview sẽ bị từ chối và ném lỗi 409
    await expect(
      // Gọi nghiệp vụ addReview từ dịch vụ
      reviewService.addReview(mockReviewerId, body)
    ).rejects.toThrow(
      // Kiểm tra đối tượng lỗi chứa mã trạng thái 409 Conflict và thông điệp đã đánh giá
      expect.objectContaining({
        // Mã lỗi HTTP 409 Conflict
        status: 409,
        // Thông điệp báo trùng lặp đánh giá
        message: "Bạn đã đánh giá sản phẩm này rồi",
      }),
    );
  });

  // Ca kiểm thử kiểm tra lưu đánh giá thành công khi đáp ứng đầy đủ điều kiện ràng buộc nghiệp vụ
  it("Nên lưu đánh giá thành công khi đáp ứng đầy đủ điều kiện ràng buộc nghiệp vụ", async () => {
    // Định nghĩa dữ liệu đánh giá đầy đủ hợp lệ
    const body = {
      // ID sản phẩm
      productId: mockProductId,
      // ID người bán
      sellerId: mockSellerId,
      // Điểm số đánh giá
      rating: 5,
      // Lời nhận xét đánh giá mẻ hàng
      comment: "Cá thu rất ngon và đóng gói đá cẩn thận",
    };

    // Giả lập đã nhắn tin tương tác trao đổi mẻ cá này (trả về true)
    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(true);
    // Giả lập chưa từng viết đánh giá cho sản phẩm mẻ hàng này (trả về false)
    (
      reviewRepository.existsByReviewerAndProduct as jest.Mock
    ).mockResolvedValue(false);
    // Giả lập hàm lưu đánh giá của reviewRepository trả về đối tượng chứa ID đánh giá giả lập
    (reviewRepository.create as jest.Mock).mockResolvedValue({
      // ID bản ghi đánh giá vừa tạo
      _id: "mock_review_id_105",
    });
    // Giả lập tìm kiếm thông tin tài khoản người viết đánh giá trả về tên "Người mua"
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      name: "Người mua",
    });
    // Giả lập tìm kiếm sản phẩm trả về tên sản phẩm "Cá thu Đồ Sơn"
    (productRepository.findById as jest.Mock).mockResolvedValue({
      name: "Cá thu Đồ Sơn",
    });

    // Thực thi gọi hàm addReview từ dịch vụ reviewService
    const result = await reviewService.addReview(mockReviewerId, body);

    // Kỳ vọng kết quả ID đánh giá trả về khớp chính xác với ID giả lập
    expect(result).toBe("mock_review_id_105");
    // Đảm bảo hàm create của reviewRepository được gọi với cấu trúc tham số lưu trữ chính xác
    expect(reviewRepository.create).toHaveBeenCalledWith(
      // Khớp cấu trúc đối tượng chứa các trường thông tin đánh giá
      expect.objectContaining({
        // ID sản phẩm bị đánh giá
        productId: mockProductId,
        // ID người thực hiện đánh giá
        reviewerId: mockReviewerId,
        // ID người bán sở hữu sản phẩm
        sellerId: mockSellerId,
        // Số điểm sao đánh giá
        rating: 5,
        // Nội dung lời bình luận đánh giá mẻ hàng
        comment: "Cá thu rất ngon và đóng gói đá cẩn thận",
      }),
    );
  });
});

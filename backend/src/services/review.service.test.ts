import { reviewService } from "./review.service";
import { reviewRepository } from "../repositories/review.repository";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";

// Giả lập repositories và các dịch vụ liên quan
jest.mock("../repositories/review.repository");
jest.mock("../repositories/user.repository");
jest.mock("../repositories/product.repository");
jest.mock("./notification.service", () => ({
  notifySellerNewReview: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("./badge.service", () => ({
  updateUserBadges: jest.fn().mockResolvedValue([]),
}));
jest.mock("../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Unit Test: Nghiệp vụ Review Service (review.service.ts)", () => {
  const mockReviewerId = "60c72b2f9b1d8b2bad000001";
  const mockSellerId = "60c72b2f9b1d8b2bad000002";
  const mockProductId = "60c72b2f9b1d8b2bad000003";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Nên ném lỗi 400 nếu người dùng tự gửi đánh giá cho chính bản thân mình", async () => {
    const body = {
      productId: mockProductId,
      sellerId: mockReviewerId, // Trùng ID với người gửi đánh giá
      rating: 5,
      comment: "Cá rất tươi",
    };

    await expect(reviewService.addReview(mockReviewerId, body)).rejects.toThrow(
      expect.objectContaining({
        status: 400,
        message: "Bạn không thể tự đánh giá chính mình",
      }),
    );
  });

  it("Nên ném lỗi 403 nếu người mua chưa từng nhắn tin trao đổi với người bán về mẻ hàng này", async () => {
    const body = {
      productId: mockProductId,
      sellerId: mockSellerId,
      rating: 5,
      comment: "Giao hàng nhanh",
    };

    // Giả lập chưa từng nhắn tin trao đổi qua lại về sản phẩm
    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(false);

    await expect(reviewService.addReview(mockReviewerId, body)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        message:
          "Chỉ những người đã liên hệ người bán về sản phẩm này mới được đánh giá",
      }),
    );
  });

  it("Nên ném lỗi 409 nếu người mua cố tình gửi đánh giá lần thứ 2 cho cùng một sản phẩm", async () => {
    const body = {
      productId: mockProductId,
      sellerId: mockSellerId,
      rating: 4,
      comment: "Mực dày cơm",
    };

    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(true);
    // Giả lập đã tồn tại bản ghi đánh giá của cặp (reviewerId, productId) này trong database
    (
      reviewRepository.existsByReviewerAndProduct as jest.Mock
    ).mockResolvedValue(true);

    await expect(reviewService.addReview(mockReviewerId, body)).rejects.toThrow(
      expect.objectContaining({
        status: 409,
        message: "Bạn đã đánh giá sản phẩm này rồi",
      }),
    );
  });

  it("Nên lưu đánh giá thành công khi đáp ứng đầy đủ điều kiện ràng buộc nghiệp vụ", async () => {
    const body = {
      productId: mockProductId,
      sellerId: mockSellerId,
      rating: 5,
      comment: "Cá thu rất ngon và đóng gói đá cẩn thận",
    };

    // Thỏa mãn các điều kiện ràng buộc đầu vào
    (reviewRepository.hasBuyerInteracted as jest.Mock).mockResolvedValue(true);
    (
      reviewRepository.existsByReviewerAndProduct as jest.Mock
    ).mockResolvedValue(false);
    (reviewRepository.create as jest.Mock).mockResolvedValue({
      _id: "mock_review_id_105",
    });
    (userRepository.findRawById as jest.Mock).mockResolvedValue({
      name: "Người mua",
    });
    (productRepository.findById as jest.Mock).mockResolvedValue({
      name: "Cá thu Đồ Sơn",
    });

    const result = await reviewService.addReview(mockReviewerId, body);

    expect(result).toBe("mock_review_id_105");
    expect(reviewRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: mockProductId,
        reviewerId: mockReviewerId,
        sellerId: mockSellerId,
        rating: 5,
        comment: "Cá thu rất ngon và đóng gói đá cẩn thận",
      }),
    );
  });
});

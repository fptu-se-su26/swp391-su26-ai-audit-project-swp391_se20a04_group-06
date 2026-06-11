import { updateUserBadges } from "./badge.service";
import { userRepository } from "../repositories/user.repository";
import { productRepository } from "../repositories/product.repository";
import { reviewRepository } from "../repositories/review.repository";
import { postRepository } from "../repositories/post.repository";

// Giả lập repositories
jest.mock("../repositories/user.repository");
jest.mock("../repositories/product.repository");
jest.mock("../repositories/review.repository");
jest.mock("../repositories/post.repository");
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: Badge Service (badge.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Nên tự động trao danh hiệu dựa trên các cột mốc hoạt động của người dùng", async () => {
    // 1. Đăng trên 5 sản phẩm -> "Lão ngư bám biển"
    (productRepository.countDocuments as jest.Mock).mockResolvedValue(5);
    // 2. Đăng sản phẩm thuộc danh mục "Squid" (Mực) -> "Vua Mực Nháy"
    (productRepository.findOne as jest.Mock).mockResolvedValue({
      _id: "mock_product",
    });
    // 3. Có đánh giá trung bình từ 4.5 trở lên -> "Đệ nhất mẻ tươi"
    (reviewRepository.aggregate as jest.Mock).mockResolvedValue([
      { avgRating: 4.7, totalReviews: 2 },
    ]);
    // 4. Đăng trên 3 bài viết cộng đồng -> "Đại sứ biển khơi"
    (postRepository.countDocuments as jest.Mock).mockResolvedValue(3);
    // 5. Đã viết trên 3 đánh giá mẻ hàng khác -> "Khách quen nhà tàu"
    (reviewRepository.countDocuments as jest.Mock).mockResolvedValue(3);

    const badges = await updateUserBadges(mockUserId);

    // Xác nhận các danh hiệu nhận được khớp với logic cấu hình
    expect(badges).toContain("Lão ngư bám biển");
    expect(badges).toContain("Vua Mực Nháy");
    expect(badges).toContain("Đệ nhất mẻ tươi");
    expect(badges).toContain("Đại sứ biển khơi");
    expect(badges).toContain("Khách quen nhà tàu");

    // Đảm bảo dữ liệu danh hiệu mới được lưu vào tài khoản của người dùng
    expect(userRepository.updateBadges).toHaveBeenCalledWith(
      mockUserId.toString(),
      expect.arrayContaining([
        "Lão ngư bám biển",
        "Vua Mực Nháy",
        "Đệ nhất mẻ tươi",
        "Đại sứ biển khơi",
        "Khách quen nhà tàu",
      ]),
    );
  });
});

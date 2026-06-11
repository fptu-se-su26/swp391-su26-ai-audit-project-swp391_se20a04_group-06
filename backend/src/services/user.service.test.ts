import { userService } from "./user.service";
import { userRepository } from "../repositories/user.repository";
import { reviewRepository } from "../repositories/review.repository";

// Giả lập repositories
jest.mock("../repositories/user.repository");
jest.mock("../repositories/review.repository");
jest.mock("./badge.service", () => ({
  updateUserBadges: jest.fn().mockResolvedValue(["Lão ngư bám biển"]),
}));
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: User Service (user.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ getPublicProfile (Tải hồ sơ công khai)", () => {
    it("Nên báo lỗi 404 nếu không tìm thấy người dùng hoặc tài khoản đang bị khóa", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

      await expect(userService.getPublicProfile(mockUserId)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Không tìm thấy người dùng",
        }),
      );
    });

    it("Nên trả về cấu trúc hồ sơ công khai chính xác kèm theo danh hiệu và điểm đánh giá", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        name: "Trần Văn Dũng",
        email: "dungtv@haisan.vn",
        avatar: "avatar_dung.png",
        isVerified: true,
        isPremium: true,
        isActive: true,
        createdAt: new Date(),
        badges: ["Lão ngư bám biển"],
      });

      // Giả lập điểm đánh giá trung bình 4.5 sao từ 10 lượt nhận xét
      (reviewRepository.aggregate as jest.Mock).mockResolvedValue([
        { avgRating: 4.5, totalReviews: 10 },
      ]);

      const result = await userService.getPublicProfile(mockUserId);

      expect(result).toEqual(
        expect.objectContaining({
          name: "Trần Văn Dũng",
          avgRating: 4.5,
          ratingCount: 10,
          badges: ["Lão ngư bám biển"],
        }),
      );
    });
  });
});

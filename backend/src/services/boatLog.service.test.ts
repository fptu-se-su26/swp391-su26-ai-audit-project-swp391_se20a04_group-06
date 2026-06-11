import { boatLogService } from "./boatLog.service";
import { boatLogRepository } from "../repositories/boatlog.repository";
import { userRepository } from "../repositories/user.repository";

// Giả lập các dependencies
jest.mock("../repositories/boatlog.repository");
jest.mock("../repositories/user.repository");
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: BoatLog Service (boatLog.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockLogId = "60c72b2f9b1d8b2bad000002";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ create (Đăng nhật ký cabin)", () => {
    it("Nên chặn nếu tài khoản thường chưa xác minh và chưa nâng cấp gói Premium", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: false,
        isPremium: false,
        role: "User",
      });

      const logData = { content: "Chuyến ra khơi săn mực đêm" };

      await expect(boatLogService.create(mockUserId, logData)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          message:
            "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh.",
        }),
      );
    });

    it("Nên cho phép đăng nhật ký cabin thành công nếu tài khoản đã mua gói Premium", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: false,
        isPremium: true, // Tài khoản Premium
        role: "User",
      });

      (boatLogRepository.create as jest.Mock).mockResolvedValue({
        _id: mockLogId,
      });

      const logData = { content: "Gió yên biển lặng, kéo mẻ cá song đầu ngày" };
      const result = await boatLogService.create(mockUserId, logData);

      expect(result._id).toBe(mockLogId);
    });
  });
});

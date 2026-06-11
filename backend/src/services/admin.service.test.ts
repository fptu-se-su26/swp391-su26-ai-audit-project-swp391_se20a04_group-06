import { adminService } from "./admin.service";
import { userRepository } from "../repositories/user.repository";

// Giả lập các repositories liên kết
jest.mock("../repositories/user.repository");
jest.mock("../repositories/product.repository");
jest.mock("../repositories/review.repository");
jest.mock("../repositories/message.repository");
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("Unit Test: Admin Service (admin.service.ts)", () => {
  const mockUserId = "60c72b2f9b1d8b2bad000001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Nghiệp vụ bật/tắt kích hoạt tài khoản (toggleUserActive)", () => {
    it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng cần xử lý", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

      await expect(adminService.toggleUserActive(mockUserId)).rejects.toThrow(
        expect.objectContaining({
          status: 404,
          message: "Không tìm thấy người dùng",
        }),
      );
    });

    it("Nên đảo trạng thái hoạt động của tài khoản thành công", async () => {
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isActive: true, // Đang hoạt động
      });

      (userRepository.updateActiveStatus as jest.Mock).mockResolvedValue({
        isActive: false, // Trở thành bị khóa
      });

      const result = await adminService.toggleUserActive(mockUserId);

      expect(result).toBe(false);
      expect(userRepository.updateActiveStatus).toHaveBeenCalledWith(
        mockUserId,
        false,
      );
    });
  });
});

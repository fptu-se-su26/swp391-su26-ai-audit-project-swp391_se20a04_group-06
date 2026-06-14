// Import đối tượng boatLogService cần kiểm thử đơn vị
import { boatLogService } from "./boatLog.service";
// Import đối tượng boatLogRepository để giả lập các phản hồi truy vấn nhật ký
import { boatLogRepository } from "../repositories/boatlog.repository";
// Import đối tượng userRepository để giả lập hồ sơ tài khoản người dùng
import { userRepository } from "../repositories/user.repository";

// Giả lập các dependencies lớp ngoài để tránh liên kết DB thật
jest.mock("../repositories/boatlog.repository");
jest.mock("../repositories/user.repository");
// Giả lập module logger để tránh ghi file nhật ký hệ thống khi chạy ca test
jest.mock("../utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Định nghĩa nhóm kiểm thử đơn vị cho BoatLog Service
describe("Unit Test: BoatLog Service (boatLog.service.ts)", () => {
  // Khởi tạo các ID mẫu cho người dùng và nhật ký
  const mockUserId = "60c72b2f9b1d8b2bad000001";
  const mockLogId = "60c72b2f9b1d8b2bad000002";

  // Hàm chạy trước mỗi ca kiểm thử để dọn dẹp các thiết lập mock cũ
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Nhóm kiểm thử dành cho nghiệp vụ tạo (đăng) nhật ký cabin
  describe("Nghiệp vụ create (Đăng nhật ký cabin)", () => {
    // Ca kiểm thử 1: Chặn người dùng thường chưa xác minh và chưa mua VIP Premium
    it("Nên chặn nếu tài khoản thường chưa xác minh và chưa nâng cấp gói Premium", async () => {
      // Giả lập tìm thấy người dùng có vai trò User thông thường, chưa verified và chưa premium
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: false,
        isPremium: false,
        role: "User",
      });

      // Dữ liệu nội dung nhật ký mẫu muốn đăng tải
      const logData = { content: "Chuyến ra khơi săn mực đêm" };

      // Thực thi hàm tạo và kỳ vọng nó sẽ ném lỗi 403 cảnh báo quyền hạn
      await expect(boatLogService.create(mockUserId, logData)).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          message:
            "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh.",
        }),
      );
    });

    // Ca kiểm thử 2: Cho phép người dùng Premium đăng nhật ký cabin thành công
    it("Nên cho phép đăng nhật ký cabin thành công nếu tài khoản đã mua gói Premium", async () => {
      // Giả lập tìm thấy người dùng chưa verified nhưng đã nâng cấp Premium
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        isVerified: false,
        isPremium: true, // Tài khoản Premium
        role: "User",
      });

      // Giả lập hàm tạo nhật ký ở repository lưu thành công và trả về bản ghi có ID mockLogId
      (boatLogRepository.create as jest.Mock).mockResolvedValue({
        _id: mockLogId,
      });

      // Dữ liệu nội dung nhật ký muốn đăng tải
      const logData = { content: "Gió yên biển lặng, kéo mẻ cá song đầu ngày" };
      // Thực thi hàm tạo nhật ký
      const result = await boatLogService.create(mockUserId, logData);

      // Kỳ vọng kết quả bản ghi được tạo ra có ID khớp với mockLogId
      expect(result._id).toBe(mockLogId);
    });
  });
});

// Import đối tượng userService chứa các nghiệp vụ quản lý thông tin tài khoản người dùng cần kiểm thử
import { userService } from "./user.service";
// Import đối tượng userRepository để giả lập các tương tác cơ sở dữ liệu người dùng
import { userRepository } from "../repositories/user.repository";
// Import đối tượng reviewRepository để giả lập các tương tác cơ sở dữ liệu đánh giá nhận xét
import { reviewRepository } from "../repositories/review.repository";

// Giả lập (mock) toàn bộ module userRepository để cô lập bài test không gọi DB thật
jest.mock("../repositories/user.repository");
// Giả lập (mock) toàn bộ module reviewRepository để tránh truy vấn cơ sở dữ liệu thật
jest.mock("../repositories/review.repository");
// Giả lập dịch vụ badgeService cập nhật danh hiệu để kiểm soát và trả về danh hiệu cố định
jest.mock("./badge.service", () => ({
  // Hàm updateUserBadges luôn trả về danh hiệu "Lão ngư bám biển" dạng Promise đã giải quyết
  updateUserBadges: jest.fn().mockResolvedValue(["Lão ngư bám biển"]),
}));
// Giả lập logger ghi lỗi của hệ thống để tránh hiển thị các thông báo không cần thiết trong bảng log test
jest.mock("../utils/logger", () => ({
  // Đối tượng logger giả lập chứa các hàm thông báo trống
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Khởi tạo khối describe gom nhóm các ca kiểm thử đơn vị cho dịch vụ User Service
describe("Unit Test: User Service (user.service.ts)", () => {
  // Định nghĩa một ID người dùng giả lập dùng chung cho các test case
  const mockUserId = "60c72b2f9b1d8b2bad000001";

  // Hàm dọn dẹp chạy trước mỗi ca kiểm thử đơn lẻ
  beforeEach(() => {
    // Xóa toàn bộ lịch sử gọi hàm của các module mock
    jest.clearAllMocks();
  });

  // Gom nhóm các ca kiểm thử liên quan đến nghiệp vụ tải hồ sơ công khai (getPublicProfile)
  describe("Nghiệp vụ getPublicProfile (Tải hồ sơ công khai)", () => {
    // Ca kiểm thử kiểm tra báo lỗi 404 nếu không tìm thấy người dùng hoặc tài khoản bị khóa
    it("Nên báo lỗi 404 nếu không tìm thấy người dùng hoặc tài khoản đang bị khóa", async () => {
      // Giả lập hàm findRawById trả về null biểu thị không tồn tại người dùng trong hệ thống
      (userRepository.findRawById as jest.Mock).mockResolvedValue(null);

      // Kỳ vọng lời gọi hàm tải hồ sơ công khai sẽ thất bại và ném lỗi 404
      await expect(userService.getPublicProfile(mockUserId)).rejects.toThrow(
        // Kiểm tra lỗi có chứa mã HTTP 404 và nội dung thông báo chính xác
        expect.objectContaining({
          // Mã lỗi HTTP 404 Not Found
          status: 404,
          // Thông điệp báo lỗi chi tiết
          message: "Không tìm thấy người dùng",
        }),
      );
    });

    // Ca kiểm thử kiểm tra trả về đúng cấu trúc hồ sơ công khai khi tài khoản hoạt động bình thường
    it("Nên trả về cấu trúc hồ sơ công khai chính xác kèm theo danh hiệu và điểm đánh giá", async () => {
      // Giả lập hàm tìm kiếm thông tin tài khoản thô trả về đầy đủ thuộc tính người dùng hợp lệ
      (userRepository.findRawById as jest.Mock).mockResolvedValue({
        // ID người dùng khớp giả lập
        _id: mockUserId,
        // Tên hiển thị
        name: "Trần Văn Dũng",
        // Địa chỉ email
        email: "dungtv@haisan.vn",
        // Tên tệp ảnh đại diện
        avatar: "avatar_dung.png",
        // Trạng thái đã xác minh
        isVerified: true,
        // Trạng thái tài khoản Premium
        isPremium: true,
        // Trạng thái tài khoản đang hoạt động
        isActive: true,
        // Ngày tạo tài khoản
        createdAt: new Date(),
        // Danh hiệu hiện có của người dùng
        badges: ["Lão ngư bám biển"],
      });

      // Giả lập điểm đánh giá trung bình 4.5 sao từ tổng cộng 10 lượt nhận xét của người dùng này
      (reviewRepository.aggregate as jest.Mock).mockResolvedValue([
        // Trả về mảng chứa đối tượng kết quả tổng hợp
        { avgRating: 4.5, totalReviews: 10 },
      ]);

      // Gọi nghiệp vụ getPublicProfile từ dịch vụ userService
      const result = await userService.getPublicProfile(mockUserId);

      // Kỳ vọng kết quả trả về khớp với các thông số giả lập bao gồm tên, điểm đánh giá và danh hiệu
      expect(result).toEqual(
        // Đối tượng kết quả chứa các thuộc tính mong muốn
        expect.objectContaining({
          // Tên trùng khớp
          name: "Trần Văn Dũng",
          // Điểm đánh giá trung bình 4.5 sao
          avgRating: 4.5,
          // Số lượt đánh giá nhận xét là 10
          ratingCount: 10,
          // Danh hiệu mảng danh sách huy hiệu
          badges: ["Lão ngư bám biển"],
        }),
      );
    });
  });
});

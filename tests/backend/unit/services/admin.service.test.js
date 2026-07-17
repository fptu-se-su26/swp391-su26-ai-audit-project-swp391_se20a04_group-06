"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng adminService cần được viết kiểm thử đơn vị
const admin_service_1 = require("../../../../backend/src/services/admin.service");
// Import đối tượng userRepository để thực hiện giả lập hành vi dữ liệu
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
// Giả lập các module repositories liên kết để tránh kết nối thật vào cơ sở dữ liệu khi chạy test
jest.mock("../../../../backend/src/repositories/user.repository");
jest.mock("../../../../backend/src/repositories/product.repository");
jest.mock("../../../../backend/src/repositories/review.repository");
jest.mock("../../../../backend/src/repositories/message.repository");
// Giả lập module logger để tránh ghi log ra file khi chạy các ca kiểm thử
jest.mock("../../../../backend/src/utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Định nghĩa nhóm kiểm thử đơn vị cho lớp Admin Service
describe("Unit Test: Admin Service (admin.service.ts)", () => {
    // Định nghĩa một ID người dùng mẫu kiểu ObjectId hợp lệ để sử dụng trong các ca kiểm thử
    const mockUserId = "60c72b2f9b1d8b2bad000001";
    // Hàm chạy trước mỗi ca kiểm thử để làm sạch lịch sử giả lập của các hàm mock
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Nhóm kiểm thử cho tính năng bật/tắt kích hoạt tài khoản
    describe("Nghiệp vụ bật/tắt kích hoạt tài khoản (toggleUserActive)", () => {
        // Ca kiểm thử 1: Ném lỗi 404 khi không tồn tại người dùng trong DB
        it("Nên báo lỗi 404 nếu không tìm thấy thông tin tài khoản người dùng cần xử lý", async () => {
            // Giả lập userRepository.findRawById trả về giá trị null (không tìm thấy người dùng)
            user_repository_1.userRepository.findRawById.mockResolvedValue(null);
            // Thực thi hàm cần test và kỳ vọng hàm sẽ trả ra một lỗi chứa mã status 404 cùng thông báo tương ứng
            await expect(admin_service_1.adminService.toggleUserActive(mockUserId)).rejects.toThrow(expect.objectContaining({
                status: 404,
                message: "Không tìm thấy người dùng",
            }));
        });
        // Ca kiểm thử 2: Đảo trạng thái hoạt động thành công
        it("Nên đảo trạng thái hoạt động của tài khoản thành công", async () => {
            // Giả lập userRepository.findRawById trả về đối tượng người dùng có isActive = true (đang hoạt động)
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                _id: mockUserId,
                isActive: true, // Đang hoạt động
            });
            // Giả lập userRepository.updateActiveStatus trả về trạng thái mới isActive = false (đã bị khóa)
            user_repository_1.userRepository.updateActiveStatus.mockResolvedValue({
                isActive: false, // Trở thành bị khóa
            });
            // Gọi phương thức cần kiểm thử
            const result = await admin_service_1.adminService.toggleUserActive(mockUserId);
            // Kỳ vọng kết quả trả về là false (đã được đảo ngược trạng thái)
            expect(result).toBe(false);
            // Kỳ vọng userRepository.updateActiveStatus đã được gọi với đúng ID người dùng và trạng thái đảo ngược là false
            expect(user_repository_1.userRepository.updateActiveStatus).toHaveBeenCalledWith(mockUserId, false);
        });
    });
});

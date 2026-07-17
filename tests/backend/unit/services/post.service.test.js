"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng postService cần kiểm thử đơn vị
const post_service_1 = require("../../../../backend/src/services/post.service");
// Import đối tượng postRepository để giả lập các hành vi ghi bài viết
const post_repository_1 = require("../../../../backend/src/repositories/post.repository");
// Import đối tượng userRepository để giả lập thông tin tài khoản người viết
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
// Giả lập các dependencies lớp ngoài
jest.mock("../../../../backend/src/repositories/post.repository");
jest.mock("../../../../backend/src/repositories/user.repository");
// Giả lập badge.service để tránh kiểm tra danh hiệu thực tế trong lúc chạy test
jest.mock("../../../../backend/src/services/badge.service", () => ({
    updateUserBadges: jest.fn().mockResolvedValue([]),
}));
// Giả lập logger để tránh ghi nhật ký lỗi ra ngoài
jest.mock("../../../../backend/src/utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Định nghĩa nhóm kiểm thử đơn vị cho Post Service
describe("Unit Test: Post Service (post.service.ts)", () => {
    // Cấu hình ID người dùng và ID bài viết mẫu
    const mockUserId = "60c72b2f9b1d8b2bad000001";
    const mockPostId = "60c72b2f9b1d8b2bad000002";
    // Hàm chạy trước mỗi ca kiểm thử để khôi phục trạng thái mock rỗng
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Nhóm kiểm thử dành cho nghiệp vụ tạo bài viết diễn đàn (create)
    describe("Nghiệp vụ create (Tạo bài viết diễn đàn)", () => {
        // Ca kiểm thử 1: Ném lỗi 404 khi không tồn tại người dùng tương ứng
        it("Nên ném lỗi 404 nếu không tìm thấy thông tin người dùng gửi yêu cầu đăng bài", async () => {
            // Giả lập tìm kiếm người dùng thô trả về null
            user_repository_1.userRepository.findRawById.mockResolvedValue(null);
            // Dữ liệu bài viết diễn đàn mẫu
            const postData = {
                title: "Kinh nghiệm rà neo tránh bão",
                content: "Chia sẻ cho các bác đi biển đêm cách rà neo chuẩn xác để tránh bão dữ dội.",
            };
            // Thực thi hàm tạo và kỳ vọng nhận lỗi 404
            await expect(post_service_1.postService.create(mockUserId, postData)).rejects.toThrow(expect.objectContaining({
                status: 404,
                message: "Không tìm thấy người dùng",
            }));
        });
        // Ca kiểm thử 2: Tạo bài đăng thành công khi tài khoản người dùng hợp lệ
        it("Nên tạo bài viết cộng đồng thành công khi tài khoản người dùng hợp lệ", async () => {
            // Giả lập tìm thấy người dùng có thông tin tên hiển thị và avatar
            user_repository_1.userRepository.findRawById.mockResolvedValue({
                _id: mockUserId,
                name: "Lão Ngư Hải Phòng",
                avatar: "img_avatar.png",
            });
            // Giả lập hàm create ở repository lưu bài viết thành công
            post_repository_1.postRepository.create.mockResolvedValue({
                _id: mockPostId,
                title: "Kinh nghiệm rà neo tránh bão",
            });
            // Dữ liệu bài viết muốn tạo
            const postData = {
                title: "Kinh nghiệm rà neo tránh bão",
                content: "Chia sẻ cho các bác đi biển đêm cách rà neo chuẩn xác để tránh bão dữ dội.",
            };
            // Thực thi hàm tạo bài viết
            const result = await post_service_1.postService.create(mockUserId, postData);
            // Kỳ vọng kết quả bài viết có ID khớp với mockPostId
            expect(result._id).toBe(mockPostId);
        });
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import hàm cập nhật huy hiệu cần được kiểm thử đơn vị
const badge_service_1 = require("../../../../backend/src/services/badge.service");
// Import đối tượng userRepository phục vụ giả lập và kiểm chứng lệnh gọi lưu
const user_repository_1 = require("../../../../backend/src/repositories/user.repository");
// Import đối tượng productRepository để mock số lượng và trạng thái sản phẩm
const product_repository_1 = require("../../../../backend/src/repositories/product.repository");
// Import đối tượng reviewRepository để mock các điểm đánh giá sao và số review đã viết
const review_repository_1 = require("../../../../backend/src/repositories/review.repository");
// Import đối tượng postRepository để mock số bài đăng cộng đồng
const post_repository_1 = require("../../../../backend/src/repositories/post.repository");
// Giả lập các module repositories liên kết để tránh truy cập cơ sở dữ liệu thật
jest.mock("../../../../backend/src/repositories/user.repository");
jest.mock("../../../../backend/src/repositories/product.repository");
jest.mock("../../../../backend/src/repositories/review.repository");
jest.mock("../../../../backend/src/repositories/post.repository");
// Giả lập module logger để tránh in lỗi ra màn hình hoặc ghi file log khi chạy thử nghiệm
jest.mock("../../../../backend/src/utils/logger", () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// Định nghĩa nhóm kiểm thử đơn vị cho Badge Service
describe("Unit Test: Badge Service (badge.service.ts)", () => {
    // Định nghĩa một ID người dùng mẫu
    const mockUserId = "60c72b2f9b1d8b2bad000001";
    // Hàm chạy trước mỗi ca kiểm thử để làm sạch dữ liệu mock cũ
    beforeEach(() => {
        jest.clearAllMocks();
    });
    // Ca kiểm thử chính: Hệ thống tính toán và lưu chính xác các huy hiệu đạt chuẩn
    it("Nên tự động trao danh hiệu dựa trên các cột mốc hoạt động của người dùng", async () => {
        // 1. Giả lập đăng 5 sản phẩm -> thỏa mãn điều kiện huy hiệu "Lão ngư bám biển"
        product_repository_1.productRepository.countDocuments.mockResolvedValue(5);
        // 2. Giả lập tìm thấy sản phẩm danh mục mực đang bán -> thỏa mãn huy hiệu "Vua Mực Nháy"
        product_repository_1.productRepository.findOne.mockResolvedValue({
            _id: "mock_product",
        });
        // 3. Giả lập điểm trung bình rating đạt 4.7 và có 2 đánh giá -> thỏa mãn huy hiệu "Đệ nhất mẻ tươi"
        review_repository_1.reviewRepository.aggregate.mockResolvedValue([
            { avgRating: 4.7, totalReviews: 2 },
        ]);
        // 4. Giả lập đã viết 3 bài viết cộng đồng -> thỏa mãn huy hiệu "Đại sứ biển khơi"
        post_repository_1.postRepository.countDocuments.mockResolvedValue(3);
        // 5. Giả lập đã gửi đi 3 đánh giá bài viết khác -> thỏa mãn huy hiệu "Khách quen nhà tàu"
        review_repository_1.reviewRepository.countDocuments.mockResolvedValue(3);
        // Thực thi hàm nghiệp vụ cập nhật huy hiệu
        const badges = await (0, badge_service_1.updateUserBadges)(mockUserId);
        // Xác nhận kết quả mảng danh hiệu trả về chứa đúng 5 huy hiệu nêu trên
        expect(badges).toContain("Lão ngư bám biển");
        expect(badges).toContain("Vua Mực Nháy");
        expect(badges).toContain("Đệ nhất mẻ tươi");
        expect(badges).toContain("Đại sứ biển khơi");
        expect(badges).toContain("Khách quen nhà tàu");
        // Đảm bảo userRepository.updateBadges được gọi với đúng ID người dùng và danh sách mảng chứa các huy hiệu
        expect(user_repository_1.userRepository.updateBadges).toHaveBeenCalledWith(mockUserId.toString(), expect.arrayContaining([
            "Lão ngư bám biển",
            "Vua Mực Nháy",
            "Đệ nhất mẻ tươi",
            "Đại sứ biển khơi",
            "Khách quen nhà tàu",
        ]));
    });
});

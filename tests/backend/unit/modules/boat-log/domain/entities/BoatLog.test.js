"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import thực thể Domain BoatLog cần được kiểm thử đơn vị
const BoatLog_1 = require("../../../../../../../backend/src/modules/boat-log/domain/entities/BoatLog");
// Khởi chạy nhóm kiểm thử đơn vị dành riêng cho thực thể miền BoatLog Domain Entity
describe("Unit Test: BoatLog Domain Entity", () => {
    // Ca kiểm thử số 1: Đảm bảo không tạo được nhật ký cabin nếu nội dung trống
    it("nên ném ra lỗi nếu nội dung nhật ký trống hoặc chỉ có khoảng trắng", () => {
        // Thực hiện mong đợi ném ra lỗi khi truyền chuỗi nội dung rỗng
        expect(() => {
            // Khởi tạo một thực thể BoatLog mới với nội dung trống ""
            new BoatLog_1.BoatLog({
                // Gán mã người dùng
                userId: "user-1",
                // Gán tên hiển thị của người viết
                userName: "Ngư dân A",
                // Gán ảnh đại diện bằng null
                userAvatar: null,
                // Dữ liệu nội dung trống để kiểm tra lỗi
                content: "",
                // Mảng ảnh đính kèm trống
                images: [],
                // Mảng người thích trống
                likes: [],
            });
            // Mong đợi lỗiValidationError ném ra khớp đúng câu thông báo
        }).toThrow("Nội dung nhật ký cabin không được trống.");
        // Thực hiện mong đợi ném ra lỗi khi truyền chuỗi nội dung chỉ có khoảng trắng
        expect(() => {
            // Khởi tạo một thực thể BoatLog mới với nội dung chỉ chứa khoảng trắng "   "
            new BoatLog_1.BoatLog({
                // Gán mã người dùng
                userId: "user-1",
                // Gán tên hiển thị của người viết
                userName: "Ngư dân A",
                // Gán ảnh đại diện bằng null
                userAvatar: null,
                // Dữ liệu nội dung chứa khoảng trắng để kiểm tra lỗi
                content: "   ",
                // Mảng ảnh đính kèm trống
                images: [],
                // Mảng người thích trống
                likes: [],
            });
            // Mong đợi lỗi ValidationError ném ra khớp đúng câu thông báo
        }).toThrow("Nội dung nhật ký cabin không được trống.");
    });
    // Ca kiểm thử số 2: Đảm bảo tính năng Like/Unlike hoạt động chính xác
    it("nên thực hiện thay đổi trạng thái thích (Like/Unlike) chính xác", () => {
        // Khởi tạo thực thể BoatLog mẫu với dữ liệu hợp lệ ban đầu
        const log = new BoatLog_1.BoatLog({
            // Gán mã người viết nhật ký
            userId: "user-owner",
            // Gán tên hiển thị
            userName: "Ngư dân A",
            // Gán ảnh đại diện
            userAvatar: null,
            // Nội dung nhật ký hợp lệ
            content: "Nhật ký chuyến ra khơi ngày hôm nay trúng đậm cá thu.",
            // Không có ảnh đính kèm
            images: [],
            // Danh sách lượt thích ban đầu trống
            likes: [],
        });
        // Thực thi bật thích lần đầu với ID người dùng "user-fan"
        const firstLike = log.toggleLike("user-fan");
        // Mong đợi kết quả trả về của hàm toggleLike phải là true (đã thích thành công)
        expect(firstLike).toBe(true);
        // Kiểm tra danh sách lượt thích của thực thể bắt buộc phải chứa "user-fan"
        expect(log.likes).toContain("user-fan");
        // Thực thi bấm thích lần thứ hai với cùng ID người dùng "user-fan" (nghĩa là hủy thích)
        const secondLike = log.toggleLike("user-fan");
        // Mong đợi kết quả trả về của hàm toggleLike phải là false (đã hủy thích thành công)
        expect(secondLike).toBe(false);
        // Kiểm tra danh sách lượt thích của thực thể không còn chứa "user-fan" nữa
        expect(log.likes).not.toContain("user-fan");
    });
});

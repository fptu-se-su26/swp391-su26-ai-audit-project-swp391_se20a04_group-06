"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBoatLogUseCase = void 0;
// Import các lỗi miền nghiệp vụ NotFoundError và UnauthorizedError để ném ra khi vi phạm
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Định nghĩa lớp ca sử dụng (Use Case) phụ trách xóa Nhật ký Cabin khỏi hệ thống
class DeleteBoatLogUseCase {
    // Hàm khởi tạo áp dụng cơ chế Dependency Injection để tiêm Repository thích hợp vào
    constructor(boatLogRepository) {
        this.boatLogRepository = boatLogRepository;
    }
    // Phương thức thực thi bất đồng bộ nghiệp vụ xóa nhật ký cabin
    async execute(logId, userId, role) {
        // 1. Truy xuất thực thể nhật ký cabin từ database thông qua ID
        const log = await this.boatLogRepository.findById(logId);
        // Nếu không tồn tại nhật ký nào khớp với ID tìm kiếm
        if (!log) {
            // Ném lỗi NotFoundError báo không tìm thấy bài nhật ký tương ứng
            throw new DomainException_1.NotFoundError("Không tìm thấy nhật ký cabin");
        }
        // 2. Kiểm duyệt phân quyền xóa: Chỉ cho phép Quản trị viên (Admin) hoặc chính chủ sở hữu bài nhật ký
        if (role !== "Admin" && log.userId !== userId) {
            // Ném lỗi UnauthorizedError báo không có quyền thực hiện xóa bài viết của người khác
            throw new DomainException_1.UnauthorizedError("Bạn không có quyền xóa nhật ký này");
        }
        // 3. Thực thi hành động xóa nhật ký cabin khỏi database thông qua Repository Adapter
        await this.boatLogRepository.delete(log);
    }
}
exports.DeleteBoatLogUseCase = DeleteBoatLogUseCase;

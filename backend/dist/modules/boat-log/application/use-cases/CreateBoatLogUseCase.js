"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBoatLogUseCase = void 0;
// Import thực thể Domain BoatLog phục vụ khởi tạo đối tượng nhật ký cabin mới
const BoatLog_1 = require("../../domain/entities/BoatLog");
// Import userRepository dùng chung để lấy dữ liệu thô của người dùng từ MongoDB
const user_repository_1 = require("../../../../repositories/user.repository");
// Import các ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để kiểm duyệt và xử lý lỗi
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Định nghĩa lớp ca sử dụng (Use Case) để thực thi nghiệp vụ đăng tải Nhật ký Cabin mới
class CreateBoatLogUseCase {
    // Hàm khởi tạo áp dụng Dependency Injection để tiêm Repository vào Use Case
    constructor(boatLogRepository) {
        this.boatLogRepository = boatLogRepository;
    }
    // Phương thức thực thi bất đồng bộ nghiệp vụ đăng ký Nhật ký Cabin
    async execute(userId, dto) {
        // 1. Tìm thông tin chi tiết của người dùng đang gửi yêu cầu từ database
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tìm thấy thông tin người dùng trong DB
        if (!user) {
            // Ném lỗi NotFoundError báo tài khoản không tồn tại
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        }
        // 2. Kiểm duyệt phân quyền: Chỉ dành cho ngư dân đã xác minh, tài khoản Premium hoặc Quản trị viên
        if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
            // Ném lỗi UnauthorizedError nếu người dùng không đủ điều kiện phân quyền nghiệp vụ
            throw new DomainException_1.UnauthorizedError("Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh hoặc Premium.");
        }
        // 3. Khởi tạo một thực thể miền Domain BoatLog mới với dữ liệu đã được cấu trúc
        const boatLog = new BoatLog_1.BoatLog({
            // Gán mã ID người dùng
            userId,
            // Gán tên hiển thị của người viết lấy trực tiếp từ DB
            userName: user.name,
            // Gán ảnh đại diện của người viết (mặc định null nếu trống)
            userAvatar: user.avatar || null,
            // Gán nội dung nhật ký cabin
            content: dto.content,
            // Gán danh sách mảng ảnh đính kèm (mặc định mảng rỗng nếu trống)
            images: dto.images || [],
            // Thiết lập danh sách lượt thích ban đầu là mảng rỗng
            likes: [],
        });
        // 4. Lưu thực thể BoatLog vừa khởi tạo thành công xuống cơ sở dữ liệu qua Repository Adapter
        await this.boatLogRepository.save(boatLog);
        // Trả về đối tượng thực thể BoatLog sau khi đã lưu trữ thành công
        return boatLog;
    }
}
exports.CreateBoatLogUseCase = CreateBoatLogUseCase;

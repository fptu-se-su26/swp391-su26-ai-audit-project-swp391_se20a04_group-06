"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boatLogService = void 0;
// Import đối tượng boatLogRepository để thực hiện các thao tác CRUD trên nhật ký cabin
const boatlog_repository_1 = require("../repositories/boatlog.repository");
// Import đối tượng userRepository để truy vấn thông tin tài khoản người dùng
const user_repository_1 = require("../repositories/user.repository");
// Import lớp lỗi HttpError phục vụ ném lỗi kèm mã trạng thái
const HttpError_1 = require("../errors/HttpError");
// Import hàm helper parseId để xác định tính hợp lệ của chuỗi ID dạng ObjectId
const response_helper_1 = require("../helpers/response.helper");
// Xuất đối tượng boatLogService chứa logic nghiệp vụ quản lý nhật ký đi biển
exports.boatLogService = {
    // Nghiệp vụ lấy danh sách nhật ký đi biển có phân trang và lọc theo userId (nếu có)
    async list(query) {
        // Chuyển đổi tham số trang page sang kiểu số nguyên, mặc định là 1
        const page = parseInt(query.page || "1", 10);
        // Chuyển đổi giới hạn phần tử limit sang kiểu số nguyên, mặc định là 12
        const limit = parseInt(query.limit || "12", 10);
        // Tính số bản ghi bỏ qua skip dựa theo trang hiện tại và giới hạn mỗi trang
        const skip = (page - 1) * limit;
        // Khởi tạo đối tượng bộ lọc trống
        const filter = {};
        // Nếu có truyền ID người dùng để lọc nhật ký của riêng người dùng đó
        if (query.userId) {
            // Sử dụng parseId để kiểm tra xem ID người dùng có đúng định dạng MongoDB ObjectId không
            if ((0, response_helper_1.parseId)(query.userId)) {
                // Gán ID người dùng vào bộ lọc
                filter.userId = query.userId;
            }
            else {
                // Ném lỗi 400 nếu ID không hợp lệ
                throw new HttpError_1.HttpError(400, "ID người dùng không hợp lệ");
            }
        }
        // Gọi repository lấy danh sách nhật ký và tổng số bản ghi khớp bộ lọc
        const { boatLogs, total } = await boatlog_repository_1.boatLogRepository.findAll(filter, skip, limit);
        // Trả về dữ liệu danh sách nhật ký kèm theo thông tin phân trang
        return {
            boatLogs,
            page,
            limit,
            total,
            // Tính tổng số trang bằng cách chia trần (Math.ceil)
            totalPages: Math.ceil(total / limit),
        };
    },
    // Nghiệp vụ tạo mới một bài đăng nhật ký cabin đi biển
    async create(userId, data) {
        // Tìm tài liệu tài khoản người dùng thô trong DB theo ID
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tìm thấy, ném lỗi 404
        if (!user)
            throw new HttpError_1.HttpError(404, "Không tìm thấy người dùng");
        // Chỉ cho phép ngư dân đã xác minh (tích xanh), hoặc tài khoản Premium VIP, hoặc Admin được đăng nhật ký cabin
        if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
            throw new HttpError_1.HttpError(403, "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh.");
        }
        // Gọi repository để tiến hành tạo mới một nhật ký cabin lưu vào DB
        return boatlog_repository_1.boatLogRepository.create({
            userId,
            userName: user.name, // Đồng bộ tên hiển thị
            userAvatar: user.avatar || null, // Đồng bộ ảnh đại diện
            content: data.content,
            images: data.images || [], // Danh sách ảnh đính kèm (hoặc mảng rỗng nếu không có)
        });
    },
    // Nghiệp vụ bật/tắt lượt thích (like/unlike) cho bài nhật ký cabin
    async toggleLike(logId, userId) {
        // Tìm thông tin nhật ký cabin theo ID bài viết
        const log = await boatlog_repository_1.boatLogRepository.findById(logId);
        // Nếu không tồn tại bài viết, ném lỗi 404
        if (!log)
            throw new HttpError_1.HttpError(404, "Không tìm thấy nhật ký cabin");
        // Tìm vị trí ID người dùng trong mảng likes của bài nhật ký
        const index = log.likes.indexOf(userId);
        let liked = false;
        let updatedLog;
        // Nếu người dùng chưa từng thích bài viết này (không tìm thấy trong mảng likes)
        if (index === -1) {
            // Gọi repository để thêm lượt thích
            updatedLog = await boatlog_repository_1.boatLogRepository.addLike(logId, userId);
            liked = true; // Trạng thái là đã thích
        }
        else {
            // Ngược lại, gọi repository để hủy lượt thích
            updatedLog = await boatlog_repository_1.boatLogRepository.removeLike(logId, userId);
        }
        // Trả về trạng thái lượt thích mới và tổng số lượt thích hiện tại của bài viết
        return { liked, likeCount: updatedLog?.likes.length || 0 };
    },
    // Nghiệp vụ xóa bài viết nhật ký cabin
    async delete(logId, userId, role) {
        // Tìm kiếm nhật ký cabin theo ID
        const log = await boatlog_repository_1.boatLogRepository.findById(logId);
        // Nếu không tìm thấy nhật ký tương ứng, ném lỗi 404
        if (!log)
            throw new HttpError_1.HttpError(404, "Không tìm thấy nhật ký cabin");
        // Nếu không phải là Admin và người yêu cầu xóa không phải là chủ nhân của bài nhật ký
        if (role !== "Admin" && log.userId.toString() !== userId) {
            // Chặn quyền và ném lỗi 403
            throw new HttpError_1.HttpError(403, "Bạn không có quyền xóa nhật ký này");
        }
        // Gọi repository thực thi tác vụ xóa nhật ký cabin khỏi DB
        await boatlog_repository_1.boatLogRepository.delete(logId);
    },
};

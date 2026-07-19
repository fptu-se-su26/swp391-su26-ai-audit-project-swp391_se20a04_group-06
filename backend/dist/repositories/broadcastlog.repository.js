"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastLogRepository = void 0;
// Import mô hình BroadcastLog và giao diện IBroadcastLog để tương tác dữ liệu và định nghĩa kiểu dữ liệu
const BroadcastLog_1 = require("../models/BroadcastLog");
// Import thư viện mongoose để thực hiện chuyển đổi kiểu dữ liệu ID sang ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Xuất ra đối tượng broadcastLogRepository chứa các phương thức tương tác cơ sở dữ liệu cho thông báo phát sóng
exports.broadcastLogRepository = {
    // Phương thức bất đồng bộ tạo mới một bản ghi lịch sử phát sóng thông báo từ quản trị viên
    async create(data) {
        if (!data.adminId || !mongoose_1.default.Types.ObjectId.isValid(data.adminId)) {
            throw new Error("Mã quản trị viên (adminId) không hợp lệ");
        }
        // Khởi tạo một đối tượng tài liệu BroadcastLog mới từ dữ liệu đầu vào
        const log = new BroadcastLog_1.BroadcastLog({
            // Ép kiểu chuỗi adminId sang ObjectId của MongoDB để lưu trữ đúng định dạng quan hệ
            adminId: new mongoose_1.default.Types.ObjectId(data.adminId),
            // Gán nội dung thông báo
            content: data.content,
            // Gán đối tượng vai trò đích nhận thông báo
            targetRole: data.targetRole,
            // Gán số lượng người đã gửi thông báo thành công
            sentCount: data.sentCount,
        });
        // Gọi phương thức save của Mongoose document để lưu tài liệu mới xuống database và trả về kết quả
        return log.save();
    },
    // Phương thức bất đồng bộ truy vấn danh sách lịch sử phát sóng thông báo gần đây nhất
    async findRecent(limit = 20) {
        // Thực hiện tìm kiếm trong bộ sưu tập BroadcastLog
        return BroadcastLog_1.BroadcastLog.find()
            // Sắp xếp theo ngày tạo giảm dần (mới nhất xếp lên đầu)
            .sort({ createdAt: -1 })
            // Giới hạn số lượng bản ghi trả về (mặc định lấy tối đa 20 bản ghi)
            .limit(limit)
            // Sử dụng .lean() để chuyển đổi kết quả trả về từ Mongoose Document sang Javascript Object trơn giúp tối ưu bộ nhớ
            .lean();
    },
};

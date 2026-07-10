"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.broadcastNotification = broadcastNotification;
exports.getBroadcastHistory = getBroadcastHistory;
exports.markAllAsRead = markAllAsRead;
exports.markSingleAsRead = markSingleAsRead;
// Import notificationRepository để thao tác với dữ liệu thông báo trong Database
const notification_repository_1 = require("../repositories/notification.repository");
// Import broadcastLogRepository để thao tác ghi nhận lịch sử gửi thông báo hàng loạt của Admin
const broadcastlog_repository_1 = require("../repositories/broadcastlog.repository");
// Import hàm dịch vụ gửi thông báo hàng loạt (broadcast) từ notification service
const notification_service_1 = require("../services/notification.service");
// Import helper gửi phản hồi lỗi server và chuẩn hóa phân tích ID
const response_helper_1 = require("../helpers/response.helper");
// Import helper phân tích tham số phân trang
const pagination_1 = require("../utils/pagination");
// Import thư viện Mongoose để tương tác trực tiếp với ObjectId và database
const mongoose_1 = __importDefault(require("mongoose"));
// Import Model Mongoose của thực thể Thông báo
const Notification_1 = require("../models/Notification");
/**
 * HÀM LẤY DANH SÁCH THÔNG BÁO CỦA NGƯỜI DÙNG ĐANG LOG IN (CÓ PHÂN TRANG)
 */
async function getNotifications(req, res) {
    // Lấy ID người dùng hiện tại từ token xác thực
    const { userId } = req.user;
    // Sử dụng hệ thống phân trang chuẩn hóa để phân tích tham số page/limit từ URL Query String (mặc định limit tối đa 100)
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit, 100);
    try {
        // Tìm các thông báo của người dùng cụ thể, sắp xếp theo thời gian tạo mới nhất trước (sort createdAt -1)
        // Áp dụng offset và limit để phân trang ở tầng database
        const notifications = await Notification_1.Notification.find({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
        // Đếm tổng số lượng thông báo của người dùng này để phục vụ việc tính toán tổng số trang
        const total = await Notification_1.Notification.countDocuments({
            userId: new mongoose_1.default.Types.ObjectId(userId),
        });
        // Chuyển đổi dữ liệu thô sang định dạng DTO gửi về Client (chuẩn hóa các trường và convert ObjectId sang string)
        const formattedRows = notifications.map((n) => ({
            id: n._id.toString(),
            type: n.type,
            content: n.content,
            isRead: n.isRead ? 1 : 0, // Client biểu diễn trạng thái đọc là 1 (đã đọc) hoặc 0 (chưa đọc)
            createdAt: n.createdAt,
            productId: n.productId?.toString() || null,
            landingBatchId: n.landingBatchId?.toString() || null,
            reviewId: n.reviewId?.toString() || null,
        }));
        // Phản hồi kết quả phân trang chuẩn hóa cho Client
        return res.json({
            data: formattedRows,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Tập hợp các vai trò người nhận thông báo hợp lệ khi Admin gửi broadcast
const VALID_TARGET_ROLES = new Set(["all", "Seller", "Buyer"]);
/**
 * HÀM ADMIN PHÁT THÔNG BÁO HÀNG LOẠT (BROADCAST) TỚI HỆ THỐNG / NHÓM NGƯỜI DÙNG
 */
async function broadcastNotification(req, res) {
    // Lấy ID của Admin thực hiện hành động
    const { userId } = req.user;
    // Lấy nội dung thông báo và đối tượng người nhận (mặc định là "all" - tất cả mọi người)
    const { content, targetRole = "all" } = req.body;
    // Validate: kiểm tra nội dung không được bỏ trống
    if (!content?.trim())
        return res
            .status(400)
            .json({ message: "Nội dung thông báo không được để trống" });
    // Validate: giới hạn độ dài nội dung tối đa 200 ký tự để giao diện hiển thị tối ưu
    if (content.trim().length > 200)
        return res.status(400).json({ message: "Nội dung tối đa 200 ký tự" });
    // Validate: kiểm tra nhóm vai trò nhận thông báo có hợp lệ hay không
    if (!VALID_TARGET_ROLES.has(targetRole))
        return res.status(400).json({ message: "Đối tượng nhận không hợp lệ" });
    try {
        // Gọi hàm dịch vụ để phát thông báo tới tất cả user thỏa mãn điều kiện và lưu log hành động
        const result = await (0, notification_service_1.broadcastToUsers)({
            adminId: userId,
            content: content.trim(),
            targetRole,
        });
        // Phản hồi kết quả gửi broadcast (ví dụ: { success: true, sentCount: x })
        return res.json(result);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY LỊCH SỬ CÁC LẦN PHÁT THÔNG BÁO HÀNG LOẠT CỦA ADMIN
 */
async function getBroadcastHistory(req, res) {
    try {
        // Tìm kiếm các bản ghi lịch sử gửi thông báo hàng loạt gần đây nhất
        const logs = await broadcastlog_repository_1.broadcastLogRepository.findRecent();
        // Định dạng lại dữ liệu thô và trả về mảng lịch sử dạng JSON
        return res.json(logs.map((l) => ({
            id: l._id.toString(),
            content: l.content,
            targetRole: l.targetRole,
            sentCount: l.sentCount,
            createdAt: l.createdAt,
        })));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM ĐÁNH DẤU TẤT CẢ THÔNG BÁO CỦA NGƯỜI DÙNG LÀ ĐÃ ĐỌC
 */
async function markAllAsRead(req, res) {
    // Lấy ID người dùng hiện tại
    const { userId } = req.user;
    try {
        // Gọi repository cập nhật cờ isRead = true cho toàn bộ thông báo chưa đọc của người dùng này
        await notification_repository_1.notificationRepository.markAllAsRead(userId);
        // Trả về thông điệp thành công
        return res.json({ message: "Đã đánh dấu đọc toàn bộ thông báo" });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM ĐÁNH DẤU ĐỌC MỘT THÔNG BÁO CỤ THỂ
 */
async function markSingleAsRead(req, res) {
    // Lấy ID người dùng hiện tại
    const { userId } = req.user;
    // Trích xuất ID thông báo cần cập nhật từ tham số đường dẫn URL (:id)
    const notifId = (0, response_helper_1.parseId)(req.params.id);
    // Kiểm tra tính hợp lệ của ID thông báo
    if (!notifId)
        return res.status(400).json({ message: "ID thông báo không hợp lệ" });
    try {
        // Tìm kiếm thông báo dựa trên ID và xác minh quyền sở hữu (userId phải trùng khớp)
        const notif = await notification_repository_1.notificationRepository.findOne(notifId, userId);
        // Nếu không tìm thấy thông báo nào khớp, trả về lỗi 404
        if (!notif)
            return res.status(404).json({ message: "Không tìm thấy thông báo" });
        // Đổi trạng thái đọc sang true và lưu vào cơ sở dữ liệu
        notif.isRead = true;
        await notif.save();
        // Phản hồi kết quả đánh dấu thành công dạng JSON
        return res.json({ message: "Đã đánh dấu đọc thông báo" });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

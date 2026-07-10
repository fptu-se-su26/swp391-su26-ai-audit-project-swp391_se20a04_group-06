"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToUsers = broadcastToUsers;
exports.notifyFollowersNewProduct = notifyFollowersNewProduct;
exports.notifyFollowersNewLandingBatch = notifyFollowersNewLandingBatch;
exports.notifySellerNewReview = notifySellerNewReview;
// Import hàm getIO để gửi thông báo thời gian thực qua socket
const socket_1 = require("../socket");
// Import đối tượng notificationRepository để lưu trữ thông báo vào cơ sở dữ liệu
const notification_repository_1 = require("../repositories/notification.repository");
// Import đối tượng broadcastLogRepository để ghi lại nhật ký phát sóng thông báo hàng loạt của Admin
const broadcastlog_repository_1 = require("../repositories/broadcastlog.repository");
// Import đối tượng logger phục vụ việc ghi nhận lỗi hệ thống
const logger_1 = require("../utils/logger");
// Import thư viện mongoose để ép kiểu ID dạng ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Import mô hình Mongoose User để truy vấn danh sách người dùng hiệu năng cao
const User_1 = require("../models/User");
// Hàm xử lý nghiệp vụ phát thông báo hàng loạt (broadcast) từ Admin đến toàn bộ hoặc một nhóm đối tượng người dùng
async function broadcastToUsers(params) {
    const { adminId, content, targetRole } = params;
    // Xác định bộ lọc query dựa theo vai trò đích nhận thông báo
    const query = targetRole === "all" ? { role: { $ne: "Admin" } } : { role: targetRole }; // Nếu là 'all' thì gửi đến tất cả ngoại trừ Admin
    // [FIX PERFORMANCE 3] Sử dụng Lean Queries để tránh rò rỉ bộ nhớ (RAM Leak), chỉ lấy trường _id
    const recipients = await User_1.User.find(query).select("_id").lean();
    // Tổng số lượng người nhận được
    const sentCount = recipients.length;
    // Nếu có ít nhất một người nhận phù hợp
    if (sentCount > 0) {
        // Tạo danh sách tài liệu thông báo tương ứng cho từng người nhận
        const docs = recipients.map((u) => ({
            userId: u._id,
            type: "broadcast",
            content,
            isRead: false,
        }));
        // Lưu hàng loạt thông báo vào database thông qua repository
        const inserted = await notification_repository_1.notificationRepository.insertMany(docs);
        // Ánh xạ danh sách ID thông báo vừa tạo vào một Map để tra cứu bằng userId
        const idByUser = new Map(inserted.map((n, i) => [
            recipients[i]._id.toString(),
            n._id.toString(),
        ]));
        // Lấy đối tượng Socket Server
        const io = (0, socket_1.getIO)();
        // Vòng lặp gửi thông báo thời gian thực cho từng người dùng qua phòng cá nhân socket `user_{userId}`
        for (const u of recipients) {
            const uid = u._id.toString();
            io.to(`user_${uid}`).emit("notification", {
                id: idByUser.get(uid),
                type: "broadcast",
                preview: content,
            });
        }
    }
    // Tạo một bản ghi lịch sử phát sóng thông báo của admin vào DB
    const log = await broadcastlog_repository_1.broadcastLogRepository.create({
        adminId,
        content,
        targetRole,
        sentCount,
    });
    // Trả về số lượng người gửi thành công và thông tin bản ghi phát sóng vừa lưu
    return {
        sentCount,
        broadcast: {
            id: log._id.toString(),
            content: log.content,
            targetRole: log.targetRole,
            sentCount: log.sentCount,
            createdAt: log.createdAt,
        },
    };
}
// Hàm nghiệp vụ tự động gửi thông báo đến toàn bộ những người theo dõi (followers) khi ngư dân đăng bán mẻ hải sản mới
async function notifyFollowersNewProduct(sellerId, // ID người bán đăng sản phẩm
sellerName, // Tên người bán
productId, // ID sản phẩm vừa tạo
productName) {
    try {
        // [FIX PERFORMANCE 3] Tìm danh sách những người dùng đang theo dõi người bán này, chỉ lấy ID dạng lean
        const followers = await User_1.User.find({
            following: new mongoose_1.default.Types.ObjectId(sellerId),
        })
            .select("_id")
            .lean();
        // Nếu không có ai theo dõi ngư dân này thì kết thúc sớm
        if (followers.length === 0)
            return;
        // Thiết lập nội dung văn bản hiển thị trước của thông báo
        const previewText = `${sellerName} vừa đăng mẻ hải sản mới: ${productName}`;
        // Lấy server socket
        const io = (0, socket_1.getIO)();
        // Tạo mảng tài liệu thông báo để lưu vào database
        const docs = followers.map((f) => ({
            userId: f._id,
            type: "new_product",
            content: previewText,
            productId: new mongoose_1.default.Types.ObjectId(productId),
        }));
        // Lưu đồng loạt danh sách thông báo vào DB
        const inserted = await notification_repository_1.notificationRepository.insertMany(docs);
        // Ánh xạ ID thông báo vừa lưu vào Map để tra cứu bằng ID của follower
        const idByFollower = new Map(inserted.map((n, i) => [
            followers[i]._id.toString(),
            n._id.toString(),
        ]));
        // Gửi thông báo thời gian thực qua socket cho từng người theo dõi
        for (const f of followers) {
            const fId = f._id.toString();
            io.to(`user_${fId}`).emit("notification", {
                id: idByFollower.get(fId),
                type: "new_product",
                productId,
                sellerId,
                preview: previewText,
            });
        }
    }
    catch (err) {
        // Ghi log lỗi nếu quá trình lưu hoặc phát thông báo gặp sự cố
        logger_1.logger.error("Lỗi khi lưu/phát thông báo sản phẩm mới:", {
            message: err.message,
        });
    }
}
async function notifyFollowersNewLandingBatch(params) {
    const { sellerId, sellerName, landingBatchId, productCount } = params;
    try {
        const followers = await User_1.User.find({
            following: new mongoose_1.default.Types.ObjectId(sellerId),
        })
            .select("_id")
            .lean();
        if (followers.length === 0)
            return;
        const previewText = `${sellerName} vừa cập bến vựa cá mới gồm ${productCount} loại hải sản.`;
        const docs = followers.map((follower) => ({
            userId: follower._id,
            type: "new_landing_batch",
            content: previewText,
            landingBatchId: new mongoose_1.default.Types.ObjectId(landingBatchId),
        }));
        const inserted = await notification_repository_1.notificationRepository.insertMany(docs);
        const io = (0, socket_1.getIO)();
        followers.forEach((follower, index) => {
            io.to(`user_${follower._id.toString()}`).emit("notification", {
                id: inserted[index]._id.toString(),
                type: "new_landing_batch",
                landingBatchId,
                sellerId,
                preview: previewText,
                createdAt: inserted[index].createdAt,
            });
        });
    }
    catch (err) {
        logger_1.logger.error("Lỗi khi lưu/phát thông báo vựa cá mới:", {
            message: err.message,
        });
    }
}
// Hàm nghiệp vụ tự động gửi thông báo đến người bán khi có một người mua gửi đánh giá (review) mới
async function notifySellerNewReview(params) {
    const { sellerId, reviewerName, productName, productId, reviewId, rating, comment, } = params;
    // Xây dựng chuỗi nội dung văn bản thông báo, cắt bớt bình luận nếu quá dài
    const previewText = `${reviewerName} đã đánh giá ${rating}⭐ cho "${productName}": ` +
        `"${comment ? comment.slice(0, 40) : "Không có nhận xét"}"`;
    try {
        // Tạo và lưu thông báo mới vào database
        const notif = await notification_repository_1.notificationRepository.create({
            userId: new mongoose_1.default.Types.ObjectId(sellerId),
            type: "new_review",
            content: previewText,
            productId: new mongoose_1.default.Types.ObjectId(productId),
            reviewId: new mongoose_1.default.Types.ObjectId(reviewId),
        });
        // Phát thông báo trực tiếp thời gian thực cho người bán qua socket
        (0, socket_1.getIO)().to(`user_${sellerId}`).emit("notification", {
            id: notif._id.toString(),
            type: "new_review",
            productId,
            sellerId,
            reviewId,
            preview: previewText,
        });
    }
    catch (err) {
        // Ghi log lỗi nếu quá trình lưu hoặc phát thông báo gặp sự cố
        logger_1.logger.error("Lỗi khi lưu và phát thông báo đánh giá:", {
            message: err.message,
        });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPublicProfile = getUserPublicProfile;
exports.getFishermanLeaderboard = getFishermanLeaderboard;
// Import userService chứa logic liên quan đến thông tin người dùng
const user_service_1 = require("../services/user.service");
// Import helper gửi lỗi và parse ID từ response helper
const response_helper_1 = require("../helpers/response.helper");
/**
 * HÀM LẤY HỒ SƠ CÔNG KHAI CỦA MỘT NGƯỜI DÙNG (PUBLIC PROFILE)
 */
async function getUserPublicProfile(req, res) {
    // Trích xuất và phân tích cú pháp ID người dùng từ tham số URL (:id)
    const id = (0, response_helper_1.parseId)(req.params.id);
    // Validate: Kiểm tra tính hợp lệ của ID người dùng
    if (!id)
        return res.status(400).json({ message: "ID không hợp lệ" });
    try {
        // Gọi service để lấy thông tin hồ sơ công khai (chỉ chứa tên, avatar, ngày tạo... không chứa thông tin nhạy cảm)
        const profile = await user_service_1.userService.getPublicProfile(id);
        // Trả về thông tin hồ sơ dạng JSON cho Client
        return res.json(profile);
    }
    catch (err) {
        // Trả về lỗi nghiệp vụ nếu có định nghĩa sẵn status code
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        // Trả về lỗi server 500 nếu gặp sự cố bất ngờ
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY BẢNG XẾP HẠNG NGƯ DÂN UY TÍN (LEADERBOARD)
 */
async function getFishermanLeaderboard(req, res) {
    try {
        // Gọi service lấy danh sách bảng xếp hạng các ngư dân hoạt động tích cực/uy tín nhất
        const leaderboard = await user_service_1.userService.getFishermanLeaderboard();
        // Trả về dữ liệu bảng xếp hạng dạng JSON cho Client
        return res.json(leaderboard);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

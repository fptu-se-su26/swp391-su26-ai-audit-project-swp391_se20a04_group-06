"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyFavorites = getMyFavorites;
exports.getMyFavoriteIds = getMyFavoriteIds;
exports.toggleFavorite = toggleFavorite;
// Import favoriteService chứa các nghiệp vụ xử lý danh sách yêu thích
const favorite_service_1 = require("../services/favorite.service");
// Import userRepository để truy vấn trực tiếp thông tin người dùng từ cơ sở dữ liệu
const user_repository_1 = require("../repositories/user.repository");
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
const response_helper_1 = require("../helpers/response.helper");
/**
 * HÀM LẤY DANH SÁCH SẢN PHẨM YÊU THÍCH CỦA TÀI KHOẢN HIỆN TẠI
 */
async function getMyFavorites(req, res) {
    // Lấy ID người dùng hiện tại đã được giải mã từ JWT token thông qua middleware xác thực
    const { userId } = req.user;
    try {
        // Gọi service để truy vấn danh sách thông tin chi tiết các sản phẩm đã yêu thích
        const favorites = await favorite_service_1.favoriteService.getMyFavorites(userId);
        // Trả về danh sách sản phẩm yêu thích dưới dạng JSON cho Client
        return res.json(favorites);
    }
    catch (err) {
        // Nếu có mã trạng thái lỗi cụ thể (lỗi nghiệp vụ từ UseCase/Service)
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        // Trả về lỗi server 500 chuẩn hóa nếu gặp lỗi không xác định
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY DANH SÁCH ID CỦA CÁC SẢN PHẨM ĐÃ YÊU THÍCH (Dùng để kiểm tra nhanh trạng thái thả tim trên UI)
 */
async function getMyFavoriteIds(req, res) {
    // Lấy ID người dùng hiện tại từ thông tin xác thực của Request
    const { userId } = req.user;
    try {
        // Tìm kiếm thông tin thô của người dùng dựa trên ID
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu tìm thấy người dùng thì trả về mảng ID sản phẩm đã yêu thích, ngược lại trả về mảng rỗng
        return res.json(user ? user.favorites : []);
    }
    catch (err) {
        // Trả về lỗi server 500 nếu gặp sự cố truy vấn
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM BẬT/TẮT YÊU THÍCH MỘT SẢN PHẨM (THẢ TIM / BỎ THẢ TIM)
 */
async function toggleFavorite(req, res) {
    // Lấy ID người dùng hiện tại từ thông tin xác thực
    const { userId } = req.user;
    // Lấy ID sản phẩm cần bật/tắt yêu thích từ tham số trên URL (:productId)
    const { productId } = req.params;
    try {
        // Gọi service thực hiện việc bật/tắt yêu thích (thêm vào hoặc xóa khỏi mảng favorites)
        const result = await favorite_service_1.favoriteService.toggleFavorite(userId, productId);
        // Trả về kết quả xử lý (ví dụ: { favorited: true/false }) cho Client
        return res.json(result);
    }
    catch (err) {
        // Nếu có lỗi nghiệp vụ định nghĩa sẵn status, gửi trả client kèm thông điệp tương ứng
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        // Trả về lỗi server 500 nếu có sự cố bất ngờ
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

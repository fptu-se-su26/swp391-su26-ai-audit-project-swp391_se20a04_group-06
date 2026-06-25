"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFollow = toggleFollow;
exports.checkFollow = checkFollow;
exports.getFollowing = getFollowing;
exports.getFollowers = getFollowers;
// Import followService thực hiện nghiệp vụ theo dõi/hủy theo dõi
const follow_service_1 = require("../services/follow.service");
// Import userRepository để thao tác và truy vấn trực tiếp với collection người dùng
const user_repository_1 = require("../repositories/user.repository");
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
const response_helper_1 = require("../helpers/response.helper");
// Import thư viện Mongoose để làm việc với các kiểu dữ liệu ID của MongoDB (ObjectId)
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * HÀM BẬT/TẮT THEO DÕI MỘT NGƯỜI BÁN (FOLLOW / UNFOLLOW)
 */
async function toggleFollow(req, res) {
    // Lấy ID người dùng hiện tại đang đăng nhập từ middleware xác thực
    const { userId } = req.user;
    // Lấy ID của người bán từ tham số đường dẫn (:sellerId)
    const { sellerId } = req.params;
    try {
        // Gọi service thực hiện việc bật/tắt theo dõi giữa 2 tài khoản
        const result = await follow_service_1.followService.toggleFollow(userId, sellerId);
        // Trả về kết quả (thông điệp thành công/trạng thái mới) dưới dạng JSON
        return res.json(result);
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
 * HÀM KIỂM TRA XEM TÀI KHOẢN HIỆN TẠI CÓ ĐANG THEO DÕI NGƯỜI BÁN NÀY KHÔNG
 */
async function checkFollow(req, res) {
    // Lấy ID người dùng hiện tại
    const { userId } = req.user;
    // Lấy ID người bán cần kiểm tra từ tham số đường dẫn
    const { sellerId } = req.params;
    try {
        // Gọi repository kiểm tra xem mối quan hệ theo dõi có tồn tại hay không
        const isFollowing = await user_repository_1.userRepository.isFollowing(userId, sellerId);
        // Trả về kết quả kiểu boolean ({ isFollowing: true/false })
        return res.json({ isFollowing });
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY DANH SÁCH NHỮNG NGƯỜI DÙNG MÀ TÀI KHOẢN HIỆN TẠI ĐANG THEO DÕI (ĐANG FOLLOW)
 */
async function getFollowing(req, res) {
    // Lấy ID người dùng hiện tại từ token xác thực
    const { userId } = req.user;
    try {
        // Tìm thông tin hồ sơ thô của người dùng hiện tại để lấy mảng 'following' chứa danh sách ID người đang theo dõi
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tìm thấy thông tin người dùng trong DB, trả về lỗi 404
        if (!user)
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        // Truy vấn tất cả thông tin người dùng có ID nằm trong mảng 'following' của người dùng hiện tại
        const followingUsers = await user_repository_1.userRepository.find({
            _id: { $in: user.following },
        });
        // Định dạng lại cấu trúc dữ liệu trả về cho phù hợp với yêu cầu giao diện (Client DTO)
        const data = followingUsers.map((u) => ({
            UserID: u._id.toString(), // Chuyển đổi ObjectId thành chuỗi string
            Name: u.name, // Tên người được theo dõi
            AvatarURL: u.avatar, // Ảnh đại diện
            IsSeller: u.role === "User", // Phân biệt vai trò (ở đây check nếu role là 'User' hoặc vai trò người bán khác)
        }));
        // Trả về mảng danh sách những người đang theo dõi dạng JSON
        return res.json(data);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM LẤY DANH SÁCH NHỮNG NGƯỜI DÙNG ĐANG THEO DÕI TÀI KHOẢN HIỆN TẠI (NGƯỜI HÂM MỘ / FOLLOWERS)
 */
async function getFollowers(req, res) {
    // Lấy ID người dùng hiện tại từ token xác thực
    const { userId } = req.user;
    try {
        // Truy vấn tất cả người dùng mà trong mảng 'following' của họ có chứa ID của người dùng hiện tại
        const followersUsers = await user_repository_1.userRepository.find({
            following: new mongoose_1.default.Types.ObjectId(userId),
        });
        // Định dạng lại cấu trúc dữ liệu trả về giống như API getFollowing
        const data = followersUsers.map((u) => ({
            UserID: u._id.toString(),
            Name: u.name,
            AvatarURL: u.avatar,
            IsSeller: u.role === "User",
        }));
        // Trả về mảng danh sách người theo dõi dạng JSON
        return res.json(data);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

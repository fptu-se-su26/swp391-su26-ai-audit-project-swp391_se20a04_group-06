"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = getStats;
exports.listAllProducts = listAllProducts;
exports.listUsers = listUsers;
exports.toggleUser = toggleUser;
exports.verifyUser = verifyUser;
exports.adminDeleteProduct = adminDeleteProduct;
// Import dịch vụ adminService chứa logic xử lý các tác vụ quản trị
const admin_service_1 = require("../services/admin.service");
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
const response_helper_1 = require("../helpers/response.helper");
// Import các hàm phân tích tham số phân trang và đóng gói dữ liệu phân trang trả về
const pagination_1 = require("../utils/pagination");
// Import logger để ghi nhận vết hoạt động của hệ thống
const logger_1 = require("../utils/logger");
// HÀM LẤY SỐ LIỆU THỐNG KÊ DASHBOARD CHO ADMIN
async function getStats(_req, res) {
    try {
        // Gọi adminService lấy thông tin thống kê chung (user, sản phẩm, tin nhắn...)
        const stats = await admin_service_1.adminService.getDashboardStats();
        return res.json(stats); // Gửi trả dữ liệu dạng JSON cho Client
    }
    catch (err) {
        // Ghi log lỗi chi tiết lên console/file log
        logger_1.logger.error(`getStats error: ${err instanceof Error ? err.message : err}`);
        return (0, response_helper_1.sendServerError)(res, err); // Trả về lỗi 500 kèm cấu trúc lỗi chuẩn
    }
}
// HÀM LIỆT KÊ TOÀN BỘ SẢN PHẨM TRÊN SÀN (CÓ PHÂN TRANG VÀ TÌM KIẾM)
async function listAllProducts(req, res) {
    // Phân tích tham số phân trang (page, limit, offset) từ URL Query String
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit);
    // Lấy và chuẩn hóa từ khóa tìm kiếm (search) từ Query String
    const search = (req.query.search || "").trim();
    // Lấy bộ lọc trạng thái (status) của sản phẩm từ Query String
    const status = req.query.status || "";
    try {
        // Gọi service lấy danh sách sản phẩm và tổng số lượng khớp bộ lọc
        const { rows, total } = await admin_service_1.adminService.listAllProducts(search, status, offset, limit);
        // Trả về dữ liệu đóng gói dạng phân trang chuẩn (rows, total, page, limit)
        return res.json((0, pagination_1.paginatedResponse)(rows, total, page, limit));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err); // Trả về lỗi 500 nếu có sự cố DB
    }
}
// HÀM LIỆT KÊ DANH SÁCH NGƯỜI DÙNG CHO ADMIN (CÓ PHÂN TRANG VÀ TÌM KIẾM)
async function listUsers(req, res) {
    // Phân tích tham số phân trang từ yêu cầu gửi lên
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit);
    // Lấy và chuẩn hóa từ khóa tìm kiếm người dùng (theo tên, email)
    const search = (req.query.search || "").trim();
    try {
        // Gọi service lấy danh sách người dùng và tổng số lượng khớp từ khóa
        const { formattedRows, total } = await admin_service_1.adminService.listUsers(search, offset, limit);
        // Gửi trả dữ liệu phân trang cho client
        return res.json((0, pagination_1.paginatedResponse)(formattedRows, total, page, limit));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// HÀM KHOÁ HOẶC KÍCH HOẠT LẠI TÀI KHOẢN NGƯỜI DÙNG (BAN/UNBAN)
async function toggleUser(req, res) {
    const { id } = req.params; // Lấy ID người dùng từ tham số URL (:id)
    try {
        // Gọi service thay đổi trạng thái kích hoạt (isActive) của người dùng
        const isActive = await admin_service_1.adminService.toggleUserActive(id);
        return res.json({ isActive }); // Gửi trả trạng thái mới sau khi cập nhật
    }
    catch (err) {
        // Nếu lỗi có định nghĩa mã status (lỗi nghiệp vụ, ví dụ 404 không thấy user)
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err); // Ném lỗi 500 nếu là sự cố server
    }
}
// HÀM DUYỆT CHỨNG THỰC HOẶC HỦY CHỨNG THỰC NGƯ DÂN (VERIFY/UNVERIFY)
async function verifyUser(req, res) {
    const { id } = req.params; // Lấy ID người dùng từ tham số URL (:id)
    try {
        // Gọi service đảo ngược trạng thái chứng thực uy tín (isVerified)
        const isVerified = await admin_service_1.adminService.toggleUserVerification(id);
        return res.json({
            isVerified,
            // Trả kèm thông điệp trực quan dựa trên trạng thái mới
            message: isVerified ? "Đã xác minh tài khoản" : "Đã thu hồi xác minh",
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// HÀM ADMIN XÓA SẢN PHẨM KHỎI SÀN (VÍ DỤ SẢN PHẨM BỊ BÁO CÁO VI PHẠM)
async function adminDeleteProduct(req, res) {
    const { id } = req.params; // Lấy ID sản phẩm cần xóa từ URL
    const adminId = req.user.userId; // Lấy ID của Admin thực hiện hành động từ middleware xác thực
    try {
        // Gọi service thực thi hành động xóa sản phẩm với quyền Admin
        await admin_service_1.adminService.adminDeleteProduct(id, adminId);
        return res.json({ message: "Admin đã xóa bài đăng thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

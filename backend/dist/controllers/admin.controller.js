"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = getStats;
exports.listAllProducts = listAllProducts;
exports.listUsers = listUsers;
exports.toggleUser = toggleUser;
exports.verifyUser = verifyUser;
exports.adminDeleteProduct = adminDeleteProduct;
const admin_service_1 = require("../services/admin.service");
const response_helper_1 = require("../helpers/response.helper");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../utils/logger");
// Lấy số liệu thống kê chung cho trang dashboard của Admin
async function getStats(_req, res) {
    try {
        const stats = await admin_service_1.adminService.getDashboardStats();
        return res.json(stats);
    }
    catch (err) {
        logger_1.logger.error(`getStats error: ${err instanceof Error ? err.message : err}`);
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Liệt kê toàn bộ sản phẩm (có phân trang và tìm kiếm)
async function listAllProducts(req, res) {
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit);
    const search = (req.query.search || "").trim();
    const status = req.query.status || "";
    try {
        const { rows, total } = await admin_service_1.adminService.listAllProducts(search, status, offset, limit);
        return res.json((0, pagination_1.paginatedResponse)(rows, total, page, limit));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Liệt kê danh sách người dùng (có phân trang và tìm kiếm)
async function listUsers(req, res) {
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit);
    const search = (req.query.search || "").trim();
    try {
        const { formattedRows, total } = await admin_service_1.adminService.listUsers(search, offset, limit);
        return res.json((0, pagination_1.paginatedResponse)(formattedRows, total, page, limit));
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Khóa hoặc kích hoạt lại tài khoản người dùng
async function toggleUser(req, res) {
    const { id } = req.params;
    try {
        const isActive = await admin_service_1.adminService.toggleUserActive(id);
        return res.json({ isActive });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Duyệt chứng thực hoặc hủy chứng thực danh tính ngư dân
async function verifyUser(req, res) {
    const { id } = req.params;
    try {
        const isVerified = await admin_service_1.adminService.toggleUserVerification(id);
        return res.json({
            isVerified,
            message: isVerified ? "Đã xác minh tài khoản" : "Đã thu hồi xác minh",
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
// Admin xóa sản phẩm bị báo cáo hoặc vi phạm khỏi sàn
async function adminDeleteProduct(req, res) {
    const { id } = req.params;
    const adminId = req.user.userId;
    try {
        await admin_service_1.adminService.adminDeleteProduct(id, adminId);
        return res.json({ message: "Admin đã xóa bài đăng thành công" });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

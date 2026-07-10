"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.getReports = getReports;
exports.handleReport = handleReport;
// Import reportService chứa logic nghiệp vụ xử lý báo cáo vi phạm
const report_service_1 = require("../services/report.service");
// Import helper gửi phản hồi lỗi server chuẩn hóa
const response_helper_1 = require("../helpers/response.helper");
// Import helper phân tích các tham số phân trang
const pagination_1 = require("../utils/pagination");
/**
 * HÀM NGƯỜI DÙNG GỬI BÁO CÁO VI PHẠM (REPORT PRODUCT) CHO MỘT SẢN PHẨM KHÔNG HỢP LỆ
 */
async function createReport(req, res) {
    // Lấy ID người dùng thực hiện báo cáo từ token xác thực
    const { userId } = req.user;
    // Lấy ID sản phẩm, bài viết hoặc công thức bị báo cáo từ tham số URL
    const { productId, postId, recipeId } = req.params;
    // Lấy lý do báo cáo (reason) từ body request
    const { reason } = req.body;
    try {
        if (postId) {
            await report_service_1.reportService.createReport(userId, postId, reason, "Post");
        }
        else if (recipeId) {
            await report_service_1.reportService.createReport(userId, recipeId, reason, "Recipe");
        }
        else {
            await report_service_1.reportService.createReport(userId, productId, reason, "Product");
        }
        // Trả về thông báo thành công cho Client
        return res.json({ message: "Báo cáo đã gửi thành công" });
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
 * HÀM TRUY VẤN DANH SÁCH BÁO CÁO VI PHẠM (Dành cho trang Admin, có phân trang và lọc theo trạng thái)
 */
async function getReports(req, res) {
    // Lấy trạng thái báo cáo cần lọc từ URL Query String (mặc định là "Pending" - Đang chờ xử lý)
    const queryStatus = req.query.status || "Pending";
    // Kiểm tra tính hợp lệ của trạng thái lọc, chỉ cho phép "Pending", "Resolved", "Dismissed"
    if (!["Pending", "Resolved", "Dismissed"].includes(queryStatus)) {
        return res.status(400).json({ message: "Trạng thái báo cáo không hợp lệ" });
    }
    // Phân tích tham số phân trang từ Query (page, limit) với giới hạn tối đa 100 dòng
    const { page, limit, offset } = (0, pagination_1.parsePagination)(req.query.page, req.query.limit, 100);
    try {
        // Gọi service lấy danh sách báo cáo vi phạm khớp trạng thái và phân trang
        const { formattedRows, total } = await report_service_1.reportService.listReports(queryStatus, offset, limit);
        // Gắn thêm các header tùy chỉnh chứa siêu dữ liệu phân trang vào response trả về (thông thường admin dashboard cần cái này)
        res.setHeader("X-Total-Count", total.toString());
        res.setHeader("X-Page", page.toString());
        res.setHeader("X-Limit", limit.toString());
        // Trả về danh sách báo cáo vi phạm cho Client dưới dạng JSON
        return res.json(formattedRows);
    }
    catch (err) {
        return (0, response_helper_1.sendServerError)(res, err);
    }
}
/**
 * HÀM ADMIN XỬ LÝ BÁO CÁO VI PHẠM (Duyệt báo cáo / Hủy bỏ báo cáo / Xóa sản phẩm vi phạm)
 */
async function handleReport(req, res) {
    // Lấy ID báo cáo vi phạm cần xử lý từ tham số URL (:id)
    const reportId = req.params.id;
    // Lấy hành động xử lý (action: "Resolve"/"Dismiss") và ghi chú của Admin (adminNote) từ body request
    const { action, adminNote } = req.body;
    // Lấy ID của Admin đang thực hiện thao tác này từ token xác thực
    const adminId = req.user.userId;
    try {
        // Gọi service xử lý báo cáo: cập nhật trạng thái báo cáo, gửi thông báo hoặc xóa bài đăng vi phạm nếu action là Resolve
        await report_service_1.reportService.handleReport(reportId, action, adminNote, adminId);
        // Trả về phản hồi thành công
        return res.json({
            message: "Đã xử lý báo cáo và dọn dẹp tài nguyên thành công!",
        });
    }
    catch (err) {
        if (err.status)
            return res.status(err.status).json({ message: err.message });
        return (0, response_helper_1.sendServerError)(res, err);
    }
}

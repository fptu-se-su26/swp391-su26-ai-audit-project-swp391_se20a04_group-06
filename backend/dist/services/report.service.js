"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
// Import đối tượng reportRepository phục vụ thao tác cơ sở dữ liệu với các bản ghi báo cáo vi phạm
const report_repository_1 = require("../repositories/report.repository");
// Import đối tượng productRepository để kiểm tra và xác nhận sự tồn tại của sản phẩm bị báo cáo
const product_repository_1 = require("../repositories/product.repository");
// Import dịch vụ productService để thực thi hành động xóa sản phẩm khi báo cáo được chấp thuận
const product_service_1 = require("./product.service");
// Import lớp lỗi HttpError dùng để ném ra các lỗi kèm theo mã HTTP phù hợp
const HttpError_1 = require("../errors/HttpError");
// Import thư viện mongoose để kiểm tra tính hợp lệ của định dạng ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Xuất ra đối tượng reportService chứa các logic nghiệp vụ xử lý báo cáo vi phạm sản phẩm
exports.reportService = {
    // Nghiệp vụ tạo báo cáo vi phạm đối với một sản phẩm mẻ hàng cụ thể
    async createReport(userId, productId, reason) {
        // Kiểm tra định dạng ID sản phẩm mẻ hàng truyền lên có phải là ObjectId hợp lệ của MongoDB hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            // Ném lỗi 400 Bad Request nếu định dạng ID không hợp lệ
            throw new HttpError_1.HttpError(400, "ID mẻ hàng không hợp lệ");
        }
        // Truy vấn thông tin sản phẩm mẻ hàng trong cơ sở dữ liệu loại trừ các sản phẩm đã bị xóa
        const product = await product_repository_1.productRepository.findOne({
            // Lọc theo ID sản phẩm mẻ hàng
            _id: productId,
            // Trạng thái sản phẩm khác Deleted
            status: { $ne: "Deleted" },
        });
        // Nếu sản phẩm không tồn tại hoặc đã bị đánh dấu xóa ẩn khỏi hệ thống
        if (!product) {
            // Ném lỗi 404 Not Found biểu thị sản phẩm không khả dụng để báo cáo
            throw new HttpError_1.HttpError(404, "Sản phẩm không tồn tại hoặc đã bị ẩn");
        }
        // Ràng buộc nghiệp vụ: Không cho phép người dùng tự gửi báo cáo vi phạm lên sản phẩm của chính mình
        if (product.sellerId.toString() === userId) {
            // Ném lỗi 400 Bad Request nếu phát hiện tự báo cáo sản phẩm bản thân
            throw new HttpError_1.HttpError(400, "Bạn không thể báo cáo mẻ hàng của chính mình!");
        }
        // Kiểm tra xem người dùng hiện tại đã từng gửi báo cáo cho sản phẩm mẻ hàng này trước đây hay chưa
        const existing = await report_repository_1.reportRepository.findByReporterAndProduct(
        // ID người báo cáo
        userId, 
        // ID sản phẩm bị báo cáo
        productId);
        // Nếu đã tồn tại bản ghi báo cáo từ trước
        if (existing) {
            // Ném lỗi 400 Bad Request nhằm tránh tình trạng spam báo cáo cùng một sản phẩm từ một tài khoản
            throw new HttpError_1.HttpError(400, "Bạn đã báo cáo mẻ hàng này rồi");
        }
        // Làm sạch nội dung lý do báo cáo: cắt bỏ khoảng trắng thừa, loại bỏ các thẻ HTML thô và giới hạn tối đa 500 ký tự để chống lỗi bảo mật XSS và tràn dữ liệu
        const cleanReason = reason
            .trim() // Xóa khoảng trắng ở hai đầu chuỗi
            .replace(/<[^>]*>/g, "") // Thay thế mọi thẻ HTML bằng chuỗi rỗng
            .slice(0, 500); // Cắt chuỗi lấy tối đa 500 ký tự đầu tiên
        // Lưu bản ghi báo cáo vi phạm mới vào cơ sở dữ liệu thông qua repository
        await report_repository_1.reportRepository.create({
            // ID tài khoản của người gửi báo cáo vi phạm
            reporterId: userId,
            // ID sản phẩm bị báo cáo vi phạm
            productId,
            // Lý do báo cáo đã được làm sạch an toàn
            reason: cleanReason,
        });
    },
    // Nghiệp vụ lấy danh sách các báo cáo vi phạm theo trạng thái xử lý và có phân trang phục vụ Admin
    async listReports(
    // Trạng thái của báo cáo: Pending (Chờ xử lý), Resolved (Đã giải quyết), Dismissed (Bỏ qua)
    status, 
    // Số bản ghi cần bỏ qua phục vụ phân trang
    offset, 
    // Số bản ghi tối đa cần trả về trên mỗi trang
    limit) {
        // Đếm tổng số lượng bản ghi báo cáo vi phạm khớp với trạng thái yêu cầu
        const total = await report_repository_1.reportRepository.countByStatus(status);
        // Truy vấn danh sách báo cáo vi phạm kèm thông tin liên kết được phân trang đầy đủ
        const reports = await report_repository_1.reportRepository.findByStatusPaginated(
        // Trạng thái lọc báo cáo
        status, 
        // Số dòng bỏ qua
        offset, 
        // Giới hạn dòng cần lấy
        limit);
        // Chuẩn hóa và định dạng dữ liệu trả về tương thích với giao diện quản trị Admin
        const formattedRows = reports.map((r) => ({
            // ID của bản ghi báo cáo dạng chuỗi
            id: r._id.toString(),
            // Lý do báo cáo vi phạm
            reason: r.reason,
            // Trạng thái hiện tại của báo cáo
            status: r.status,
            // Ghi chú của quản trị viên khi xử lý báo cáo
            adminNote: r.adminNote,
            // Mốc thời gian tạo báo cáo vi phạm
            createdAt: r.createdAt,
            // Tên người gửi báo cáo, mặc định hiển thị nếu thông tin tài khoản bị thiếu
            reporterName: r.reporterId?.name || "Một người dùng",
            // Tên sản phẩm bị báo cáo, mặc định hiển thị nếu sản phẩm đã bị xóa vật lý khỏi hệ thống
            productName: r.productId?.name || "Sản phẩm đã bị xoá",
            // ID sản phẩm bị báo cáo vi phạm dưới dạng chuỗi hoặc null
            productId: r.productId?._id?.toString() || null,
            // ID người bán sở hữu sản phẩm dưới dạng chuỗi hoặc null
            sellerId: r.productId?.sellerId?._id?.toString() || null,
            // Tên người bán sở hữu sản phẩm mẻ hàng bị báo cáo vi phạm
            sellerName: r.productId?.sellerId?.name || "Một ngư dân",
        }));
        // Trả về danh sách báo cáo đã định dạng cùng tổng số lượng bản ghi phục vụ phân trang ở frontend
        return { formattedRows, total };
    },
    // Nghiệp vụ xử lý báo cáo vi phạm của Admin (chấp thuận giải quyết hoặc bỏ qua báo cáo)
    async handleReport(
    // ID báo cáo cần xử lý
    reportId, 
    // Hành động xử lý: resolve (giải quyết - đồng nghĩa xóa sản phẩm) hoặc dismiss (bỏ qua báo cáo)
    action, 
    // Ghi chú giải thích thêm của Admin khi xử lý báo cáo
    adminNote, 
    // ID của tài khoản quản trị viên thực hiện hành động này
    adminId) {
        // Kiểm tra xem ID báo cáo truyền lên có hợp lệ định dạng ObjectId của MongoDB hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(reportId)) {
            // Ném lỗi 400 Bad Request nếu ID không đúng chuẩn cấu trúc
            throw new HttpError_1.HttpError(400, "ID báo cáo không hợp lệ");
        }
        // Truy vấn thông tin tài liệu báo cáo vi phạm từ cơ sở dữ liệu theo ID
        const report = await report_repository_1.reportRepository.findById(reportId);
        // Ném lỗi 404 nếu không tìm thấy bản ghi báo cáo nào khớp ID
        if (!report)
            throw new HttpError_1.HttpError(404, "Không tìm thấy báo cáo");
        // Xác định trạng thái xử lý mới dựa trên hành động được yêu cầu gửi lên
        const newStatus = action === "resolve" ? "Resolved" : "Dismissed";
        // Nếu hành động là đồng ý giải quyết vi phạm (resolve) và trường sản phẩm liên kết vẫn tồn tại
        if (action === "resolve" && report.productId) {
            // Thực hiện xóa bài đăng sản phẩm mẻ hàng vi phạm này thông qua dịch vụ xóa của productService
            await product_service_1.productService.delete(
            // ID sản phẩm cần xóa dưới dạng chuỗi
            report.productId.toString(), 
            // ID Admin thực hiện thao tác
            adminId, 
            // Quyền hạn Admin để ghi đè mọi kiểm tra chủ sở hữu sản phẩm thông thường
            "Admin");
        }
        // Thiết lập trạng thái xử lý mới cho tài liệu báo cáo
        report.status = newStatus;
        // Cập nhật ghi chú của Admin, mặc định là null nếu Admin không viết ghi chú
        report.adminNote = adminNote || null;
        // Thực hiện lưu các thay đổi của tài liệu báo cáo này xuống cơ sở dữ liệu MongoDB
        await report.save();
    },
};

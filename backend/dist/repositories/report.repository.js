"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRepository = void 0;
// Import mô hình Report và kiểu IReport để tương tác dữ liệu báo cáo sai phạm
const Report_1 = require("../models/Report");
// Import thư viện mongoose để thực hiện xử lý kiểu dữ liệu ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Xuất ra đối tượng reportRepository chứa các phương thức tương tác cơ sở dữ liệu cho báo cáo sai phạm
exports.reportRepository = {
    // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID sản phẩm
    async findByReporterAndProduct(
    // ID người báo cáo
    reporterId, 
    // ID sản phẩm bị báo cáo
    productId) {
        // Tìm một tài liệu Report khớp với điều kiện truyền vào (được ép kiểu sang ObjectId)
        return Report_1.Report.findOne({
            reporterId: new mongoose_1.default.Types.ObjectId(reporterId),
            productId: new mongoose_1.default.Types.ObjectId(productId),
        });
    },
    // Đếm tổng số lượng báo cáo sai phạm dựa trên trạng thái của báo cáo
    async countByStatus(
    // Trạng thái của báo cáo (Chờ xử lý, Đã xử lý, Đã bác bỏ)
    status) {
        // Đếm số lượng tài liệu có trường status tương ứng trong cơ sở dữ liệu
        return Report_1.Report.countDocuments({ status });
    },
    // Lấy danh sách báo cáo sai phạm theo trạng thái có phân trang
    async findByStatusPaginated(
    // Trạng thái của báo cáo cần lấy
    status, 
    // Số dòng bỏ qua để phân trang
    offset, 
    // Số dòng giới hạn tối đa trên một trang
    limit) {
        // Tìm kiếm các báo cáo có trạng thái tương ứng
        return Report_1.Report.find({ status })
            // Liên kết lấy thông tin tên của người báo cáo (reporterId)
            .populate("reporterId", "name")
            // Liên kết lồng để lấy thông tin sản phẩm (productId) gồm tên và ID người bán
            .populate({
            path: "productId",
            select: "name sellerId",
            // Trong sản phẩm lại liên kết lấy thông tin tên của người bán (sellerId)
            populate: {
                path: "sellerId",
                select: "name",
            },
        })
            // Sắp xếp các báo cáo theo thời gian tạo giảm dần (mới nhất lên đầu)
            .sort({ createdAt: -1 })
            // Bỏ qua offset dòng
            .skip(offset)
            // Giới hạn tối đa limit dòng trả về
            .limit(limit);
    },
    // Tìm kiếm báo cáo sai phạm theo ID
    async findById(reportId) {
        // Tìm kiếm và trả về báo cáo theo ID truyền vào
        return Report_1.Report.findById(reportId);
    },
    // Tạo mới một báo cáo sai phạm
    async create(data) {
        // Khởi tạo thực thể Report mới, chuyển các ID chuỗi sang ObjectId của MongoDB
        const report = new Report_1.Report({
            reporterId: new mongoose_1.default.Types.ObjectId(data.reporterId),
            productId: new mongoose_1.default.Types.ObjectId(data.productId),
            reason: data.reason,
        });
        // Lưu báo cáo vào cơ sở dữ liệu và trả về kết quả
        return report.save();
    },
    // Xóa các báo cáo sai phạm liên quan đến một sản phẩm cụ thể
    async deleteByProductId(productId) {
        // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường productId khớp với giá trị truyền vào
        return Report_1.Report.deleteMany({
            productId: new mongoose_1.default.Types.ObjectId(productId),
        });
    },
    // Xóa các báo cáo sai phạm được gửi bởi một người dùng cụ thể
    async deleteByReporterId(reporterId) {
        // Gọi phương thức deleteMany để xóa tất cả các báo cáo có trường reporterId khớp với giá trị truyền vào
        return Report_1.Report.deleteMany({
            reporterId: new mongoose_1.default.Types.ObjectId(reporterId),
        });
    },
};

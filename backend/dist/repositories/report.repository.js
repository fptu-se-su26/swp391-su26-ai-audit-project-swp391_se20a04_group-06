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
    async findByReporterAndProduct(reporterId, productId) {
        return Report_1.Report.findOne({
            reporterId: new mongoose_1.default.Types.ObjectId(reporterId),
            productId: new mongoose_1.default.Types.ObjectId(productId),
        });
    },
    // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID bài viết
    async findByReporterAndPost(reporterId, postId) {
        return Report_1.Report.findOne({
            reporterId: new mongoose_1.default.Types.ObjectId(reporterId),
            postId: new mongoose_1.default.Types.ObjectId(postId),
        });
    },
    // Tìm báo cáo sai phạm dựa vào ID người báo cáo và ID công thức
    async findByReporterAndRecipe(reporterId, recipeId) {
        return Report_1.Report.findOne({
            reporterId: new mongoose_1.default.Types.ObjectId(reporterId),
            recipeId: new mongoose_1.default.Types.ObjectId(recipeId),
        });
    },
    // Đếm tổng số lượng báo cáo sai phạm dựa trên trạng thái của báo cáo
    async countByStatus(status) {
        return Report_1.Report.countDocuments({ status });
    },
    // Lấy danh sách báo cáo sai phạm theo trạng thái có phân trang
    async findByStatusPaginated(status, offset, limit) {
        return Report_1.Report.find({ status })
            .populate("reporterId", "name")
            .populate({
            path: "productId",
            select: "name sellerId",
            populate: {
                path: "sellerId",
                select: "name",
            },
        })
            .populate({
            path: "postId",
            select: "title userId userName authorName",
        })
            .populate({
            path: "recipeId",
            select: "title authorId",
            populate: {
                path: "authorId",
                select: "name",
            },
        })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);
    },
    // Tìm kiếm báo cáo sai phạm theo ID
    async findById(reportId) {
        return Report_1.Report.findById(reportId);
    },
    // Tạo mới một báo cáo sai phạm
    async create(data) {
        const report = new Report_1.Report({
            reporterId: new mongoose_1.default.Types.ObjectId(data.reporterId),
            productId: data.productId ? new mongoose_1.default.Types.ObjectId(data.productId) : undefined,
            postId: data.postId ? new mongoose_1.default.Types.ObjectId(data.postId) : undefined,
            recipeId: data.recipeId ? new mongoose_1.default.Types.ObjectId(data.recipeId) : undefined,
            targetType: data.targetType,
            reason: data.reason,
        });
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

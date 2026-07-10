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
// Import đối tượng notificationRepository để tạo thông báo cảnh báo cho người dùng
const notification_repository_1 = require("../repositories/notification.repository");
// Import hàm getIO để gửi thông báo thời gian thực qua socket
const socket_1 = require("../socket");
// Import dịch vụ productService để thực thi hành động xóa sản phẩm khi báo cáo được chấp thuận
const product_service_1 = require("./product.service");
// Import dịch vụ postService và recipeService để thực thi hành động xóa khi báo cáo được chấp thuận
const post_service_1 = require("./post.service");
const recipe_service_1 = require("./recipe.service");
// Import lớp lỗi HttpError dùng để ném ra các lỗi kèm theo mã HTTP phù hợp
const HttpError_1 = require("../errors/HttpError");
// Import thư viện mongoose để kiểm tra tính hợp lệ của định dạng ObjectId
const mongoose_1 = __importDefault(require("mongoose"));
// Xuất ra đối tượng reportService chứa các logic nghiệp vụ xử lý báo cáo vi phạm
exports.reportService = {
    // Nghiệp vụ tạo báo cáo vi phạm đối với một mục cụ thể (Product, Post, hoặc Recipe)
    async createReport(userId, targetId, reason, targetType = "Product") {
        // Kiểm tra định dạng ID truyền lên có hợp lệ hay không
        if (!mongoose_1.default.Types.ObjectId.isValid(targetId)) {
            throw new HttpError_1.HttpError(400, "ID mục báo cáo không hợp lệ");
        }
        let productId;
        let postId;
        let recipeId;
        if (targetType === "Product") {
            productId = targetId;
            const product = await product_repository_1.productRepository.findOne({
                _id: targetId,
                status: { $ne: "Deleted" },
            });
            if (!product) {
                throw new HttpError_1.HttpError(404, "Sản phẩm không tồn tại hoặc đã bị ẩn");
            }
            if (product.sellerId.toString() === userId) {
                throw new HttpError_1.HttpError(400, "Bạn không thể báo cáo mẻ hàng của chính mình!");
            }
            const existing = await report_repository_1.reportRepository.findByReporterAndProduct(userId, targetId);
            if (existing) {
                throw new HttpError_1.HttpError(400, "Bạn đã báo cáo mẻ hàng này rồi");
            }
        }
        else if (targetType === "Post") {
            postId = targetId;
            const Post = mongoose_1.default.model("Post");
            const post = await Post.findOne({
                _id: targetId,
                status: { $ne: "Deleted" },
            });
            if (!post) {
                throw new HttpError_1.HttpError(404, "Bài viết không tồn tại hoặc đã bị ẩn");
            }
            const authorIdStr = post.userId ? post.userId.toString() : "";
            if (authorIdStr === userId) {
                throw new HttpError_1.HttpError(400, "Bạn không thể báo cáo bài viết của chính mình!");
            }
            const existing = await report_repository_1.reportRepository.findByReporterAndPost(userId, targetId);
            if (existing) {
                throw new HttpError_1.HttpError(400, "Bạn đã báo cáo bài viết này rồi");
            }
        }
        else if (targetType === "Recipe") {
            recipeId = targetId;
            const Recipe = mongoose_1.default.model("Recipe");
            const recipe = await Recipe.findOne({
                _id: targetId,
                status: { $ne: "Deleted" },
            });
            if (!recipe) {
                throw new HttpError_1.HttpError(404, "Công thức không tồn tại hoặc đã bị ẩn");
            }
            const authorIdStr = recipe.authorId ? recipe.authorId.toString() : "";
            if (authorIdStr === userId) {
                throw new HttpError_1.HttpError(400, "Bạn không thể báo cáo công thức của chính mình!");
            }
            const existing = await report_repository_1.reportRepository.findByReporterAndRecipe(userId, targetId);
            if (existing) {
                throw new HttpError_1.HttpError(400, "Bạn đã báo cáo công thức này rồi");
            }
        }
        // Làm sạch nội dung lý do báo cáo
        const cleanReason = reason
            .trim()
            .replace(/<[^>]*>/g, "")
            .slice(0, 500);
        // Lưu bản ghi báo cáo vi phạm mới vào cơ sở dữ liệu
        await report_repository_1.reportRepository.create({
            reporterId: userId,
            productId,
            postId,
            recipeId,
            targetType,
            reason: cleanReason,
        });
        // Gửi thông báo cảnh báo cho chủ sở hữu bài đăng/công thức/mẻ hàng (nếu có)
        let ownerId;
        let targetName = "";
        let itemLabel = "mẻ hàng";
        if (targetType === "Product" && productId) {
            const product = await product_repository_1.productRepository.findOne({ _id: productId });
            if (product) {
                ownerId = product.sellerId.toString();
                targetName = product.name;
                itemLabel = "mẻ hàng";
            }
        }
        else if (targetType === "Post" && postId) {
            const Post = mongoose_1.default.model("Post");
            const post = await Post.findOne({ _id: postId });
            if (post) {
                ownerId = post.userId?.toString() || post.authorId?.toString();
                targetName = post.title;
                itemLabel = "bài viết";
            }
        }
        else if (targetType === "Recipe" && recipeId) {
            const Recipe = mongoose_1.default.model("Recipe");
            const recipe = await Recipe.findOne({ _id: recipeId });
            if (recipe) {
                ownerId = recipe.authorId?.toString();
                targetName = recipe.title;
                itemLabel = "công thức";
            }
        }
        if (ownerId) {
            await notification_repository_1.notificationRepository.create({
                userId: new mongoose_1.default.Types.ObjectId(ownerId),
                type: "report_warning",
                content: `Cảnh báo: ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} "${targetName}" của bạn bị báo cáo vi phạm với lý do: "${cleanReason}". Vui lòng tuân thủ quy chế hoạt động.`,
            });
            try {
                (0, socket_1.getIO)().to(`user_${ownerId}`).emit("notification", {
                    type: "report_warning",
                    content: `Cảnh báo: ${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} "${targetName}" của bạn bị báo cáo vi phạm với lý do: "${cleanReason}".`,
                });
            }
            catch (err) {
                // Ignored
            }
        }
    },
    // Nghiệp vụ lấy danh sách các báo cáo vi phạm theo trạng thái xử lý và có phân trang phục vụ Admin
    async listReports(status, offset, limit) {
        const total = await report_repository_1.reportRepository.countByStatus(status);
        const reports = await report_repository_1.reportRepository.findByStatusPaginated(status, offset, limit);
        // Chuẩn hóa và định dạng dữ liệu trả về tương thích với giao diện quản trị Admin
        const formattedRows = reports.map((r) => ({
            id: r._id.toString(),
            reason: r.reason,
            status: r.status,
            adminNote: r.adminNote,
            createdAt: r.createdAt,
            reporterName: r.reporterId?.name || "Một người dùng",
            targetType: r.targetType || "Product",
            // Product fields
            productName: r.productId?.name || (r.targetType === "Product" ? "Sản phẩm đã bị xoá" : null),
            productId: r.productId?._id?.toString() || null,
            sellerId: r.productId?.sellerId?._id?.toString() || r.recipeId?.authorId?._id?.toString() || null,
            sellerName: r.productId?.sellerId?.name || r.recipeId?.authorId?.name || (r.targetType === "Product" ? "Một ngư dân" : null),
            // Post fields
            postName: r.postId?.title || (r.targetType === "Post" ? "Bài viết đã bị xoá" : null),
            postId: r.postId?._id?.toString() || null,
            postAuthorName: r.postId?.userName || r.postId?.authorName || null,
            // Recipe fields
            recipeName: r.recipeId?.title || (r.targetType === "Recipe" ? "Công thức đã bị xoá" : null),
            recipeId: r.recipeId?._id?.toString() || null,
        }));
        return { formattedRows, total };
    },
    // Nghiệp vụ xử lý báo cáo vi phạm của Admin
    async handleReport(reportId, action, adminNote, adminId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(reportId)) {
            throw new HttpError_1.HttpError(400, "ID báo cáo không hợp lệ");
        }
        const report = await report_repository_1.reportRepository.findById(reportId);
        if (!report)
            throw new HttpError_1.HttpError(404, "Không tìm thấy báo cáo");
        const newStatus = action === "resolve" ? "Resolved" : "Dismissed";
        // Nếu hành động là đồng ý giải quyết vi phạm (resolve)
        if (action === "resolve") {
            const type = report.targetType || "Product";
            if (type === "Product" && report.productId) {
                await product_service_1.productService.delete(report.productId.toString(), adminId, "Admin");
            }
            else if (type === "Post" && report.postId) {
                await post_service_1.postService.delete(report.postId.toString(), adminId, "Admin");
            }
            else if (type === "Recipe" && report.recipeId) {
                await recipe_service_1.recipeService.delete(report.recipeId.toString(), adminId, "Admin");
            }
        }
        report.status = newStatus;
        report.adminNote = adminNote || null;
        await report.save();
    },
};

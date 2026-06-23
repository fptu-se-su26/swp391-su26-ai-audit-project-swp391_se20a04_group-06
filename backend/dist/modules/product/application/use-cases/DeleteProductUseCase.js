"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteProductUseCase = void 0;
// Import các ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi không tìm thấy hoặc không có quyền xóa
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import cấu hình cloudinary để thực hiện dọn dẹp và xóa các tài nguyên hình ảnh lưu trên đám mây
const cloudinary_1 = require("../../../../config/cloudinary");
// Import biến redis để kết nối và thực hiện thao tác xóa, cập nhật phiên bản cache
const redis_1 = require("../../../../config/redis");
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
const logger_1 = require("../../../../utils/logger");
// Import hàm extractPublicId dùng để trích xuất mã định danh hình ảnh trên Cloudinary từ đường dẫn URL
const cloudinary_2 = require("../../../../utils/cloudinary");
// Import hàm updateUserBadges phục vụ cập nhật lại danh hiệu của người dùng sau khi xóa sản phẩm
const badge_service_1 = require("../../../../services/badge.service");
// Sử dụng các repository khác để dọn dẹp quan hệ
// Import notificationRepository để xóa các thông báo liên quan đến sản phẩm bị xóa
const notification_repository_1 = require("../../../../repositories/notification.repository");
// Import reportRepository để xóa các báo cáo vi phạm liên quan đến sản phẩm bị xóa
const report_repository_1 = require("../../../../repositories/report.repository");
// Import userRepository để xóa sản phẩm bị xóa khỏi danh sách yêu thích của tất cả người dùng
const user_repository_1 = require("../../../../repositories/user.repository");
// Định nghĩa lớp nghiệp vụ DeleteProductUseCase xử lý logic xóa sản phẩm
class DeleteProductUseCase {
    // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    // Phương thức thực thi nghiệp vụ xóa sản phẩm dựa trên ID sản phẩm, ID người yêu cầu và quyền hạn (role)
    async execute(productId, userId, role) {
        // Tìm kiếm thông tin sản phẩm cần xóa từ Repository theo ID sản phẩm
        const product = await this.productRepository.findById(productId);
        // Nếu không tồn tại sản phẩm, ném lỗi NotFoundError
        if (!product)
            throw new DomainException_1.NotFoundError("Không tìm thấy sản phẩm");
        // Kiểm tra quyền: Nếu người thực hiện không phải Admin và cũng không phải người bán sản phẩm này
        if (role !== "Admin" && product.sellerId !== userId) {
            // Ném lỗi UnauthorizedError báo không có quyền xóa bài đăng
            throw new DomainException_1.UnauthorizedError("Bạn không có quyền xoá bài đăng này");
        }
        // 1. Dọn dẹp hình ảnh trên Cloudinary
        // Kiểm tra xem sản phẩm có chứa danh sách hình ảnh hay không
        if (product.images && product.images.length > 0) {
            // Trích xuất public ID của từng ảnh trên Cloudinary và lọc bỏ các giá trị không hợp lệ
            const publicIds = product.images.map(cloudinary_2.extractPublicId).filter((id) => !!id);
            // Nếu tồn tại danh sách public ID hợp lệ
            if (publicIds.length > 0) {
                // Gửi lệnh xóa tài nguyên hình ảnh bất đồng bộ trên Cloudinary
                cloudinary_1.cloudinary.api.delete_resources(publicIds).catch((err) => {
                    // Ghi nhật ký lỗi nếu tiến trình xóa ảnh trên Cloudinary gặp sự cố
                    logger_1.logger.error(`Cloudinary cleanup failed during deletion: ${err.message}`);
                });
            }
        }
        // 2. Thực hiện xóa (Soft delete)
        // Đổi trạng thái sản phẩm sang "Deleted" để thực hiện xóa mềm ở tầng Domain
        product.markAsDeleted();
        // Lưu lại trạng thái sản phẩm đã được đánh dấu xóa vào database
        await this.productRepository.save(product);
        // 3. Cập nhật badges cho ngư dân
        // Tiến hành tính toán và cập nhật lại danh hiệu của người bán một cách bất đồng bộ
        (0, badge_service_1.updateUserBadges)(product.sellerId).catch((err) => {
            // Ghi nhật ký lỗi nếu cập nhật danh hiệu ngư dân gặp sự cố
            logger_1.logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${product.sellerId}: ${err.message}`);
        });
        // 4. Cascade dọn dẹp liên kết
        // Thực hiện xóa toàn bộ các thông báo liên quan đến sản phẩm này trong DB
        await notification_repository_1.notificationRepository.deleteByProductId(productId).catch(() => { });
        // Thực hiện xóa toàn bộ các báo cáo vi phạm liên quan đến sản phẩm này trong DB
        await report_repository_1.reportRepository.deleteByProductId(productId).catch(() => { });
        // Loại bỏ ID sản phẩm này khỏi mảng yêu thích (favorites) của tất cả người dùng trong DB
        await user_repository_1.userRepository.updateMany({}, { $pull: { favorites: productId } }).catch(() => { });
        // 5. Xử lý cache Redis
        // Xóa cache chi tiết sản phẩm trên Redis để tránh trả về dữ liệu cũ đã bị xóa
        await redis_1.redis.del(`product:detail:${productId}`).catch(() => { });
        // Tăng phiên bản cache danh sách sản phẩm theo loại tương ứng để buộc client tải lại danh sách mới
        await redis_1.redis.incr(`product:list:version:${product.type}`).catch(() => { });
    }
}
exports.DeleteProductUseCase = DeleteProductUseCase;

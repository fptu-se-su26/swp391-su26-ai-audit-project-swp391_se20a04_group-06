// Import interface IProductRepository để thực hiện các thao tác truy xuất dữ liệu sản phẩm ở tầng Domain
import { IProductRepository } from "../../domain/repositories/IProductRepository";
// Import các ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi không tìm thấy hoặc không có quyền xóa
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";
// Import cấu hình cloudinary để thực hiện dọn dẹp và xóa các tài nguyên hình ảnh lưu trên đám mây
import { cloudinary } from "../../../../config/cloudinary";
// Import biến redis để kết nối và thực hiện thao tác xóa, cập nhật phiên bản cache
import { redis } from "../../../../config/redis";
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
import { logger } from "../../../../utils/logger";
// Import hàm extractPublicId dùng để trích xuất mã định danh hình ảnh trên Cloudinary từ đường dẫn URL
import { extractPublicId } from "../../../../utils/cloudinary";
// Import hàm updateUserBadges phục vụ cập nhật lại danh hiệu của người dùng sau khi xóa sản phẩm
import { updateUserBadges } from "../../../../services/badge.service";

// Sử dụng các repository khác để dọn dẹp quan hệ
// Import notificationRepository để xóa các thông báo liên quan đến sản phẩm bị xóa
import { notificationRepository } from "../../../../repositories/notification.repository";
// Import reportRepository để xóa các báo cáo vi phạm liên quan đến sản phẩm bị xóa
import { reportRepository } from "../../../../repositories/report.repository";
// Import userRepository để xóa sản phẩm bị xóa khỏi danh sách yêu thích của tất cả người dùng
import { userRepository } from "../../../../repositories/user.repository";

// Định nghĩa lớp nghiệp vụ DeleteProductUseCase xử lý logic xóa sản phẩm
export class DeleteProductUseCase {
  // Hàm khởi tạo nhận vào productRepository theo cơ chế Dependency Injection (DI)
  constructor(private productRepository: IProductRepository) {}

  // Phương thức thực thi nghiệp vụ xóa sản phẩm dựa trên ID sản phẩm, ID người yêu cầu và quyền hạn (role)
  async execute(productId: string, userId: string, role: string): Promise<void> {
    // Tìm kiếm thông tin sản phẩm cần xóa từ Repository theo ID sản phẩm
    const product = await this.productRepository.findById(productId);
    // Nếu không tồn tại sản phẩm, ném lỗi NotFoundError
    if (!product) throw new NotFoundError("Không tìm thấy sản phẩm");

    // Kiểm tra quyền: Nếu người thực hiện không phải Admin và cũng không phải người bán sản phẩm này
    if (role !== "Admin" && product.sellerId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền xóa bài đăng
      throw new UnauthorizedError("Bạn không có quyền xoá bài đăng này");
    }

    // 1. Dọn dẹp hình ảnh trên Cloudinary
    // Kiểm tra xem sản phẩm có chứa danh sách hình ảnh hay không
    if (product.images && product.images.length > 0) {
      // Trích xuất public ID của từng ảnh trên Cloudinary và lọc bỏ các giá trị không hợp lệ
      const publicIds = product.images.map(extractPublicId).filter((id): id is string => !!id);
      // Nếu tồn tại danh sách public ID hợp lệ
      if (publicIds.length > 0) {
        // Gửi lệnh xóa tài nguyên hình ảnh bất đồng bộ trên Cloudinary
        cloudinary.api.delete_resources(publicIds).catch((err: any) => {
          // Ghi nhật ký lỗi nếu tiến trình xóa ảnh trên Cloudinary gặp sự cố
          logger.error(`Cloudinary cleanup failed during deletion: ${err.message}`);
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
    updateUserBadges(product.sellerId).catch((err) => {
      // Ghi nhật ký lỗi nếu cập nhật danh hiệu ngư dân gặp sự cố
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${product.sellerId}: ${err.message}`);
    });

    // 4. Cascade dọn dẹp liên kết
    // Thực hiện xóa toàn bộ các thông báo liên quan đến sản phẩm này trong DB
    await notificationRepository.deleteByProductId(productId).catch(() => {});
    // Thực hiện xóa toàn bộ các báo cáo vi phạm liên quan đến sản phẩm này trong DB
    await reportRepository.deleteByProductId(productId as any).catch(() => {});
    // Loại bỏ ID sản phẩm này khỏi mảng yêu thích (favorites) của tất cả người dùng trong DB
    await userRepository.updateMany({}, { $pull: { favorites: productId as any } }).catch(() => {});

    // 5. Xử lý cache Redis
    // Xóa cache chi tiết sản phẩm trên Redis để tránh trả về dữ liệu cũ đã bị xóa
    await redis.del(`product:detail:${productId}`).catch(() => {});
    // Tăng phiên bản cache danh sách sản phẩm theo loại tương ứng để buộc client tải lại danh sách mới
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}


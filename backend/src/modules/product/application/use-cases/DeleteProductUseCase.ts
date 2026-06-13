import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";
import { cloudinary } from "../../../../config/cloudinary";
import { redis } from "../../../../config/redis";
import { logger } from "../../../../utils/logger";
import { extractPublicId } from "../../../../utils/cloudinary";
import { updateUserBadges } from "../../../../services/badge.service";

// Sử dụng các repository khác để dọn dẹp quan hệ
import { notificationRepository } from "../../../../repositories/notification.repository";
import { reportRepository } from "../../../../repositories/report.repository";
import { userRepository } from "../../../../repositories/user.repository";

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string, userId: string, role: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("Không tìm thấy sản phẩm");

    if (role !== "Admin" && product.sellerId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền xoá bài đăng này");
    }

    // 1. Dọn dẹp hình ảnh trên Cloudinary
    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map(extractPublicId).filter((id): id is string => !!id);
      if (publicIds.length > 0) {
        cloudinary.api.delete_resources(publicIds).catch((err: any) => {
          logger.error(`Cloudinary cleanup failed during deletion: ${err.message}`);
        });
      }
    }

    // 2. Thực hiện xóa (Soft delete)
    product.markAsDeleted();
    await this.productRepository.save(product);

    // 3. Cập nhật badges cho ngư dân
    updateUserBadges(product.sellerId).catch((err) => {
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${product.sellerId}: ${err.message}`);
    });

    // 4. Cascade dọn dẹp liên kết
    await notificationRepository.deleteByProductId(productId).catch(() => {});
    await reportRepository.deleteByProductId(productId as any).catch(() => {});
    await userRepository.updateMany({}, { $pull: { favorites: productId as any } }).catch(() => {});

    // 5. Xử lý cache Redis
    await redis.del(`product:detail:${productId}`).catch(() => {});
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}

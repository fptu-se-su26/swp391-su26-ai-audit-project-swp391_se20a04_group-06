import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { GPSCoordinates } from "../../domain/value-objects/GPSCoordinates";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../../shared/domain/exceptions/DomainException";
import { cloudinary } from "../../../../config/cloudinary";
import { redis } from "../../../../config/redis";
import { logger } from "../../../../utils/logger";
import { extractPublicId } from "../../../../utils/cloudinary";
import { updateUserBadges } from "../../../../services/badge.service";

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, userId: string, role: string, body: any): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Không tìm thấy sản phẩm");

    if (role !== "Admin" && product.sellerId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền chỉnh sửa bài đăng này");
    }

    // 1. Kiểm tra vị trí GPS khi cập nhật
    const targetType = body.type !== undefined ? body.type : product.type;
    const targetLat = body.lat !== undefined ? body.lat : (product.location ? product.location.latitude : undefined);
    const targetLng = body.lng !== undefined ? body.lng : (product.location ? product.location.longitude : undefined);

    let location: GPSCoordinates | undefined;
    if (targetType === "Fresh") {
      if (targetLat == null || targetLng == null) {
        throw new ValidationError("Tọa độ GPS vị trí mẻ hàng là bắt buộc đối với hải sản tươi sống!");
      }
      location = GPSCoordinates.create(parseFloat(targetLat), parseFloat(targetLng));
    } else {
      if (targetLat != null && targetLng != null) {
        location = GPSCoordinates.create(parseFloat(targetLat), parseFloat(targetLng));
      }
    }

    let catchLocation: GPSCoordinates | undefined;
    const targetCatchLat = body.catchLat !== undefined ? body.catchLat : (product.catchLocation ? product.catchLocation.latitude : undefined);
    const targetCatchLng = body.catchLng !== undefined ? body.catchLng : (product.catchLocation ? product.catchLocation.longitude : undefined);
    if (targetCatchLat != null && targetCatchLng != null) {
      catchLocation = GPSCoordinates.create(parseFloat(targetCatchLat), parseFloat(targetCatchLng));
    }

    // 2. Cập nhật cân nặng
    const finalTotalWeight = body.totalWeight !== undefined ? parseFloat(body.totalWeight) : product.totalWeight;
    const finalRemainingWeight = body.remainingWeight !== undefined ? parseFloat(body.remainingWeight) : product.remainingWeight;
    product.updateWeight(finalTotalWeight, finalRemainingWeight);

    // 3. Cập nhật giá bán & Lịch sử biến động giá
    if (body.price !== undefined) {
      const parsedPrice = parseInt(body.price, 10);
      product.updatePrice(parsedPrice);
    }

    // 4. Giải phóng ảnh thừa trên Cloudinary nếu danh sách ảnh thay đổi
    let finalImages = product.images;
    if (body.images !== undefined && Array.isArray(body.images)) {
      const removedImages = (product.images || []).filter((img) => !body.images.includes(img));
      if (removedImages.length > 0) {
        const removedPublicIds = removedImages.map(extractPublicId).filter((id): id is string => !!id);
        if (removedPublicIds.length > 0) {
          cloudinary.api.delete_resources(removedPublicIds).catch((err: any) => {
            logger.error(`Cloudinary cleanup failed during update: ${err.message}`);
          });
        }
      }
      finalImages = body.images;
    }

    // 5. Cập nhật thông tin khác
    product.updateProfile(
      body.name !== undefined ? body.name : product.name,
      body.description !== undefined
        ? body.description.trim().replace(/<[^>]*>/g, "").slice(0, 2000)
        : product.description,
      body.category !== undefined ? body.category : product.category,
      body.salesType !== undefined ? body.salesType : product.salesType,
      targetType,
      location,
      catchLocation,
      body.catchTime !== undefined ? (body.catchTime ? new Date(body.catchTime) : undefined) : product.catchTime,
      body.origin !== undefined ? body.origin : product.origin,
      body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : undefined) : product.expiryDate,
      finalImages
    );

    if (body.status !== undefined) {
      product.props.status = body.status;
    }

    await this.productRepository.save(product);

    // 6. Cập nhật danh hiệu người dùng
    updateUserBadges(product.sellerId).catch((err) => {
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${product.sellerId}: ${err.message}`);
    });

    // 7. Xóa cache Redis
    await redis.del(`product:detail:${id}`).catch(() => {});
    await redis.incr(`product:list:version:${product.type}`).catch(() => {});
  }
}

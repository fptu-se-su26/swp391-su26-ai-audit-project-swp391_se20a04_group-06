import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { Product } from "../../domain/entities/Product";
import { GPSCoordinates } from "../../domain/value-objects/GPSCoordinates";
import { ValidationError, ConflictError } from "../../../../shared/domain/exceptions/DomainException";
import { redis } from "../../../../config/redis";
import { logger } from "../../../../utils/logger";
import { userRepository } from "../../../../repositories/user.repository";
import { updateUserBadges } from "../../../../services/badge.service";
import { notifyFollowersNewProduct } from "../../../../services/notification.service";

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(userId: string, body: any) {
    const {
      type,
      category,
      name,
      description,
      price,
      salesType,
      totalWeight,
      catchTime,
      lat,
      lng,
      origin,
      expiryDate,
      images,
      catchLat,
      catchLng,
    } = body;

    // 1. Kiểm tra vị trí GPS nếu là hàng tươi sống
    let location: GPSCoordinates | undefined;
    if (type === "Fresh") {
      if (lat == null || lng == null) {
        throw new ValidationError("Tọa độ vị trí GPS là bắt buộc đối với hải sản tươi sống!");
      }
      location = GPSCoordinates.create(parseFloat(lat), parseFloat(lng));
    } else {
      if (lat != null && lng != null) {
        location = GPSCoordinates.create(parseFloat(lat), parseFloat(lng));
      }
    }

    let catchLocation: GPSCoordinates | undefined;
    if (catchLat != null && catchLng != null) {
      catchLocation = GPSCoordinates.create(parseFloat(catchLat), parseFloat(catchLng));
    }

    // 2. Kiểm tra giới hạn đăng tin qua Redis của tài khoản thường
    const user = await userRepository.findById(userId);
    if (!user) throw new ValidationError("Không tìm thấy người dùng");

    const nowVN = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dateKey = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, "0")}-${String(nowVN.getUTCDate()).padStart(2, "0")}`;
    const limitKey = `product:limit:${userId}:${dateKey}`;

    if (!user.isPremium && user.role !== "Admin") {
      const currentCount = await redis.incr(limitKey);
      if (currentCount === 1) {
        await redis.expire(limitKey, 24 * 3600);
      }

      if (currentCount > 5) {
        await redis.decr(limitKey);
        throw new ConflictError(
          "Tài khoản thường chỉ được phép đăng tối đa 5 bài viết mỗi ngày. Vui lòng nâng cấp lên Premium để đăng không giới hạn!"
        );
      }
    }

    // 3. Chuẩn hóa dữ liệu
    const cleanDesc = description
      ? description
          .trim()
          .replace(/<[^>]*>/g, "")
          .slice(0, 2000)
      : "";

    const parsedPrice = typeof price === "number" ? price : parseInt(price, 10);
    const parsedWeight = typeof totalWeight === "number" ? totalWeight : parseFloat(totalWeight);

    if (isNaN(parsedPrice) || isNaN(parsedWeight)) {
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      throw new ValidationError("Thông tin giá cả hoặc khối lượng không hợp lệ");
    }

    const product = new Product({
      sellerId: userId,
      type,
      category,
      name: name.trim(),
      description: cleanDesc,
      price: parsedPrice,
      salesType: salesType ?? "Retail",
      totalWeight: parsedWeight,
      remainingWeight: parsedWeight,
      status: "Active",
      location,
      catchLocation,
      catchTime: catchTime ? new Date(catchTime) : undefined,
      origin,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      images: Array.isArray(images) ? images : [],
    });

    try {
      await this.productRepository.save(product);
    } catch (saveErr) {
      if (!user.isPremium && user.role !== "Admin") {
        await redis.decr(limitKey);
      }
      throw saveErr;
    }

    // 4. Kích hoạt cập nhật badges & thông báo bất đồng bộ
    updateUserBadges(userId).catch((err) => {
      logger.error(`[Badge Award Error] Không thể cập nhật danh hiệu cho UserID=${userId}: ${err.message}`);
    });

    // Tăng phiên bản cache sản phẩm trên Redis
    await redis.incr(`product:list:version:${type}`).catch(() => {});

    notifyFollowersNewProduct(
      userId,
      user.name,
      product.id,
      product.name
    ).catch((err) => logger.error(`[Notify] notifyFollowersNewProduct failed: ${err.message}`));

    return { productId: product.id };
  }
}

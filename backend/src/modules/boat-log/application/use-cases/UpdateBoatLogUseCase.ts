import { deleteFromCloudinary } from "../../../../middlewares/upload";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../../shared/domain/exceptions/DomainException";
import { extractPublicId } from "../../../../utils/cloudinary";
import { logger } from "../../../../utils/logger";
import { BoatLog } from "../../domain/entities/BoatLog";
import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";

export interface UpdateBoatLogRequestDTO {
  content: string;
  images?: string[];
  boatName?: string;
  catchArea?: string;
  landingTime?: string | null;
  origin?: string;
}

export class UpdateBoatLogUseCase {
  constructor(private boatLogRepository: IBoatLogRepository) {}

  async execute(
    logId: string,
    userId: string,
    role: string,
    dto: UpdateBoatLogRequestDTO,
  ): Promise<BoatLog> {
    const log = await this.boatLogRepository.findById(logId);
    if (!log) throw new NotFoundError("Không tìm thấy nhật ký cabin");
    if (role !== "Admin" && log.userId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền sửa nhật ký này");
    }

    // Xác thực các ràng buộc về nội dung, hình ảnh và ngày giờ cập nhật
    if (dto.content.length > 5000) {
      throw new ValidationError("Nội dung nhật ký cabin không được vượt quá 5000 ký tự.");
    }
    if (dto.images && dto.images.length > 10) {
      throw new ValidationError("Chỉ được đăng tối đa 10 hình ảnh.");
    }
    if (dto.landingTime) {
      const lTime = new Date(dto.landingTime);
      if (isNaN(lTime.getTime())) {
        throw new ValidationError("Thời gian cập bến không hợp lệ.");
      }
      if (lTime > new Date()) {
        throw new ValidationError("Thời gian cập bến không thể ở tương lai.");
      }
    }

    const nextImages = dto.images || [];
    const removedImages = log.images.filter((url) => !nextImages.includes(url));
    log.update(dto.content, nextImages, {
      boatName: dto.boatName?.trim() || undefined,
      catchArea: dto.catchArea?.trim() || undefined,
      landingTime: dto.landingTime ? new Date(dto.landingTime) : undefined,
      origin: dto.origin?.trim() || undefined,
    });
    await this.boatLogRepository.save(log);

    await Promise.all(
      removedImages.map(async (url) => {
        const publicId = extractPublicId(url);
        if (!publicId) return;
        await deleteFromCloudinary(publicId).catch((error) => {
          logger.error(`Không thể xóa ảnh BoatLog ${publicId}: ${error.message}`);
        });
      }),
    );

    return log;
  }
}

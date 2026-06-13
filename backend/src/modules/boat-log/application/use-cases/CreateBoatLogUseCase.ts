import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
import { BoatLog } from "../../domain/entities/BoatLog";
import { userRepository } from "../../../../repositories/user.repository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Request DTO cho việc đăng Nhật ký Cabin.
 */
export interface CreateBoatLogRequestDTO {
  content: string;
  images?: string[];
}

/**
 * Use Case đăng tải Nhật ký Cabin mới.
 * Nghiệp vụ: Chỉ có Admin, tài khoản Premium hoặc ngư thuyền đã xác minh danh tính mới được quyền sử dụng tính năng này.
 */
export class CreateBoatLogUseCase {
  constructor(private boatLogRepository: IBoatLogRepository) {}

  /**
   * Thực thi nghiệp vụ đăng Nhật ký Cabin.
   */
  async execute(userId: string, dto: CreateBoatLogRequestDTO): Promise<BoatLog> {
    // 1. Tìm thông tin người dùng gửi yêu cầu
    const user = await userRepository.findRawById(userId);
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 2. Kiểm duyệt quyền đăng: Chỉ dành cho ngư thuyền đã xác minh danh tính, tài khoản Premium, hoặc Admin.
    if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
      throw new UnauthorizedError(
        "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh hoặc Premium."
      );
    }

    // 3. Tạo mới và lưu thực thể BoatLog
    const boatLog = new BoatLog({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      content: dto.content,
      images: dto.images || [],
      likes: [],
    });

    await this.boatLogRepository.save(boatLog);

    return boatLog;
  }
}

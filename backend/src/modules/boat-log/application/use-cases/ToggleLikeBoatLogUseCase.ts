import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case thực hiện việc Thích/Bỏ thích một Nhật ký Cabin.
 */
export class ToggleLikeBoatLogUseCase {
  constructor(private boatLogRepository: IBoatLogRepository) {}

  /**
   * Thực thi toggle like.
   */
  async execute(logId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const log = await this.boatLogRepository.findById(logId);
    if (!log) {
      throw new NotFoundError("Không tìm thấy nhật ký cabin");
    }

    // Thực thi logic nghiệp vụ qua Domain Entity
    const liked = log.toggleLike(userId);

    // Lưu thực thể mới
    await this.boatLogRepository.save(log);

    return {
      liked,
      likeCount: log.likes.length,
    };
  }
}

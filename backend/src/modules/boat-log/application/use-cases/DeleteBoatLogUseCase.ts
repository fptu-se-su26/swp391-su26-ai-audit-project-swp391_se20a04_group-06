import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa Nhật ký Cabin.
 * Kiểm tra quyền hạn: Chỉ Admin hoặc tác giả của nhật ký mới được phép xóa.
 */
export class DeleteBoatLogUseCase {
  constructor(private boatLogRepository: IBoatLogRepository) {}

  /**
   * Thực thi việc xóa nhật ký cabin.
   */
  async execute(logId: string, userId: string, role: string): Promise<void> {
    const log = await this.boatLogRepository.findById(logId);
    if (!log) {
      throw new NotFoundError("Không tìm thấy nhật ký cabin");
    }

    // Kiểm tra quyền: Chỉ tác giả hoặc Admin mới có quyền xóa nhật ký cabin này
    if (role !== "Admin" && log.userId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền xóa nhật ký này");
    }

    await this.boatLogRepository.delete(log);
  }
}

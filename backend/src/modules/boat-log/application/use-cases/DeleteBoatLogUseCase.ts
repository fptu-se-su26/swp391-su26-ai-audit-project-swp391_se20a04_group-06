// Import giao diện IBoatLogRepository ở tầng Domain để làm cổng tương tác dữ liệu lưu trữ
import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
// Import các lỗi miền nghiệp vụ NotFoundError và UnauthorizedError để ném ra khi vi phạm
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";
import { deleteFromCloudinary } from "../../../../middlewares/upload";
import { extractPublicId } from "../../../../utils/cloudinary";
import { logger } from "../../../../utils/logger";

// Định nghĩa lớp ca sử dụng (Use Case) phụ trách xóa Nhật ký Cabin khỏi hệ thống
export class DeleteBoatLogUseCase {
  // Hàm khởi tạo áp dụng cơ chế Dependency Injection để tiêm Repository thích hợp vào
  constructor(private boatLogRepository: IBoatLogRepository) {}

  // Phương thức thực thi bất đồng bộ nghiệp vụ xóa nhật ký cabin
  async execute(logId: string, userId: string, role: string): Promise<void> {
    // 1. Truy xuất thực thể nhật ký cabin từ database thông qua ID
    const log = await this.boatLogRepository.findById(logId);
    // Nếu không tồn tại nhật ký nào khớp với ID tìm kiếm
    if (!log) {
      // Ném lỗi NotFoundError báo không tìm thấy bài nhật ký tương ứng
      throw new NotFoundError("Không tìm thấy nhật ký cabin");
    }

    // 2. Kiểm duyệt phân quyền xóa: Chỉ cho phép Quản trị viên (Admin) hoặc chính chủ sở hữu bài nhật ký
    if (role !== "Admin" && log.userId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền thực hiện xóa bài viết của người khác
      throw new UnauthorizedError("Bạn không có quyền xóa nhật ký này");
    }

    // 3. Thực thi hành động xóa nhật ký cabin khỏi database thông qua Repository Adapter
    await this.boatLogRepository.delete(log);

    await Promise.all(
      log.images.map(async (url) => {
        const publicId = extractPublicId(url);
        if (!publicId) return;
        await deleteFromCloudinary(publicId).catch((error) => {
          logger.error(`Không thể xóa ảnh BoatLog ${publicId}: ${error.message}`);
        });
      }),
    );
  }
}

// Import giao diện IBoatLogRepository để gọi các phương thức tương tác với database
import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy nhật ký cabin
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

// Định nghĩa lớp ca sử dụng (Use Case) phụ trách nghiệp vụ bật/tắt lượt thích nhật ký cabin
export class ToggleLikeBoatLogUseCase {
  // Hàm khởi tạo nhận vào repository phục vụ Dependency Injection
  constructor(private boatLogRepository: IBoatLogRepository) {}

  // Phương thức thực thi bất đồng bộ nghiệp vụ Thích hoặc Bỏ thích nhật ký cabin
  async execute(logId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // 1. Tìm thực thể nhật ký cabin bằng ID từ database thông qua repository
    const log = await this.boatLogRepository.findById(logId);
    // Nếu không tìm thấy thực thể nhật ký nào khớp ID
    if (!log) {
      // Ném lỗi NotFoundError báo tài nguyên không tồn tại
      throw new NotFoundError("Không tìm thấy nhật ký cabin");
    }

    // 2. Chuyển giao trách nhiệm xử lý logic nghiệp vụ cho phương thức toggleLike của Domain Entity
    const liked = log.toggleLike(userId);

    // 3. Đồng bộ hóa và lưu lại trạng thái mới của thực thể đã được cập nhật likes xuống DB
    await this.boatLogRepository.save(log);

    // 4. Trả về kết quả: trạng thái đã thích (true/false) và tổng số lượt thích hiện thời
    return {
      // Trả về trạng thái thích hiện thời
      liked,
      // Trả về số lượng phần tử ID người thích trong mảng likes
      likeCount: log.likes.length,
    };
  }
}

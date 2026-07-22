// Import giao diện IBoatLogRepository ở tầng Domain để làm cầu nối lưu trữ dữ liệu
import { IBoatLogRepository } from "../../domain/repositories/IBoatLogRepository";
// Import thực thể Domain BoatLog phục vụ khởi tạo đối tượng nhật ký cabin mới
import { BoatLog } from "../../domain/entities/BoatLog";
// Import userRepository dùng chung để lấy dữ liệu thô của người dùng từ MongoDB
import { userRepository } from "../../../../repositories/user.repository";
// Import các ngoại lệ nghiệp vụ NotFoundError, UnauthorizedError và ValidationError để kiểm duyệt và xử lý lỗi
import { NotFoundError, UnauthorizedError, ValidationError } from "../../../../shared/domain/exceptions/DomainException";

// Định nghĩa giao diện DTO chứa cấu trúc dữ liệu đầu vào của yêu cầu tạo nhật ký cabin
export interface CreateBoatLogRequestDTO {
  // Nội dung văn bản của nhật ký cabin (bắt buộc)
  content: string;
  // Mảng chứa các đường dẫn hình ảnh đính kèm (tùy chọn)
  images?: string[];
  boatName?: string;
  catchArea?: string;
  landingTime?: string | null;
  origin?: string;
}

// Định nghĩa lớp ca sử dụng (Use Case) để thực thi nghiệp vụ đăng tải Nhật ký Cabin mới
export class CreateBoatLogUseCase {
  // Hàm khởi tạo áp dụng Dependency Injection để tiêm Repository vào Use Case
  constructor(private boatLogRepository: IBoatLogRepository) {}

  // Phương thức thực thi bất đồng bộ nghiệp vụ đăng ký Nhật ký Cabin
  async execute(userId: string, dto: CreateBoatLogRequestDTO): Promise<BoatLog> {
    // 1. Tìm thông tin chi tiết của người dùng đang gửi yêu cầu từ database
    const user = await userRepository.findRawById(userId);
    // Nếu không tìm thấy thông tin người dùng trong DB
    if (!user) {
      // Ném lỗi NotFoundError báo tài khoản không tồn tại
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 2. Kiểm duyệt phân quyền: Chỉ dành cho ngư dân đã xác minh, tài khoản Premium hoặc Quản trị viên
    if (!user.isVerified && !user.isPremium && user.role !== "Admin") {
      // Ném lỗi UnauthorizedError nếu người dùng không đủ điều kiện phân quyền nghiệp vụ
      throw new UnauthorizedError(
        "Chức năng đăng Nhật ký Cabin chỉ dành cho ngư thuyền đã xác minh hoặc Premium."
      );
    }

    // 2.1. Xác thực các ràng buộc về nội dung, hình ảnh và ngày giờ
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

    // 3. Khởi tạo một thực thể miền Domain BoatLog mới với dữ liệu đã được cấu trúc
    const boatLog = new BoatLog({
      // Gán mã ID người dùng
      userId,
      // Gán tên hiển thị của người viết lấy trực tiếp từ DB
      userName: user.name,
      // Gán ảnh đại diện của người viết (mặc định null nếu trống)
      userAvatar: user.avatar || null,
      // Gán nội dung nhật ký cabin
      content: dto.content,
      // Gán danh sách mảng ảnh đính kèm (mặc định mảng rỗng nếu trống)
      images: dto.images || [],
      // Thiết lập danh sách lượt thích ban đầu là mảng rỗng
      likes: [],
      boatName: dto.boatName?.trim() || undefined,
      catchArea: dto.catchArea?.trim() || undefined,
      landingTime: dto.landingTime ? new Date(dto.landingTime) : undefined,
      origin: dto.origin?.trim() || undefined,
    });

    // 4. Lưu thực thể BoatLog vừa khởi tạo thành công xuống cơ sở dữ liệu qua Repository Adapter
    await this.boatLogRepository.save(boatLog);

    // Trả về đối tượng thực thể BoatLog sau khi đã lưu trữ thành công
    return boatLog;
  }
}

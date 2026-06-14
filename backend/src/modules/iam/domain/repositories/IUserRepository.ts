// Import thực thể miền User
import { User } from "../entities/User";

/**
 * GIAO DIỆN REPOSITORY CỦA USER (IUserRepository)
 * Đây là "Port" trong kiến trúc Lục giác (Hexagonal) / Clean Architecture thuộc tầng Domain,
 * định nghĩa các phương thức giao tiếp với cơ sở dữ liệu mà tầng hạ tầng (Infrastructure) bắt buộc phải triển khai.
 */
export interface IUserRepository {
  // Tìm kiếm người dùng theo ID, trả về đối tượng User hoặc null nếu không tồn tại
  findById(id: string): Promise<User | null>;
  // Tìm kiếm người dùng theo địa chỉ Email
  findByEmail(email: string): Promise<User | null>;
  // Lưu trữ (tạo mới hoặc cập nhật) thực thể User xuống cơ sở dữ liệu
  save(user: User): Promise<void>;
  // Xóa thực thể User khỏi cơ sở dữ liệu
  delete(user: User): Promise<void>;
  // Kiểm tra xem đã tồn tại người dùng nào đăng ký với email này hay chưa
  exists(email: string): Promise<boolean>;
}


// Import thực thể miền BoatLog phục vụ cho việc định nghĩa kiểu dữ liệu trong các phương thức của Interface
import { BoatLog } from "../entities/BoatLog";

// Định nghĩa giao diện IBoatLogRepository làm bản thiết kế giao thức truy xuất dữ liệu ở tầng Domain
export interface IBoatLogRepository {
  // Phương thức tìm kiếm một Nhật ký Cabin dựa trên mã ID duy nhất
  // Trả về một Promise chứa thực thể BoatLog nếu tìm thấy, ngược lại trả về null
  findById(id: string): Promise<BoatLog | null>;

  // Phương thức lưu mới hoặc cập nhật một thực thể Nhật ký Cabin vào cơ sở dữ liệu
  // Nhận vào một thực thể BoatLog và trả về Promise kiểu void (không trả về kết quả)
  save(boatLog: BoatLog): Promise<void>;

  // Phương thức xóa bỏ hoàn toàn một thực thể Nhật ký Cabin khỏi hệ thống lưu trữ
  // Nhận vào một thực thể BoatLog cần xóa và trả về Promise kiểu void
  delete(boatLog: BoatLog): Promise<void>;
}

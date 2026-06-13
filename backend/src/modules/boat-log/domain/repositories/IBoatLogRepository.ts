import { BoatLog } from "../entities/BoatLog";

/**
 * Interface Port đại diện cho các hành vi thao tác dữ liệu của Bounded Context Cabin Log.
 * Hỗ trợ nhóm 4 người trong việc phân tách rõ ràng Domain Core và Infrastructure.
 */
export interface IBoatLogRepository {
  /**
   * Tìm kiếm Nhật ký Cabin bằng ID.
   * @param id ID của nhật ký.
   */
  findById(id: string): Promise<BoatLog | null>;

  /**
   * Lưu hoặc cập nhật một Nhật ký Cabin.
   * @param boatLog Thực thể Cabin Log cần lưu.
   */
  save(boatLog: BoatLog): Promise<void>;

  /**
   * Xóa một Nhật ký Cabin khỏi hệ thống.
   * @param boatLog Thực thể cần xóa.
   */
  delete(boatLog: BoatLog): Promise<void>;
}

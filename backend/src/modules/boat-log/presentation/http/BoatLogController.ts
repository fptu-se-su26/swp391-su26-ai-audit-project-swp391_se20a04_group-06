// Import các kiểu dữ liệu Request, Response, NextFunction từ Express để định nghĩa kiểu cho các hàm xử lý API
import { Request, Response, NextFunction } from "express";
// Import hàm parseId để chuẩn hóa ID từ chuỗi params nhận được
import { parseId } from "../../../../helpers/response.helper";
// Import boatLogService cũ phụ trách truy vấn dữ liệu đọc (Read-Side) nhanh chóng
import { boatLogService } from "../../../../services/boatLog.service";

// DDD Components - Import Repository và các Use Cases nghiệp vụ thuộc module boat-log
import { MongooseBoatLogRepository } from "../../infrastructure/persistence/mongoose/MongooseBoatLogRepository";
// Import Use Case đăng nhật ký cabin mới
import { CreateBoatLogUseCase } from "../../application/use-cases/CreateBoatLogUseCase";
// Import Use Case xóa nhật ký cabin
import { DeleteBoatLogUseCase } from "../../application/use-cases/DeleteBoatLogUseCase";
// Import Use Case thích nhật ký cabin
import { ToggleLikeBoatLogUseCase } from "../../application/use-cases/ToggleLikeBoatLogUseCase";

// Khởi tạo Repository Mongoose duy nhất quản lý DB lưu trữ nhật ký cabin
const boatLogRepository = new MongooseBoatLogRepository();
// Khởi tạo Use Case tạo nhật ký và tiêm Repository vào thông qua constructor (DI)
const createBoatLogUseCase = new CreateBoatLogUseCase(boatLogRepository);
// Khởi tạo Use Case xóa nhật ký và tiêm Repository vào qua constructor (DI)
const deleteBoatLogUseCase = new DeleteBoatLogUseCase(boatLogRepository);
// Khởi tạo Use Case thích nhật ký và tiêm Repository vào qua constructor (DI)
const toggleLikeBoatLogUseCase = new ToggleLikeBoatLogUseCase(boatLogRepository);

// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────
// Tách biệt luồng Đọc: Truy vấn thô từ Service để lấy danh sách nhanh, bỏ qua mappings phức tạp

// Hàm xử lý API lấy danh sách Nhật ký Cabin (có hỗ trợ phân trang và lọc)
export async function getBoatLogs(req: Request, res: Response, next: NextFunction) {
  try {
    // Gọi phương thức list của boatLogService và truyền tất cả các tham số query nhận được từ client
    const result = await boatLogService.list(req.query as any);
    // Trả về kết quả danh sách dưới dạng JSON cho client
    return res.json(result);
  } catch (err) {
    // Chuyển giao lỗi sang Middleware xử lý lỗi tập trung của Express
    next(err);
  }
}

// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────
// Tách biệt luồng Ghi: Bắt buộc phải qua các Use Cases nghiệp vụ để đảm bảo tính toàn vẹn dữ liệu

// Hàm xử lý API tạo mới một bài đăng Nhật ký Cabin
export async function createBoatLog(req: Request, res: Response, next: NextFunction) {
  // Trích xuất mã ID người dùng đăng nhập hiện tại từ đối tượng req.user do Auth Middleware cung cấp
  const { userId } = req.user;
  try {
    // Thực thi ca sử dụng đăng nhật ký cabin và truyền mã người dùng cùng nội dung body gửi lên
    const log = await createBoatLogUseCase.execute(userId, req.body);
    // Trả về mã trạng thái HTTP 201 (Created) kèm thông điệp và dữ liệu thô của nhật ký vừa đăng
    return res.status(201).json({
      // Câu thông báo phản hồi thành công
      message: "Đăng nhật ký cabin thành công",
      // Chuyển đổi thực thể miền sang đối tượng thuần để trả về client
      boatLog: log.toProps(),
    });
  } catch (err) {
    // Gửi lỗi sang Express Global Error Handler để đóng gói JSON lỗi trả về client
    next(err);
  }
}

// Hàm xử lý API Thích hoặc Hủy thích một Nhật ký Cabin
export async function toggleLikeBoatLog(req: Request, res: Response, next: NextFunction) {
  // Chuẩn hóa và chuyển đổi mã ID nhật ký từ chuỗi tham số req.params.id nhận được
  const id = parseId(req.params.id);
  // Trích xuất mã ID người dùng hiện tại từ req.user
  const { userId } = req.user;
  // Nếu ID nhật ký không hợp lệ hoặc không tồn tại
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    // Thực thi ca sử dụng toggle like và truyền ID bài nhật ký cùng ID người thích vào
    const result = await toggleLikeBoatLogUseCase.execute(id, userId);
    // Trả về kết quả thay đổi lượt thích dạng JSON cho client
    return res.json(result);
  } catch (err) {
    // Chuyển giao lỗi phát sinh sang Middleware xử lý lỗi
    next(err);
  }
}

// Hàm xử lý API Xóa một Nhật ký Cabin khỏi hệ thống
export async function deleteBoatLog(req: Request, res: Response, next: NextFunction) {
  // Chuẩn hóa mã ID nhật ký cabin cần xóa từ tham số URL params
  const id = parseId(req.params.id);
  // Trích xuất mã ID người dùng và quyền hạn vai trò hiện tại của tài khoản
  const { userId, role } = req.user;
  // Nếu ID nhật ký không đúng định dạng hoặc bị thiếu
  if (!id) return res.status(400).json({ message: "ID nhật ký không hợp lệ" });

  try {
    // Thực thi ca sử dụng xóa nhật ký cabin và truyền mã bài viết, mã người yêu cầu, vai trò quyền hạn
    await deleteBoatLogUseCase.execute(id, userId, role);
    // Trả về thông báo xóa thành công dạng JSON cho client
    return res.json({ message: "Xóa nhật ký cabin thành công" });
  } catch (err) {
    // Gửi lỗi phát sinh sang Middleware xử lý lỗi
    next(err);
  }
}

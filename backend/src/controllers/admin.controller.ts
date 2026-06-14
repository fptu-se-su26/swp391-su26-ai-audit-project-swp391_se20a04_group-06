// Import kiểu dữ liệu Request và Response từ thư viện Express
import { Request, Response } from "express";
// Import dịch vụ adminService chứa logic xử lý các tác vụ quản trị
import { adminService } from "../services/admin.service";
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
import { sendServerError } from "../helpers/response.helper";
// Import các hàm phân tích tham số phân trang và đóng gói dữ liệu phân trang trả về
import { parsePagination, paginatedResponse } from "../utils/pagination";
// Import logger để ghi nhận vết hoạt động của hệ thống
import { logger } from "../utils/logger";

// HÀM LẤY SỐ LIỆU THỐNG KÊ DASHBOARD CHO ADMIN
export async function getStats(_req: Request, res: Response) {
  try {
    // Gọi adminService lấy thông tin thống kê chung (user, sản phẩm, tin nhắn...)
    const stats = await adminService.getDashboardStats();
    return res.json(stats); // Gửi trả dữ liệu dạng JSON cho Client
  } catch (err) {
    // Ghi log lỗi chi tiết lên console/file log
    logger.error(`getStats error: ${err instanceof Error ? err.message : err}`);
    return sendServerError(res, err); // Trả về lỗi 500 kèm cấu trúc lỗi chuẩn
  }
}

// HÀM LIỆT KÊ TOÀN BỘ SẢN PHẨM TRÊN SÀN (CÓ PHÂN TRANG VÀ TÌM KIẾM)
export async function listAllProducts(req: Request, res: Response) {
  // Phân tích tham số phân trang (page, limit, offset) từ URL Query String
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  // Lấy và chuẩn hóa từ khóa tìm kiếm (search) từ Query String
  const search = ((req.query.search as string) || "").trim();
  // Lấy bộ lọc trạng thái (status) của sản phẩm từ Query String
  const status = (req.query.status as string) || "";

  try {
    // Gọi service lấy danh sách sản phẩm và tổng số lượng khớp bộ lọc
    const { rows, total } = await adminService.listAllProducts(
      search,
      status,
      offset,
      limit,
    );
    // Trả về dữ liệu đóng gói dạng phân trang chuẩn (rows, total, page, limit)
    return res.json(paginatedResponse(rows, total, page, limit));
  } catch (err) {
    return sendServerError(res, err); // Trả về lỗi 500 nếu có sự cố DB
  }
}

// HÀM LIỆT KÊ DANH SÁCH NGƯỜI DÙNG CHO ADMIN (CÓ PHÂN TRANG VÀ TÌM KIẾM)
export async function listUsers(req: Request, res: Response) {
  // Phân tích tham số phân trang từ yêu cầu gửi lên
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
  );
  // Lấy và chuẩn hóa từ khóa tìm kiếm người dùng (theo tên, email)
  const search = ((req.query.search as string) || "").trim();

  try {
    // Gọi service lấy danh sách người dùng và tổng số lượng khớp từ khóa
    const { formattedRows, total } = await adminService.listUsers(
      search,
      offset,
      limit,
    );
    // Gửi trả dữ liệu phân trang cho client
    return res.json(paginatedResponse(formattedRows, total, page, limit));
  } catch (err) {
    return sendServerError(res, err);
  }
}

// HÀM KHOÁ HOẶC KÍCH HOẠT LẠI TÀI KHOẢN NGƯỜI DÙNG (BAN/UNBAN)
export async function toggleUser(req: Request, res: Response) {
  const { id } = req.params; // Lấy ID người dùng từ tham số URL (:id)
  try {
    // Gọi service thay đổi trạng thái kích hoạt (isActive) của người dùng
    const isActive = await adminService.toggleUserActive(id);
    return res.json({ isActive }); // Gửi trả trạng thái mới sau khi cập nhật
  } catch (err: any) {
    // Nếu lỗi có định nghĩa mã status (lỗi nghiệp vụ, ví dụ 404 không thấy user)
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err); // Ném lỗi 500 nếu là sự cố server
  }
}

// HÀM DUYỆT CHỨNG THỰC HOẶC HỦY CHỨNG THỰC NGƯ DÂN (VERIFY/UNVERIFY)
export async function verifyUser(req: Request, res: Response) {
  const { id } = req.params; // Lấy ID người dùng từ tham số URL (:id)
  try {
    // Gọi service đảo ngược trạng thái chứng thực uy tín (isVerified)
    const isVerified = await adminService.toggleUserVerification(id);
    return res.json({
      isVerified,
      // Trả kèm thông điệp trực quan dựa trên trạng thái mới
      message: isVerified ? "Đã xác minh tài khoản" : "Đã thu hồi xác minh",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

// HÀM ADMIN XÓA SẢN PHẨM KHỎI SÀN (VÍ DỤ SẢN PHẨM BỊ BÁO CÁO VI PHẠM)
export async function adminDeleteProduct(req: Request, res: Response) {
  const { id } = req.params; // Lấy ID sản phẩm cần xóa từ URL
  const adminId = req.user.userId; // Lấy ID của Admin thực hiện hành động từ middleware xác thực
  try {
    // Gọi service thực thi hành động xóa sản phẩm với quyền Admin
    await adminService.adminDeleteProduct(id, adminId);
    return res.json({ message: "Admin đã xóa bài đăng thành công" });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

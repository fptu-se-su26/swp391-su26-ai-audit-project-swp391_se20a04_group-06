// Import các kiểu dữ liệu Request và Response từ Express để định nghĩa kiểu cho các API
import { Request, Response } from "express";
// Import reportService chứa logic nghiệp vụ xử lý báo cáo vi phạm
import { reportService } from "../services/report.service";
// Import helper gửi phản hồi lỗi server chuẩn hóa
import { sendServerError } from "../helpers/response.helper";
// Import helper phân tích các tham số phân trang
import { parsePagination } from "../utils/pagination";

/**
 * HÀM NGƯỜI DÙNG GỬI BÁO CÁO VI PHẠM (REPORT PRODUCT) CHO MỘT SẢN PHẨM KHÔNG HỢP LỆ
 */
export async function createReport(req: Request, res: Response) {
  // Lấy ID người dùng thực hiện báo cáo từ token xác thực
  const { userId } = req.user;
  // Lấy ID sản phẩm bị báo cáo từ tham số URL (:productId)
  const { productId } = req.params;
  // Lấy lý do báo cáo (reason) từ body request
  const { reason } = req.body;

  try {
    // Gọi service xử lý tạo bản ghi báo cáo vi phạm mới trong database
    await reportService.createReport(userId, productId, reason);
    // Trả về thông báo thành công cho Client
    return res.json({ message: "Báo cáo đã gửi thành công" });
  } catch (err: any) {
    // Trả về lỗi nghiệp vụ nếu có định nghĩa sẵn status code
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về lỗi server 500 nếu gặp sự cố bất ngờ
    return sendServerError(res, err);
  }
}

/**
 * HÀM TRUY VẤN DANH SÁCH BÁO CÁO VI PHẠM (Dành cho trang Admin, có phân trang và lọc theo trạng thái)
 */
export async function getReports(req: Request, res: Response) {
  // Lấy trạng thái báo cáo cần lọc từ URL Query String (mặc định là "Pending" - Đang chờ xử lý)
  const queryStatus = (req.query.status as string) || "Pending";
  // Kiểm tra tính hợp lệ của trạng thái lọc, chỉ cho phép "Pending", "Resolved", "Dismissed"
  if (!["Pending", "Resolved", "Dismissed"].includes(queryStatus)) {
    return res.status(400).json({ message: "Trạng thái báo cáo không hợp lệ" });
  }

  // Phân tích tham số phân trang từ Query (page, limit) với giới hạn tối đa 100 dòng
  const { page, limit, offset } = parsePagination(
    req.query.page as string,
    req.query.limit as string,
    100,
  );

  try {
    // Gọi service lấy danh sách báo cáo vi phạm khớp trạng thái và phân trang
    const { formattedRows, total } = await reportService.listReports(
      queryStatus as any,
      offset,
      limit,
    );

    // Gắn thêm các header tùy chỉnh chứa siêu dữ liệu phân trang vào response trả về (thông thường admin dashboard cần cái này)
    res.setHeader("X-Total-Count", total.toString());
    res.setHeader("X-Page", page.toString());
    res.setHeader("X-Limit", limit.toString());

    // Trả về danh sách báo cáo vi phạm cho Client dưới dạng JSON
    return res.json(formattedRows);
  } catch (err) {
    return sendServerError(res, err);
  }
}

/**
 * HÀM ADMIN XỬ LÝ BÁO CÁO VI PHẠM (Duyệt báo cáo / Hủy bỏ báo cáo / Xóa sản phẩm vi phạm)
 */
export async function handleReport(req: Request, res: Response) {
  // Lấy ID báo cáo vi phạm cần xử lý từ tham số URL (:id)
  const reportId = req.params.id;
  // Lấy hành động xử lý (action: "Resolve"/"Dismiss") và ghi chú của Admin (adminNote) từ body request
  const { action, adminNote } = req.body;
  // Lấy ID của Admin đang thực hiện thao tác này từ token xác thực
  const adminId = req.user.userId;

  try {
    // Gọi service xử lý báo cáo: cập nhật trạng thái báo cáo, gửi thông báo hoặc xóa bài đăng vi phạm nếu action là Resolve
    await reportService.handleReport(reportId, action, adminNote, adminId);
    // Trả về phản hồi thành công
    return res.json({
      message: "Đã xử lý báo cáo và dọn dẹp tài nguyên thành công!",
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}


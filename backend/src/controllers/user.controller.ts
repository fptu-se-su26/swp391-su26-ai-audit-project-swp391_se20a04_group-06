// Import các kiểu dữ liệu Request và Response từ Express
import { Request, Response } from "express";
// Import userService chứa logic liên quan đến thông tin người dùng
import { userService } from "../services/user.service";
// Import helper gửi lỗi và parse ID từ response helper
import { sendServerError, parseId } from "../helpers/response.helper";

/**
 * HÀM LẤY HỒ SƠ CÔNG KHAI CỦA MỘT NGƯỜI DÙNG (PUBLIC PROFILE)
 */
export async function getUserPublicProfile(req: Request, res: Response) {
  // Trích xuất và phân tích cú pháp ID người dùng từ tham số URL (:id)
  const id = parseId(req.params.id);
  // Validate: Kiểm tra tính hợp lệ của ID người dùng
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    // Gọi service để lấy thông tin hồ sơ công khai (chỉ chứa tên, avatar, ngày tạo... không chứa thông tin nhạy cảm)
    const profile = await userService.getPublicProfile(id);
    // Trả về thông tin hồ sơ dạng JSON cho Client
    return res.json(profile);
  } catch (err: any) {
    // Trả về lỗi nghiệp vụ nếu có định nghĩa sẵn status code
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về lỗi server 500 nếu gặp sự cố bất ngờ
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY BẢNG XẾP HẠNG NGƯ DÂN UY TÍN (LEADERBOARD)
 */
export async function getFishermanLeaderboard(req: Request, res: Response) {
  try {
    // Gọi service lấy danh sách bảng xếp hạng các ngư dân hoạt động tích cực/uy tín nhất
    const leaderboard = await userService.getFishermanLeaderboard();
    // Trả về dữ liệu bảng xếp hạng dạng JSON cho Client
    return res.json(leaderboard);
  } catch (err) {
    return sendServerError(res, err);
  }
}


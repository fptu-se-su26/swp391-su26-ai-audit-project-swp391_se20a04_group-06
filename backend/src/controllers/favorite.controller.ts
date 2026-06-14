// Import kiểu dữ liệu Request và Response từ thư viện Express để định nghĩa kiểu cho tham số hàm
import { Request, Response } from "express";
// Import favoriteService chứa các nghiệp vụ xử lý danh sách yêu thích
import { favoriteService } from "../services/favorite.service";
// Import userRepository để truy vấn trực tiếp thông tin người dùng từ cơ sở dữ liệu
import { userRepository } from "../repositories/user.repository";
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
import { sendServerError } from "../helpers/response.helper";

/**
 * HÀM LẤY DANH SÁCH SẢN PHẨM YÊU THÍCH CỦA TÀI KHOẢN HIỆN TẠI
 */
export async function getMyFavorites(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại đã được giải mã từ JWT token thông qua middleware xác thực
  const { userId } = req.user;
  try {
    // Gọi service để truy vấn danh sách thông tin chi tiết các sản phẩm đã yêu thích
    const favorites = await favoriteService.getMyFavorites(userId);
    // Trả về danh sách sản phẩm yêu thích dưới dạng JSON cho Client
    return res.json(favorites);
  } catch (err: any) {
    // Nếu có mã trạng thái lỗi cụ thể (lỗi nghiệp vụ từ UseCase/Service)
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về lỗi server 500 chuẩn hóa nếu gặp lỗi không xác định
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY DANH SÁCH ID CỦA CÁC SẢN PHẨM ĐÃ YÊU THÍCH (Dùng để kiểm tra nhanh trạng thái thả tim trên UI)
 */
export async function getMyFavoriteIds(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại từ thông tin xác thực của Request
  const { userId } = req.user;
  try {
    // Tìm kiếm thông tin thô của người dùng dựa trên ID
    const user = await userRepository.findRawById(userId);
    // Nếu tìm thấy người dùng thì trả về mảng ID sản phẩm đã yêu thích, ngược lại trả về mảng rỗng
    return res.json(user ? user.favorites : []);
  } catch (err) {
    // Trả về lỗi server 500 nếu gặp sự cố truy vấn
    return sendServerError(res, err);
  }
}

/**
 * HÀM BẬT/TẮT YÊU THÍCH MỘT SẢN PHẨM (THẢ TIM / BỎ THẢ TIM)
 */
export async function toggleFavorite(req: Request, res: Response) {
  // Lấy ID người dùng hiện tại từ thông tin xác thực
  const { userId } = req.user;
  // Lấy ID sản phẩm cần bật/tắt yêu thích từ tham số trên URL (:productId)
  const { productId } = req.params;

  try {
    // Gọi service thực hiện việc bật/tắt yêu thích (thêm vào hoặc xóa khỏi mảng favorites)
    const result = await favoriteService.toggleFavorite(userId, productId);
    // Trả về kết quả xử lý (ví dụ: { favorited: true/false }) cho Client
    return res.json(result);
  } catch (err: any) {
    // Nếu có lỗi nghiệp vụ định nghĩa sẵn status, gửi trả client kèm thông điệp tương ứng
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về lỗi server 500 nếu có sự cố bất ngờ
    return sendServerError(res, err);
  }
}


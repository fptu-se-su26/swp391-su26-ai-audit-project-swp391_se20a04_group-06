// Import kiểu dữ liệu Request và Response từ Express để định nghĩa kiểu cho các hàm xử lý API
import { Request, Response } from "express";
// Import fishermanService chứa các nghiệp vụ truy vấn thông tin ngư dân
import { fishermanService } from "../services/fisherman.service";
// Import helper gửi phản hồi lỗi server (500) chuẩn hóa
import { sendServerError } from "../helpers/response.helper";

/**
 * HÀM LẤY DANH SÁCH CÁC NGƯ DÂN (HỖ TRỢ LỌC VÀ TÌM KIẾM THEO QUERY)
 */
export async function listFishermen(req: Request, res: Response) {
  try {
    // Gọi service lấy danh sách ngư dân dựa trên các tham số tìm kiếm gửi lên từ URL (req.query)
    const result = await fishermanService.list(req.query);
    // Trả về dữ liệu kết quả dưới dạng JSON cho Client
    return res.json(result);
  } catch (err: any) {
    // Trả về mã lỗi 500 kèm thông điệp lỗi cụ thể hoặc thông báo lỗi mặc định
    return res
      .status(500)
      .json({ message: err.message || "Lỗi server khi tải danh sách ngư dân" });
  }
}

/**
 * HÀM LẤY THÔNG TIN HỒ SƠ CHI TIẾT CỦA MỘT NGƯ DÂN THEO ID
 */
export async function getFishermanProfile(req: Request, res: Response) {
  try {
    // Gọi service để lấy hồ sơ chi tiết của ngư dân bằng ID lấy từ tham số URL (:id)
    const profile = await fishermanService.getProfile(req.params.id);
    // Trả về thông tin hồ sơ của ngư dân dạng JSON
    return res.json(profile);
  } catch (err: any) {
    // Nếu có mã trạng thái lỗi nghiệp vụ định nghĩa sẵn, trả về mã trạng thái đó
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    // Trả về mã lỗi 500 nếu gặp sự cố server bất ngờ
    return res
      .status(500)
      .json({ message: "Lỗi server khi tải hồ sơ ngư dân" });
  }
}

/**
 * HÀM LẤY DANH SÁCH SẢN PHẨM (HẢI SẢN) CỦA MỘT NGƯ DÂN (CÓ PHÂN TRANG VÀ LỌC BÀI HẾT HẠN)
 */
export async function getFishermanProducts(req: Request, res: Response) {
  try {
    // Lấy ID ngư dân từ tham số URL (:id)
    const { id } = req.params;
    // Lấy các tham số phân trang và lọc từ Query String (page, limit, includeExpired)
    const { page, limit, includeExpired } = req.query as any;
    
    // Gọi service lấy danh sách sản phẩm của ngư dân tương ứng
    const {
      products,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getProducts(id, page, limit, includeExpired);
    
    // Trả về kết quả phân trang chuẩn hóa cho Client
    return res.json({
      data: products,                          // Danh sách sản phẩm của trang hiện tại
      page: p,                                 // Số trang hiện tại
      limit: l,                                // Số lượng sản phẩm giới hạn trên mỗi trang
      total,                                   // Tổng số lượng sản phẩm thỏa mãn điều kiện
      totalPages: Math.ceil(total / l),        // Tính toán tổng số trang
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY DANH SÁCH CÔNG THỨC CHẾ BIẾN CỦA MỘT NGƯ DÂN (CÓ PHÂN TRANG)
 */
export async function getFishermanRecipes(req: Request, res: Response) {
  try {
    // Lấy ID ngư dân từ tham số URL (:id)
    const { id } = req.params;
    // Lấy tham số phân trang từ Query String
    const { page, limit } = req.query as any;
    
    // Gọi service lấy danh sách công thức do ngư dân này chia sẻ
    const {
      recipes,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getRecipes(id, page, limit);
    
    // Trả về kết quả phân trang công thức nấu ăn
    return res.json({
      data: recipes,                           // Mảng danh sách công thức
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY DANH SÁCH BÀI VIẾT (TIN TỨC/DIỄN ĐÀN) CỦA MỘT NGƯ DÂN (CÓ PHÂN TRANG)
 */
export async function getFishermanPosts(req: Request, res: Response) {
  try {
    // Lấy ID ngư dân từ tham số URL (:id)
    const { id } = req.params;
    // Lấy tham số phân trang từ Query String
    const { page, limit } = req.query as any;
    
    // Gọi service lấy danh sách bài đăng của ngư dân này
    const {
      posts,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getPosts(id, page, limit);
    
    // Trả về kết quả phân trang bài viết
    return res.json({
      data: posts,                             // Mảng danh sách bài viết
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}

/**
 * HÀM LẤY DANH SÁCH NHẬT KÝ ĐI BIỂN (BÁO CÁO NGUỒN GỐC HẢI SẢN) CỦA MỘT NGƯ DÂN
 */
export async function getFishermanBoatLogs(req: Request, res: Response) {
  try {
    // Lấy ID ngư dân từ tham số URL (:id)
    const { id } = req.params;
    // Lấy tham số phân trang từ Query String
    const { page, limit } = req.query as any;
    
    // Gọi service để lấy danh sách nhật ký chuyến đi biển của tàu cá tương ứng
    const {
      boatLogs,
      total,
      page: p,
      limit: l,
    } = await fishermanService.getBoatLogs(id, page, limit);
    
    // Trả về kết quả phân trang nhật ký hành trình đi biển
    return res.json({
      data: boatLogs,                          // Mảng danh sách nhật ký hành trình
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    });
  } catch (err: any) {
    if (err.status)
      return res.status(err.status).json({ message: err.message });
    return sendServerError(res, err);
  }
}


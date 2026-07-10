// Nạp cấu hình các biến môi trường từ file .env
import "dotenv/config";
// Import các kiểu dữ liệu của Express để làm tham số cho middleware
import { Request, Response, NextFunction } from "express";
// Import thư viện jsonwebtoken để giải mã và xác thực mã JWT
import jwt from "jsonwebtoken";
import { User } from "../models/User";

/**
 * MIDDLEWARE XÁC THỰC TÀI KHOẢN NGƯỜI DÙNG (AUTHENTICATE)
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Chỉ chấp nhận và trích xuất token từ HttpOnly cookie để chống lại các cuộc tấn công XSS (Cross-Site Scripting) đánh cắp token
  const token = req.cookies?.token;

  // Nếu không tìm thấy token trong cookies, trả về mã lỗi 401 Unauthorized kèm thông báo chưa đăng nhập
  if (!token) {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" });
  }

  try {
    // KHẮC PHỤC LỖI CHỮ KÝ: Ép buộc sử dụng duy nhất thuật toán đối xứng HS256 để verify token
    // Nhằm ngăn ngừa lỗ hổng thay đổi thuật toán mã hóa (ví dụ: thay sang "none" hoặc thuật toán không đối xứng)
    const payload = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as {
      userId: string;
      role: "User" | "Admin";
      sessionRole?: "buyer" | "seller";
    };
    
    // Gắn thông tin payload đã giải mã thành công (userId, role) vào đối tượng Request để sử dụng ở các controller tiếp theo
    const activeUser = await User.exists({
      _id: payload.userId,
      isActive: true,
    });
    if (!activeUser) {
      return res.status(403).json({
        code: "ACCOUNT_DISABLED",
        message: "Tài khoản đã bị khóa hoặc không còn tồn tại.",
      });
    }
    req.user = payload;
    // Chuyển tiếp yêu cầu sang middleware hoặc controller kế tiếp
    next();
  } catch (err) {
    // Nếu lỗi xảy ra do token đã hết hạn sử dụng
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Phiên làm việc đã hết hạn. Vui lòng làm mới mã truy cập.",
      });
    }
    // Nếu token không hợp lệ (sai chữ ký, bị chỉnh sửa hoặc bị lỗi cấu trúc)
    return res.status(401).json({
      code: "TOKEN_INVALID",
      message: "Mã xác thực không hợp lệ hoặc đã bị thay đổi.",
    });
  }
}

/**
 * MIDDLEWARE PHÂN QUYỀN CHỈ CHO PHÉP ADMIN TRUY CẬP (ADMIN ONLY)
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  // Kiểm tra vai trò của người dùng đã đăng nhập ở middleware authenticate trước đó, nếu không phải Admin thì từ chối truy cập
  if (req.user?.role !== "Admin") {
    // Trả về lỗi 403 Forbidden dạng JSON
    return res
      .status(403)
      .json({ code: "FORBIDDEN", message: "Chỉ Admin mới có quyền này" });
  }
  // Nếu là Admin, cho phép đi tiếp sang controller xử lý nghiệp vụ
  next();
}

/**
 * Bảo vệ các thao tác nghiệp vụ dành riêng cho người bán. Admin luôn được
 * phép; tài khoản thường phải đăng nhập trong phiên "seller".
 */
export function sellerOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "Admin" && req.user?.sessionRole !== "seller") {
    return res.status(403).json({
      code: "SELLER_ONLY",
      message: "Chỉ phiên Ngư dân bán hàng mới có quyền thực hiện thao tác này",
    });
  }
  next();
}


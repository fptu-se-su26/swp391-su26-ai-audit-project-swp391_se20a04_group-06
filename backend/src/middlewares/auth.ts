import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Chỉ chấp nhận token từ HttpOnly cookie để chống tấn công XSS
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" });
  }

  try {
    // KHẮC PHỤC LỖI CHỮ KÝ: Ép buộc sử dụng duy nhất thuật toán mã hóa an toàn đối xứng HS256
    const payload = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as {
      userId: string;
      role: "User" | "Admin";
    };
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Phiên làm việc đã hết hạn. Vui lòng làm mới mã truy cập.",
      });
    }
    return res.status(401).json({
      code: "TOKEN_INVALID",
      message: "Mã xác thực không hợp lệ hoặc đã bị thay đổi.",
    });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "Admin") {
    return res
      .status(403)
      .json({ code: "FORBIDDEN", message: "Chỉ Admin mới có quyền này" });
  }
  next();
}

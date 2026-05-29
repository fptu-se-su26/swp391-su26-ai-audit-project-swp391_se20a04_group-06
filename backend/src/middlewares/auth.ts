import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // [C-04 FIX] Chỉ đọc token từ HttpOnly cookie — KHÔNG chấp nhận Bearer header.
  // Trước đây có fallback đọc Authorization header → phá vỡ toàn bộ thiết kế
  // "token không thể bị đọc bởi JavaScript" vì attacker XSS có thể inject
  // token vào header thay vì cookie.
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string; // Sửa đổi kiểu dữ liệu từ number thành string để khớp với MongoDB ObjectId
      role: "User" | "Admin";
    };
    req.user = payload;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Chỉ Admin mới có quyền này" });
  }
  next();
}

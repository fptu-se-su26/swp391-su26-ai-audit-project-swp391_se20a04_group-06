import "dotenv/config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// middlewares/auth.middleware.ts
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // 1. Lấy token từ cookie (ưu tiên)
  let token = req.cookies?.token;

  // 2. Dự phòng (Fallback): Lấy token từ Authorization Header nếu có
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number;
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

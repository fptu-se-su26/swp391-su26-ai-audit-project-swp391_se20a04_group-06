import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Tạo CSRF token mới và gắn vào cookie
export function generateCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, { httpOnly: false, sameSite: "lax" }); // client đọc được
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies.csrfToken;
  }
  next();
}

// Middleware xác thực CSRF token (cho các method thay đổi dữ liệu)
export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  const clientToken = req.headers["x-csrf-token"] as string;
  const serverToken = req.cookies.csrfToken;
  if (!clientToken || !serverToken || clientToken !== serverToken) {
    return res.status(403).json({ message: "CSRF token không hợp lệ" });
  }
  next();
}

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// [C-03 FIX] CSRF_MAX_AGE sync với refreshToken lifetime (7 ngày).
// Trước đây không có maxAge → CSRF cookie là session cookie → biến mất khi đóng browser
// nhưng refreshToken vẫn còn → user bị 403 Forbidden mọi mutation request.
const CSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function generateCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrfToken", token, {
      httpOnly: false,
      // [C-03 FIX] Đổi từ "lax" → "strict" để đúng với security model và tài liệu README.
      // "lax" cho phép cookie gửi kèm trong cross-site GET → widened attack surface.
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: CSRF_MAX_AGE_MS,
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies.csrfToken;
  }
  next();
}

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  const clientToken = req.headers["x-csrf-token"] as string;
  const serverToken = req.cookies.csrfToken;
  if (!clientToken || !serverToken || clientToken !== serverToken) {
    return res.status(403).json({ message: "CSRF token không hợp lệ" });
  }
  next();
}

/**
 * [C-03 FIX] Rotate CSRF token — gọi sau khi refresh access token thành công.
 * Đảm bảo CSRF token mới được set kèm với access token mới.
 */
export function rotateCsrfToken(res: Response): string {
  const newToken = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", newToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_MAX_AGE_MS,
  });
  return newToken;
}


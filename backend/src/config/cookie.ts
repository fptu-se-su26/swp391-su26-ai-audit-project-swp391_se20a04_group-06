import { CookieOptions } from 'express';

// Cấu hình cookie dùng khi cấp phát JWT Token đăng nhập
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

// Cấu hình cookie dùng khi xóa bỏ token (đăng xuất)
export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

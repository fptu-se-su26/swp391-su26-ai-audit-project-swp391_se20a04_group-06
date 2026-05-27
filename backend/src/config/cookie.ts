import { CookieOptions } from 'express';

/**
 * Cookie options dùng chung — tránh lặp lại cùng object ở register() và login().
 * Pattern: Factory / Constants — một nguồn sự thật duy nhất cho cấu hình cookie.
 *
 * BEFORE: cùng một object cookie lặp lại ở cả register() và login() trong auth.controller.
 * AFTER: import từ đây, thay đổi 1 chỗ áp dụng toàn app.
 */

/** Dùng khi set cookie đăng nhập */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

/** Dùng khi xoá cookie (logout) */
export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

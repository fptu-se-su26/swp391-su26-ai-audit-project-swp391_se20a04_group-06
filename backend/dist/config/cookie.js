"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLEAR_COOKIE_OPTIONS = exports.AUTH_COOKIE_OPTIONS = void 0;
// Cấu hình cookie dùng khi cấp phát JWT Token đăng nhập
exports.AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};
// Cấu hình cookie dùng khi xóa bỏ token (đăng xuất)
exports.CLEAR_COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
};

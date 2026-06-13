// Import kiểu dữ liệu CookieOptions từ Express để thiết lập định dạng cookie phản hồi
import { CookieOptions } from 'express';

/**
 * Cấu hình Cookie dùng chung — Tránh việc khai báo lặp đi lặp lại một đối tượng cấu hình ở nhiều nơi.
 * Mẫu thiết kế (Design Pattern): Constants / Single Source of Truth — Quản lý tập trung các hằng số cấu hình.
 *
 * TRƯỚC ĐÂY: Khai báo đối tượng cookie giống nhau tại nhiều hàm trong controller Auth.
 * SAU KHI SỬA: Import từ tệp tin này, khi cần thay đổi chính sách cookie (ví dụ thời gian hết hạn) chỉ cần sửa tại đây.
 */

/** Cấu hình cookie dùng khi cấp phát Token đăng nhập cho người dùng */
export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  // Bảo mật HttpOnly: Ngăn chặn mã độc Javascript phía Client truy cập cookie này (chống đánh cắp Session qua lỗ hổng XSS)
  httpOnly: true,
  // Bảo mật Secure: Chỉ gửi cookie này qua đường truyền HTTPS đã được mã hóa nếu đang chạy ở Production (máy local dev dùng HTTP thường nên đặt false)
  secure: process.env.NODE_ENV === 'production',
  // Chính sách SameSite 'lax': Bảo vệ chống lại tấn công giả mạo yêu cầu chéo trang (CSRF), vẫn cho phép gửi cookie khi click link chuyển hướng từ trang khác sang
  sameSite: 'lax',
  // Thời gian sống tối đa của cookie được đặt là 7 ngày (7 ngày * 24 giờ * 60 phút * 60 giây * 1000 mili-giây)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
};

/** Cấu hình cookie dùng khi xóa bỏ token (người dùng đăng xuất tài khoản) */
export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  // Thuộc tính httpOnly phải trùng khớp với lúc khởi tạo cookie để trình duyệt định danh đúng cookie cần xóa
  httpOnly: true,
  // Thuộc tính sameSite phải trùng khớp với lúc khởi tạo cookie
  sameSite: 'lax',
  // Thuộc tính secure phải trùng khớp với lúc khởi tạo cookie
  secure: process.env.NODE_ENV === 'production',
};

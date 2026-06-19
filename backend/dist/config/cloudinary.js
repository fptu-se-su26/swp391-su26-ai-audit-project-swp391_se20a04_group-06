"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
// Import thư viện quản lý ảnh/video Cloudinary phiên bản v2
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
/**
 * Khởi tạo cấu hình Cloudinary dạng Singleton.
 * Mẫu thiết kế (Design Pattern): Singleton — Thiết lập cấu hình tại một điểm duy nhất để tránh cấu hình lặp lại.
 *
 * TRƯỚC ĐÂY: Hàm cấu hình cloudinary.config() bị gọi 2 lần ở 2 chỗ khác nhau (trong controller auth và middleware upload).
 * SAU KHI SỬA: Chỉ cấu hình một lần duy nhất tại tệp tin này, sau đó các tệp khác chỉ cần import thực thể `cloudinary` về dùng.
 */
cloudinary_1.v2.config({
    // Tên phân vùng đám mây đọc từ file .env (ví dụ: tên tài khoản Cloudinary của bạn)
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    // Mã khóa API đại diện cho ứng dụng của bạn đọc từ file .env
    api_key: process.env.CLOUDINARY_API_KEY,
    // Khóa bí mật dùng để xác thực quyền tải lên/xóa ảnh đọc từ file .env (cần giữ bí mật tuyệt đối)
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

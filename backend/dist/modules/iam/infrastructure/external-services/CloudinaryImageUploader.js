"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryImageUploader = void 0;
// Import cấu hình Cloudinary để tải ảnh lên máy chủ đám mây
const cloudinary_1 = require("../../../../config/cloudinary");
/**
 * LỚP TẢI ẢNH LÊN CLOUDINARY (CloudinaryImageUploader)
 * Triển khai giao diện IImageUploader ở tầng cơ sở hạ tầng (Infrastructure)
 */
class CloudinaryImageUploader {
    /**
     * TẢI ẢNH ĐẠI DIỆN LÊN CLOUDINARY (TRẢ VỀ URL ẢNH BẢO MẬT)
     */
    async uploadAvatar(buffer) {
        // Bao bọc hàm upload stream của Cloudinary SDK bằng một Promise để sử dụng cú pháp async/await
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.cloudinary.uploader.upload_stream({ folder: "avatars" }, // Lưu trữ ảnh đại diện của người dùng trong thư mục 'avatars' trên Cloudinary
            // Trả về kết quả nếu thành công, ngược lại từ chối với lỗi nhận được
            (error, result) => (result ? resolve(result) : reject(error)));
            // Đẩy dữ liệu buffer của tệp ảnh vào stream để bắt đầu tải lên
            stream.end(buffer);
        });
        // Trả về URL ảnh bảo mật HTTPS, hoặc URL ảnh thông thường làm dự phòng
        return result.secure_url || result.url;
    }
}
exports.CloudinaryImageUploader = CloudinaryImageUploader;

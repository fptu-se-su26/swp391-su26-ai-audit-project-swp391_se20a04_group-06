// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from 'express';
// Import các hàm xử lý tải lên ảnh, xóa ảnh, và tạo chữ ký bảo mật từ image.controller
import { uploadImages, deleteImage } from '../controllers/image.controller';
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from '../middlewares/auth';
// Import middleware cấu hình lưu trữ file tải lên (upload)
import { upload } from '../middlewares/upload';
// Import hàm lấy chữ ký bảo mật chữ ký ký số để tải ảnh trực tiếp lên Cloudinary từ Client
import { getUploadSignature } from '../controllers/image.controller';

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường POST /products/:id/images để tải lên tối đa 5 hình ảnh cho một sản phẩm theo ID (yêu cầu đăng nhập, sử dụng upload.array)
router.post('/products/:id/images', authenticate, upload.array('images', 5), uploadImages);

// Định nghĩa tuyến đường GET /images/signature để lấy chữ ký số Cloudinary phục vụ tải ảnh từ Client-side (yêu cầu đăng nhập)
router.get('/images/signature', authenticate, getUploadSignature);

// Định nghĩa tuyến đường DELETE /images/:id để xóa một hình ảnh theo ID trên hệ thống (yêu cầu đăng nhập)
router.delete('/images/:id', authenticate, deleteImage);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;

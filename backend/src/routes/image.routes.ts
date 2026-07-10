// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from 'express';
// Import các hàm xử lý tải lên ảnh, xóa ảnh, và tạo chữ ký bảo mật từ image.controller
import { uploadImages, uploadContentImages, deleteImage } from '../controllers/image.controller';
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from '../middlewares/auth';
// Import middleware cấu hình lưu trữ file tải lên (upload)
import { upload } from '../middlewares/upload';
// Import hàm lấy chữ ký bảo mật chữ ký ký số để tải ảnh trực tiếp lên Cloudinary từ Client
import { getUploadSignature } from '../controllers/image.controller';

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Ảnh BoatLog/Post/Recipe được upload lên Cloudinary trước, sau đó URL được
// ghi vào document MongoDB bởi API create/update tương ứng.
router.post(
  '/uploads/:scope',
  authenticate,
  upload.array('images', 5),
  uploadContentImages,
);

/**
 * @openapi
 * /api/products/{id}/images:
 *   post:
 *     summary: Tải lên tối đa 5 hình ảnh cho một sản phẩm theo ID (yêu cầu đăng nhập, hỗ trợ multipart/form-data)
 *     tags: [Images]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Mảng chứa các file hình ảnh tải lên (tối đa 5 file)
 *     responses:
 *       200:
 *         description: Tải lên hình ảnh thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc vượt quá số lượng ảnh
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST /products/:id/images để tải lên tối đa 5 hình ảnh cho một sản phẩm theo ID (yêu cầu đăng nhập, sử dụng upload.array)
router.post('/products/:id/images', authenticate, upload.array('images', 5), uploadImages);

/**
 * @openapi
 * /api/images/signature:
 *   get:
 *     summary: Lấy chữ ký số Cloudinary phục vụ tải ảnh từ Client-side (yêu cầu đăng nhập)
 *     tags: [Images]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy chữ ký thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /images/signature để lấy chữ ký số Cloudinary phục vụ tải ảnh từ Client-side (yêu cầu đăng nhập)
router.get('/images/signature', authenticate, getUploadSignature);

/**
 * @openapi
 * /api/images/{id}:
 *   delete:
 *     summary: Xóa một hình ảnh theo ID trên hệ thống (yêu cầu đăng nhập)
 *     tags: [Images]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của hình ảnh cần xóa
 *     responses:
 *       200:
 *         description: Xóa hình ảnh thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy hình ảnh
 */
// Định nghĩa tuyến đường DELETE /images/:id để xóa một hình ảnh theo ID trên hệ thống (yêu cầu đăng nhập)
router.delete('/images/:id', authenticate, deleteImage);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;

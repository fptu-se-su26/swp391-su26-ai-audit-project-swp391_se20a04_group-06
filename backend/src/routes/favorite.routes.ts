// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from 'express';
// Import các hàm xử lý từ favorite.controller để lấy danh sách yêu thích, lấy danh sách ID yêu thích, và bật/tắt yêu thích sản phẩm
import { getMyFavorites, getMyFavoriteIds, toggleFavorite } from '../controllers/favorite.controller';
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from '../middlewares/auth';

// Khởi tạo một đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET / để lấy thông tin chi tiết các sản phẩm trong danh sách yêu thích (yêu cầu đăng nhập)
router.get('/', authenticate, getMyFavorites);

// Định nghĩa tuyến đường GET /ids để lấy danh sách ID của các sản phẩm yêu thích phục vụ cho hiển thị giao diện (yêu cầu đăng nhập)
router.get('/ids', authenticate, getMyFavoriteIds);

// Định nghĩa tuyến đường POST /:productId để bật hoặc tắt trạng thái yêu thích một sản phẩm dựa theo productId (yêu cầu đăng nhập)
router.post('/:productId', authenticate, toggleFavorite);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;

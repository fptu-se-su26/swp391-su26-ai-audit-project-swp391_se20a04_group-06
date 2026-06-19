"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý từ favorite.controller để lấy danh sách yêu thích, lấy danh sách ID yêu thích, và bật/tắt yêu thích sản phẩm
const favorite_controller_1 = require("../controllers/favorite.controller");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Khởi tạo một đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/favorites:
 *   get:
 *     summary: Lấy thông tin chi tiết các sản phẩm trong danh sách yêu thích
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET / để lấy thông tin chi tiết các sản phẩm trong danh sách yêu thích (yêu cầu đăng nhập)
router.get('/', auth_1.authenticate, favorite_controller_1.getMyFavorites);
/**
 * @openapi
 * /api/favorites/ids:
 *   get:
 *     summary: Lấy danh sách ID của các sản phẩm yêu thích phục vụ cho hiển thị giao diện
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách ID thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /ids để lấy danh sách ID của các sản phẩm yêu thích phục vụ cho hiển thị giao diện (yêu cầu đăng nhập)
router.get('/ids', auth_1.authenticate, favorite_controller_1.getMyFavoriteIds);
/**
 * @openapi
 * /api/favorites/{productId}:
 *   post:
 *     summary: Bật hoặc tắt trạng thái yêu thích một sản phẩm dựa theo productId
 *     tags: [Favorites]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái yêu thích thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST /:productId để bật hoặc tắt trạng thái yêu thích một sản phẩm dựa theo productId (yêu cầu đăng nhập)
router.post('/:productId', auth_1.authenticate, favorite_controller_1.toggleFavorite);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý từ fisherman.controller để lấy danh sách và thông tin chi tiết liên quan đến ngư dân
const fisherman_controller_1 = require("../controllers/fisherman.controller");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/fishermen:
 *   get:
 *     summary: Lấy danh sách tất cả ngư dân trong hệ thống
 *     tags: [Fishermen]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
// Định nghĩa tuyến đường GET / lấy danh sách tất cả ngư dân trong hệ thống
router.get("/", fisherman_controller_1.listFishermen);
/**
 * @openapi
 * /api/fishermen/{id}/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ cá nhân của ngư dân dựa theo ID
 *     tags: [Fishermen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của ngư dân
 *     responses:
 *       200:
 *         description: Lấy thông tin hồ sơ thành công
 *       404:
 *         description: Không tìm thấy ngư dân
 */
// Định nghĩa tuyến đường GET /:id/profile lấy hồ sơ thông tin cá nhân của ngư dân dựa theo ID
router.get("/:id/profile", fisherman_controller_1.getFishermanProfile);
/**
 * @openapi
 * /api/fishermen/{id}/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm đăng bán của ngư dân dựa theo ID
 *     tags: [Fishermen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của ngư dân
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       404:
 *         description: Không tìm thấy ngư dân
 */
// Định nghĩa tuyến đường GET /:id/products lấy danh sách sản phẩm của ngư dân dựa theo ID
router.get("/:id/products", fisherman_controller_1.getFishermanProducts);
/**
 * @openapi
 * /api/fishermen/{id}/recipes:
 *   get:
 *     summary: Lấy danh sách công thức nấu ăn của ngư dân dựa theo ID
 *     tags: [Fishermen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của ngư dân
 *     responses:
 *       200:
 *         description: Lấy danh sách công thức thành công
 *       404:
 *         description: Không tìm thấy ngư dân
 */
// Định nghĩa tuyến đường GET /:id/recipes lấy danh sách công thức nấu ăn của ngư dân dựa theo ID
router.get("/:id/recipes", fisherman_controller_1.getFishermanRecipes);
/**
 * @openapi
 * /api/fishermen/{id}/posts:
 *   get:
 *     summary: Lấy danh sách bài viết diễn đàn của ngư dân dựa theo ID
 *     tags: [Fishermen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của ngư dân
 *     responses:
 *       200:
 *         description: Lấy danh sách bài viết thành công
 *       404:
 *         description: Không tìm thấy ngư dân
 */
// Định nghĩa tuyến đường GET /:id/posts lấy danh sách bài viết diễn đàn của ngư dân dựa theo ID
router.get("/:id/posts", fisherman_controller_1.getFishermanPosts);
/**
 * @openapi
 * /api/fishermen/{id}/boat-logs:
 *   get:
 *     summary: Lấy danh sách nhật ký cabin của ngư dân dựa theo ID
 *     tags: [Fishermen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của ngư dân
 *     responses:
 *       200:
 *         description: Lấy danh sách nhật ký thành công
 *       404:
 *         description: Không tìm thấy ngư dân
 */
// Định nghĩa tuyến đường GET /:id/boat-logs lấy danh sách nhật ký cabin của ngư dân dựa theo ID
router.get("/:id/boat-logs", fisherman_controller_1.getFishermanBoatLogs);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
